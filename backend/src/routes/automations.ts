import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { authMiddleware, type AuthedRequest } from "../lib/auth";

export const automationsRouter = Router();
automationsRouter.use(authMiddleware);

const schema = z.object({
  name: z.string().min(1),
  agentId: z.string().min(1),
  templateId: z.string().optional(),
  goal: z.string().optional(),
  variables: z.record(z.unknown()).default({}),
  schedule: z.string().optional(),
  active: z.boolean().default(true),
  deliveryType: z.enum(["CHAT", "EMAIL"]).default("CHAT"),
  deliveryTarget: z.string().optional(),
});

automationsRouter.get("/templates", async (_req: AuthedRequest, res: Response) => {
  const templates = await prisma.automationTemplate.findMany({ orderBy: { name: "asc" } });
  res.json({ templates });
});

automationsRouter.get("/", async (req: AuthedRequest, res: Response) => {
  const automations = await prisma.automation.findMany({
    where: { userId: req.user!.id },
    include: { template: true, agent: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ automations });
});

automationsRouter.post("/", async (req: AuthedRequest, res: Response) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const d = parsed.data;
  const automation = await prisma.automation.create({
    data: { name: d.name, agentId: d.agentId, templateId: d.templateId, goal: d.goal, variables: d.variables, schedule: d.schedule, active: d.active, deliveryType: d.deliveryType, deliveryTarget: d.deliveryTarget, userId: req.user!.id },
  });
  res.status(201).json({ automation });
});

automationsRouter.put("/:id", async (req: AuthedRequest, res: Response) => {
  const result = await prisma.automation.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: req.body,
  });
  if (result.count === 0) return res.status(404).json({ error: "Automation not found" });
  res.json({ ok: true });
});

automationsRouter.delete("/:id", async (req: AuthedRequest, res: Response) => {
  await prisma.automation.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
  res.json({ ok: true });
});

automationsRouter.post("/:id/run", async (req: AuthedRequest, res: Response) => {
  const automation = await prisma.automation.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!automation) return res.status(404).json({ error: "Automation not found" });
  const run = await prisma.automationRun.create({
    data: { automationId: automation.id, status: "RUNNING" },
  });
  await prisma.automationRun.update({
    where: { id: run.id },
    data: { status: "SUCCESS", completedAt: new Date(), finalResult: `Ran automation "${automation.name}"` },
  });
  await prisma.automation.update({
    where: { id: automation.id },
    data: { lastRunAt: new Date(), lastRunStatus: "SUCCESS", lastRunResult: "ok" },
  });
  res.json({ run });
});
