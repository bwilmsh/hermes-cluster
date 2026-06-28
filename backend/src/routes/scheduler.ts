import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { authMiddleware, type AuthedRequest } from "../lib/auth";

export const schedulerRouter = Router();
schedulerRouter.use(authMiddleware);

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().or(z.date()),
  endTime: z.string().optional().or(z.date()),
  location: z.string().optional(),
  itemType: z.enum(["EVENT", "TASK", "APPOINTMENT", "HABIT"]).default("TASK"),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  tags: z.array(z.string()).optional().default([]),
  assignee: z.string().optional(),
  habitId: z.string().optional(),
  habitEntryId: z.string().optional(),
});

function toISO(v: unknown): Date {
  return new Date(v as string);
}

// GET /api/scheduler/events?from=&to=&itemType=&status=
schedulerRouter.get("/events", async (req: AuthedRequest, res: Response) => {
  const from = req.query.from ? new Date(req.query.from as string) : new Date();
  const to = req.query.to ? new Date(req.query.to as string) : new Date(Date.now() + 7 * 24 * 3600 * 1000);
  const itemType = req.query.itemType as string | undefined;
  const status = req.query.status as string | undefined;

  const events = await prisma.event.findMany({
    where: {
      userId: req.user!.id,
      startTime: { gte: from, lte: to },
      ...(itemType ? { itemType: itemType as any } : {}),
      ...(status ? { status: status as any } : {}),
    },
    orderBy: { startTime: "asc" },
  });
  res.json({ events });
});

schedulerRouter.post("/events", async (req: AuthedRequest, res: Response) => {
  const parsed = createEventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  const data = parsed.data;
  const event = await prisma.event.create({
    data: {
      ...data,
      startTime: toISO(data.startTime),
      endTime: data.endTime ? toISO(data.endTime) : null,
      userId: req.user!.id,
    },
  });
  res.status(201).json({ event });
});

schedulerRouter.put("/events/:id", async (req: AuthedRequest, res: Response) => {
  const update = { ...req.body } as Record<string, unknown>;
  if (update.startTime) update.startTime = toISO(update.startTime);
  if (update.endTime) update.endTime = toISO(update.endTime);
  const event = await prisma.event.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: update,
  });
  if (event.count === 0) return res.status(404).json({ error: "Event not found" });
  res.json({ ok: true });
});

schedulerRouter.delete("/events/:id", async (req: AuthedRequest, res: Response) => {
  await prisma.event.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
  res.json({ ok: true });
});
