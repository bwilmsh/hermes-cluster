import { Router, type Response } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { authMiddleware, type AuthedRequest } from "../lib/auth";
import { encryptToString, decryptFromString } from "../lib/crypto";

export const credentialsRouter = Router();
credentialsRouter.use(authMiddleware);

const schema = z.object({
  siteName: z.string().min(1),
  siteUrl: z.string().url(),
  username: z.string(),
  password: z.string().min(1),
});

credentialsRouter.get("/", async (req: AuthedRequest, res: Response) => {
  const creds = await prisma.webCredential.findMany({
    where: { userId: req.user!.id },
    select: { id: true, siteName: true, siteUrl: true, username: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ credentials: creds });
});

credentialsRouter.post("/", async (req: AuthedRequest, res: Response) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const cred = await prisma.webCredential.create({
    data: {
      ...parsed.data,
      password: encryptToString(parsed.data.password),
      userId: req.user!.id,
    },
  });
  res.status(201).json({ id: cred.id, siteName: cred.siteName });
});

credentialsRouter.delete("/:id", async (req: AuthedRequest, res: Response) => {
  await prisma.webCredential.deleteMany({
    where: { id: req.params.id, userId: req.user!.id },
  });
  res.json({ ok: true });
});

// Reveal a stored password (for the vault UI's copy button).
credentialsRouter.get("/:id/password", async (req: AuthedRequest, res: Response) => {
  const cred = await prisma.webCredential.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    select: { password: true },
  });
  if (!cred) return res.status(404).json({ error: "Not found" });
  res.json({ password: decryptFromString(cred.password) });
});
