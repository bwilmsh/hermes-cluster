import { Router, type Response } from "express";
import { prisma } from "../db";
import { authMiddleware, type AuthedRequest } from "../lib/auth";
import { startSse, endSse, errorSse } from "../lib/sse";
import { postJsonSse } from "../lib/http";

export const clusterRouter = Router();
clusterRouter.use(authMiddleware);

const PYTHON_URL = process.env.PYTHON_SERVICE_URL ?? "http://localhost:8000";

// Cluster AI — the manager-router view. Streams route badge + tokens + widget sentinels.
clusterRouter.post("/", async (req: AuthedRequest, res: Response) => {
  const { message, history } = req.body as { message: string; history?: { role: string; content: string }[] };
  if (!message?.trim()) return res.status(400).json({ error: "Message required" });

  startSse(res);
  try {
    await postJsonSse(
      `${PYTHON_URL}/cluster`,
      {
        message,
        history: history ?? [],
        businessContext: "",
      },
      (chunk) => res.write(chunk) // passthrough SSE — Python emits route + token + widget + done events
    );
    endSse(res);
  } catch (err) {
    errorSse(res, err instanceof Error ? err.message : "Agent service unavailable");
  }
});
