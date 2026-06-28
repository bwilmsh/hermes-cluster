import { Router, type Response } from "express";
import { prisma } from "../db";
import { authMiddleware, type AuthedRequest } from "../lib/auth";

export const filesRouter = Router();
filesRouter.use(authMiddleware);

filesRouter.get("/:agentId", async (req: AuthedRequest, res: Response) => {
  const files = await prisma.agentFile.findMany({
    where: { agentId: req.params.agentId, agent: { userId: req.user!.id } },
  });
  res.json({ files });
});

filesRouter.post("/:agentId/upload", async (req: AuthedRequest, res: Response) => {
  const { fileName, fileType, content } = req.body as { fileName: string; fileType: string; content: string };
  const agent = await prisma.agent.findFirst({
    where: { id: req.params.agentId, userId: req.user!.id },
    select: { id: true },
  });
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  const file = await prisma.agentFile.create({
    data: { agentId: agent.id, fileName, fileType, content },
  });
  res.status(201).json({ file });
});
