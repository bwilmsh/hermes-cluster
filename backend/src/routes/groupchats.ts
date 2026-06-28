import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { authMiddleware, type AuthedRequest } from "../lib/auth";
import { startSse, sendEvent, endSse, errorSse } from "../lib/sse";
import { postJsonSse } from "../lib/http";

export const groupchatsRouter = Router();
groupchatsRouter.use(authMiddleware);

const PYTHON_URL = process.env.PYTHON_SERVICE_URL ?? "http://localhost:8000";

const createSchema = z.object({
  name: z.string().min(1),
  memberAgentIds: z.array(z.string()).optional().default([]),
});

groupchatsRouter.get("/", async (req: AuthedRequest, res: Response) => {
  const groups = await prisma.groupChat.findMany({
    where: { userId: req.user!.id },
    include: { members: true },
    orderBy: { updatedAt: "desc" },
  });
  res.json({ groupChats: groups });
});

groupchatsRouter.post("/", async (req: AuthedRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }
  const { name, memberAgentIds } = parsed.data;
  const group = await prisma.groupChat.create({
    data: {
      name,
      userId: req.user!.id,
      members: {
        create: [
          { type: "user", name: req.user!.email, userId: req.user!.id },
          ...memberAgentIds.map((agentId) => ({ type: "agent" as const, agentId, name: "agent" })),
        ],
      },
    },
    include: { members: { include: { agent: true } } },
  });
  // Patch member names with actual agent names.
  await Promise.all(
    group.members
      .filter((m) => m.agentId && m.agent)
      .map((m) => prisma.groupChatMember.update({ where: { id: m.id }, data: { name: m.agent!.name } }))
  );
  res.status(201).json({ groupChat: group });
});

groupchatsRouter.get("/:id", async (req: AuthedRequest, res: Response) => {
  const group = await prisma.groupChat.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: {
      members: { include: { agent: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 100 },
    },
  });
  if (!group) return res.status(404).json({ error: "Group not found" });
  res.json({ groupChat: group });
});

// Detect @AgentName mentions and return the agents to invoke in order (waterfall).
function detectHandoff(message: string, members: { name: string; agentId: string | null }[]): string[] {
  const mentioned = members.filter((m) => m.agentId && new RegExp(`@${m.name}\\b`, "i").test(message));
  return mentioned.map((m) => m.agentId!);
}

groupchatsRouter.post("/:id/message", async (req: AuthedRequest, res: Response) => {
  const { message } = req.body as { message: string };
  if (!message?.trim()) return res.status(400).json({ error: "Message required" });
  const group = await prisma.groupChat.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { members: { include: { agent: true } }, messages: { take: 10, orderBy: { createdAt: "desc" }, select: { role: true, content: true, senderName: true } } },
  });
  if (!group) return res.status(404).json({ error: "Group not found" });

  // Persist user message.
  await prisma.groupChatMessage.create({
    data: { groupChatId: group.id, senderName: req.user!.email, senderRole: "user", role: "user", content: message },
  });

  const mentionedAgentIds = detectHandoff(
    message,
    group.members.map((m) => ({ name: m.name, agentId: m.agentId }))
  );
  // If no @mention, address all agent members in the room.
  const targetAgentIds =
    mentionedAgentIds.length > 0
      ? mentionedAgentIds
      : group.members.filter((m) => m.agentId).map((m) => m.agentId!);

  const mentionedAgents = targetAgentIds
    .map((id) => group.members.find((m) => m.agentId === id))
    .filter((m): m is NonNullable<typeof m> => !!m && !!m.agent)
    .map((m) => ({ id: m.agent!.id, name: m.agent!.name, role: m.agent!.role }));

  startSse(res);
  try {
    // Waterfall: call each agent in sequence.
    for (const agent of mentionedAgents) {
      sendEvent(res, { type: "agent", agentId: agent.id, agentName: agent.name });
      await postJsonSse(
        `${PYTHON_URL}/group-chat`,
        {
          message,
          mentionedAgents: mentionedAgents.map((a) => ({ id: a.id, name: a.name, role: a.role })),
          activeAgentId: agent.id,
          activeAgentName: agent.name,
          groupId: group.id,
          history: group.messages.reverse().map((m) => ({ role: m.role, content: m.content, senderName: m.senderName })),
        },
        (chunk) => res.write(chunk)
      );
    }
    endSse(res);
  } catch (err) {
    errorSse(res, err instanceof Error ? err.message : "Agent service unavailable");
  }
});

export { detectHandoff };
