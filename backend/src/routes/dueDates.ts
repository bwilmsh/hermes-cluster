import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { authMiddleware, type AuthedRequest } from "../lib/auth";

export const dueDatesRouter = Router();
dueDatesRouter.use(authMiddleware);

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().or(z.date()),
  dueTime: z.string().default("09:00"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  status: z.enum(["PENDING", "COMPLETED", "OVERDUE"]).default("PENDING"),
  category: z.enum(["ASSIGNMENT", "EXAM", "WORK", "PERSONAL"]).default("PERSONAL"),
});

dueDatesRouter.get("/", async (req: AuthedRequest, res: Response) => {
  const dueDates = await prisma.dueDate.findMany({
    where: { userId: req.user!.id },
    orderBy: { dueDate: "asc" },
  });
  res.json({ dueDates });
});

dueDatesRouter.post("/", async (req: AuthedRequest, res: Response) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
  const { dueDate, ...data } = parsed.data;
  const due = await prisma.dueDate.create({
    data: { ...data, dueDate: new Date(dueDate), userId: req.user!.id },
  });
  res.status(201).json({ dueDate: due });
});

dueDatesRouter.put("/:id", async (req: AuthedRequest, res: Response) => {
  const update = { ...req.body } as Record<string, unknown>;
  if (update.dueDate) update.dueDate = new Date(update.dueDate as string);
  const result = await prisma.dueDate.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: update,
  });
  if (result.count === 0) return res.status(404).json({ error: "Due date not found" });
  res.json({ ok: true });
});

dueDatesRouter.delete("/:id", async (req: AuthedRequest, res: Response) => {
  await prisma.dueDate.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
  res.json({ ok: true });
});
