import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { hashPassword, comparePassword, signToken, authMiddleware, type AuthedRequest } from "../lib/auth";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional().default(""),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/register", async (req: AuthedRequest, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const { email, password, name } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } }).catch(() => null);
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, name, passwordHash, plan: "FREE" },
    select: { id: true, email: true, name: true, plan: true },
  });
  const token = signToken(user);
  res.status(201).json({ token, user });
});

authRouter.post("/login", async (req: AuthedRequest, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } }).catch(() => null);
  if (!user?.passwordHash) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = signToken({ id: user.id, email: user.email, plan: user.plan });
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
  });
});

authRouter.get("/me", authMiddleware, async (req: AuthedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, name: true, plan: true, createdAt: true },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});
