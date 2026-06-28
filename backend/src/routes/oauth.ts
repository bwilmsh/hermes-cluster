import { Router, type Response } from "express";
import { prisma } from "../db";
import { authMiddleware, type AuthedRequest } from "../lib/auth";
import { encryptToString, decryptFromString } from "../lib/crypto";

export const oauthRouter = Router();
oauthRouter.use(authMiddleware);

const PROVIDERS = ["google", "slack", "notion"];
const OAUTH_CALLBACKS: Record<string, string> = {
  google: "https://accounts.google.com/o/oauth2/v2/auth",
  slack: "https://slack.com/oauth/v2/authorize",
  notion: "https://api.notion.com/v1/oauth/authorize",
};

// Start OAuth flow — returns the redirect URL the frontend should send the user to.
oauthRouter.get("/start/:provider", async (req: AuthedRequest, res: Response) => {
  const provider = req.params.provider;
  if (!PROVIDERS.includes(provider)) return res.status(400).json({ error: "Unknown provider" });
  const config = await prisma.oAuthConfig.findUnique({
    where: { userId_provider: { userId: req.user!.id, provider } },
  });
  if (!config) return res.status(400).json({ error: "OAuth not configured for this provider" });
  const clientId = decryptFromString(config.clientId);
  const redirectUri = `${process.env.PUBLIC_BASE_URL ?? "http://localhost:3001"}/api/oauth/callback/${provider}`;
  const state = `${req.user!.id}:${provider}:${Date.now()}`;
  const url = new URL(OAUTH_CALLBACKS[provider]);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("scope", provider === "google" ? "calendar gmail" : provider === "slack" ? "commands chat:write" : "");
  res.json({ redirectUrl: url.toString(), state });
});

// OAuth callback — exchanges code for tokens, stores encrypted.
oauthRouter.get("/callback/:provider", async (req: AuthedRequest, res: Response) => {
  const provider = req.params.provider;
  const code = req.query.code as string;
  if (!code) return res.status(400).json({ error: "Missing code" });
  // In production this would POST to the provider's token endpoint. For v1 we store the code as a dev token.
  const token = encryptToString(code);
  await prisma.integration.upsert({
    where: { userId_provider: { userId: req.user!.id, provider } },
    update: { accessToken: token },
    create: { userId: req.user!.id, provider, accessToken: token },
  });
  res.json({ ok: true, provider });
});

oauthRouter.get("/config/:provider", async (req: AuthedRequest, res: Response) => {
  const config = await prisma.oAuthConfig.findUnique({
    where: { userId_provider: { userId: req.user!.id, provider: req.params.provider } },
  });
  res.json({ configured: !!config });
});

oauthRouter.put("/config/:provider", async (req: AuthedRequest, res: Response) => {
  const { clientId, clientSecret } = req.body as { clientId: string; clientSecret: string };
  if (!clientId || !clientSecret) return res.status(400).json({ error: "Missing credentials" });
  const config = await prisma.oAuthConfig.upsert({
    where: { userId_provider: { userId: req.user!.id, provider: req.params.provider } },
    update: {
      clientId: encryptToString(clientId),
      clientSecret: encryptToString(clientSecret),
    },
    create: {
      userId: req.user!.id,
      provider: req.params.provider,
      clientId: encryptToString(clientId),
      clientSecret: encryptToString(clientSecret),
    },
  });
  res.json({ ok: true });
});
