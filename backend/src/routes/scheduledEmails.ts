import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { authMiddleware, type AuthedRequest } from "../lib/auth";

export const scheduledEmailsRouter = Router();
scheduledEmailsRouter.use(authMiddleware);

const schema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  sendAt: z.string().or(z.date()),
});

scheduledEmailsRouter.get("/", async (req: AuthedRequest, res: Response) => {
  const emails = await prisma.scheduledEmail.findMany({
    where: { userId: req.user!.id },
    orderBy: { sendAt: "desc" },
  });
  res.json({ emails });
});

scheduledEmailsRouter.post("/", async (req: AuthedRequest, res: Response) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const d = parsed.data;
  const email = await prisma.scheduledEmail.create({
    data: { to: d.to, subject: d.subject, body: d.body, sendAt: new Date(d.sendAt), userId: req.user!.id },
  });
  res.status(201).json({ email });
});

scheduledEmailsRouter.delete("/:id", async (req: AuthedRequest, res: Response) => {
  await prisma.scheduledEmail.deleteMany({
    where: { id: req.params.id, userId: req.user!.id },
  });
  res.json({ ok: true });
});
