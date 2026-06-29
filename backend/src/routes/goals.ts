import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { authMiddleware, type AuthedRequest } from "../lib/auth";

export const goalsRouter = Router();
goalsRouter.use(authMiddleware);

const createGoalSchema = z.object({
  goalText: z.string().min(1),
  deadline: z.string().optional().or(z.date()),
  isActive: z.boolean().optional().default(true),
  visibleAgentIds: z.array(z.string()).optional().default([]),
  autoRun: z
    .object({
      enabled: z.boolean().default(false),
      actionType: z.enum(["SEND_EMAIL", "CREATE_CALENDAR_EVENT", "MARK_TASK_COMPLETE", "SEND_NOTIFICATION"]),
      config: z.record(z.unknown()).default({}),
    })
    .optional(),
});

goalsRouter.get("/", async (req: AuthedRequest, res: Response) => {
  const goals = await prisma.goal.findMany({
    where: { userId: req.user!.id },
    include: { autoRun: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ goals });
});

goalsRouter.post("/", async (req: AuthedRequest, res: Response) => {
  const parsed = createGoalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const { autoRun, deadline, ...data } = parsed.data;
  const goal = await prisma.goal.create({
    data: {
      ...data,
      ...(deadline ? { deadline: new Date(deadline) } : {}),
      userId: req.user!.id,
      autoRun: autoRun ? { create: { ...autoRun, config: autoRun.config as any } } : undefined,
    },
    include: { autoRun: true },
  });
  res.status(201).json({ goal });
});

goalsRouter.put("/:id", async (req: AuthedRequest, res: Response) => {
  const update = { ...req.body } as Record<string, unknown>;
  if (update.deadline) update.deadline = new Date(update.deadline as string);
  const goal = await prisma.goal.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: update,
  });
  if (goal.count === 0) return res.status(404).json({ error: "Goal not found" });
  res.json({ ok: true });
});

goalsRouter.delete("/:id", async (req: AuthedRequest, res: Response) => {
  await prisma.goal.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
  res.json({ ok: true });
});
