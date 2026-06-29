import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { authMiddleware, type AuthedRequest } from "../lib/auth";

export const widgetsRouter = Router();
widgetsRouter.use(authMiddleware);

const schema = z.object({
  title: z.string().min(1),
  type: z.enum(["STAT", "AGENTS_GRID", "ACTIVITY_FEED", "AGENT_MEMORY", "TEXT"]),
  config: z.record(z.unknown()).default({}),
  size: z.enum(["sm", "md", "lg"]).default("md"),
  order: z.number().int().default(0),
});

widgetsRouter.get("/", async (req: AuthedRequest, res: Response) => {
  const widgets = await prisma.widget.findMany({
    where: { userId: req.user!.id },
    orderBy: { order: "asc" },
  });
  res.json({ widgets });
});

widgetsRouter.post("/", async (req: AuthedRequest, res: Response) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const widget = await prisma.widget.create({
    data: { ...parsed.data, config: parsed.data.config as any, userId: req.user!.id },
  });
  res.status(201).json({ widget });
});

widgetsRouter.put("/:id", async (req: AuthedRequest, res: Response) => {
  const result = await prisma.widget.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: req.body,
  });
  if (result.count === 0) return res.status(404).json({ error: "Widget not found" });
  res.json({ ok: true });
});

widgetsRouter.delete("/:id", async (req: AuthedRequest, res: Response) => {
  await prisma.widget.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
  res.json({ ok: true });
});
