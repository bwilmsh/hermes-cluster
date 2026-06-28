import { Router, type Response } from "express";
import { prisma } from "../db";
import { authMiddleware, type AuthedRequest } from "../lib/auth";

export const memoriesRouter = Router();
memoriesRouter.use(authMiddleware);

memoriesRouter.get("/:agentId", async (req: AuthedRequest, res: Response) => {
  const agent = await prisma.agent.findFirst({
    where: { id: req.params.agentId, userId: req.user!.id },
    select: { memory: true },
  });
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  res.json({ memory: agent.memory ?? "" });
});

memoriesRouter.put("/:agentId", async (req: AuthedRequest, res: Response) => {
  const { memory } = req.body as { memory: string };
  const result = await prisma.agent.updateMany({
    where: { id: req.params.agentId, userId: req.user!.id },
    data: { memory },
  });
  if (result.count === 0) return res.status(404).json({ error: "Agent not found" });
  res.json({ ok: true });
});
