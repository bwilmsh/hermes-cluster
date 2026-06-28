import { Router, type Response } from "express";
import { prisma } from "../db";
import { authMiddleware, type AuthedRequest } from "../lib/auth";
import { decryptFromString } from "../lib/crypto";

export const integrationsRouter = Router();
integrationsRouter.use(authMiddleware);

integrationsRouter.get("/", async (req: AuthedRequest, res: Response) => {
  const integrations = await prisma.integration.findMany({
    where: { userId: req.user!.id },
    select: { id: true, provider: true, accountEmail: true, accountName: true, expiresAt: true, createdAt: true },
  });
  res.json({ integrations });
});

integrationsRouter.delete("/:provider", async (req: AuthedRequest, res: Response) => {
  await prisma.integration.deleteMany({
    where: { userId: req.user!.id, provider: req.params.provider },
  });
  res.json({ ok: true });
});
