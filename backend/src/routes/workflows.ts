import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { authMiddleware, type AuthedRequest } from "../lib/auth";

export const workflowsRouter = Router();
workflowsRouter.use(authMiddleware);

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  nodes: z.array(z.unknown()).default([]),
  edges: z.array(z.unknown()).default([]),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]).default("DRAFT"),
});

workflowsRouter.get("/", async (req: AuthedRequest, res: Response) => {
  const workflows = await prisma.workflow.findMany({
    where: { userId: req.user!.id },
    orderBy: { updatedAt: "desc" },
  });
  res.json({ workflows });
});

workflowsRouter.post("/", async (req: AuthedRequest, res: Response) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const d = parsed.data;
  const workflow = await prisma.workflow.create({
    data: { name: d.name, description: d.description, nodes: d.nodes as any, edges: d.edges as any, status: d.status, userId: req.user!.id },
  });
  res.status(201).json({ workflow });
});

workflowsRouter.put("/:id", async (req: AuthedRequest, res: Response) => {
  const result = await prisma.workflow.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: req.body,
  });
  if (result.count === 0) return res.status(404).json({ error: "Workflow not found" });
  res.json({ ok: true });
});

workflowsRouter.delete("/:id", async (req: AuthedRequest, res: Response) => {
  await prisma.workflow.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
  res.json({ ok: true });
});

workflowsRouter.post("/:id/run", async (req: AuthedRequest, res: Response) => {
  const wf = await prisma.workflow.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
  if (!wf) return res.status(404).json({ error: "Workflow not found" });
  const run = await prisma.workflowRun.create({
    data: { workflowId: wf.id, status: "SUCCESS", completedAt: new Date(), result: `Ran "${wf.name}"` },
  });
  await prisma.workflow.update({
    where: { id: wf.id },
    data: { lastRunAt: new Date(), lastRunStatus: "SUCCESS" },
  });
  res.json({ run });
});
