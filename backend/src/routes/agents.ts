import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { authMiddleware, type AuthedRequest } from "../lib/auth";
import { startSse, sendEvent, endSse, errorSse } from "../lib/sse";
import { postJsonSse, postJson } from "../lib/http";

export const agentsRouter = Router();
agentsRouter.use(authMiddleware);

const PYTHON_URL = process.env.PYTHON_SERVICE_URL ?? "http://localhost:8000";

const createAgentSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional().default("general"),
  setupAnswers: z.record(z.unknown()).optional(),
});

agentsRouter.get("/", async (req: AuthedRequest, res: Response) => {
  const agents = await prisma.agent.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });
  res.json({ agents });
});

agentsRouter.post("/", async (req: AuthedRequest, res: Response) => {
  const parsed = createAgentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const agent = await prisma.agent.create({
      data: { ...parsed.data, setupAnswers: parsed.data.setupAnswers as any, userId: req.user!.id },
    });
  res.status(201).json({ agent });
});

agentsRouter.get("/:id", async (req: AuthedRequest, res: Response) => {
  const agent = await prisma.agent.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 50 } },
  });
  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }
  res.json({ agent });
});

agentsRouter.put("/:id", async (req: AuthedRequest, res: Response) => {
  const agent = await prisma.agent.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: req.body,
  });
  if (agent.count === 0) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }
  res.json({ ok: true });
});

agentsRouter.delete("/:id", async (req: AuthedRequest, res: Response) => {
  await prisma.agent.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
  res.json({ ok: true });
});

// SSE chat — proxies to the Python agent service, stores the user message, streams back.
agentsRouter.post("/:id/chat", async (req: AuthedRequest, res: Response) => {
  const { message } = req.body as { message: string };
  if (!message?.trim()) {
    return res.status(400).json({ error: "Message required" });
  }
  const agent = await prisma.agent.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 10, select: { role: true, content: true } },
    },
  });
  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }

  // Persist the user message immediately.
  await prisma.message.create({
    data: { agentId: agent.id, userId: req.user!.id, role: "user", content: message },
  });

  startSse(res);
  try {
    await postJsonSse(
      `${PYTHON_URL}/chat`,
      {
        agentId: agent.id,
        message,
        history: agent.messages.reverse().map((m) => ({ role: m.role, content: m.content })),
        businessContext: agent.memory ?? "",
        agentName: agent.name,
        agentRole: agent.role,
      },
      (chunk) => {
        // Pass through SSE chunks from Python.
        res.write(chunk);
      }
    );
    // After stream completes, persist the assistant reply. We approximate by storing the last streamed text.
    // (The Python service emits a single 'final' event we could use; for v1 we rely on the SSE passthrough.)
    endSse(res);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Agent service unavailable";
    errorSse(res, msg);
  }
});

// Generate setup questions for a new agent (proxies to Python).
agentsRouter.post("/generate-questions", async (req: AuthedRequest, res: Response) => {
  try {
    const result = await postJson<{ questions: string[] }>(`${PYTHON_URL}/generate-questions`, {
      context: req.body.context ?? "",
    });
    res.json(result);
  } catch {
    // Fallback questions if Python service is down.
    res.json({
      questions: [
        "What is your primary role or job title?",
        "What are your top 3 recurring tasks each week?",
        "What time do you usually start and end your workday?",
        "Which tools do you already use for planning?",
      ],
    });
  }
});
