import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./db";
import { seedAutomationTemplates } from "./automations/seeder";

import { authRouter } from "./routes/auth";
import { agentsRouter } from "./routes/agents";
import { groupchatsRouter } from "./routes/groupchats";
import { clusterRouter } from "./routes/cluster";
import { schedulerRouter } from "./routes/scheduler";
import { goalsRouter } from "./routes/goals";
import { habitsRouter } from "./routes/habits";
import { dueDatesRouter } from "./routes/dueDates";
import { oauthRouter } from "./routes/oauth";
import { integrationsRouter } from "./routes/integrations";
import { widgetsRouter } from "./routes/widgets";
import { credentialsRouter } from "./routes/credentials";
import { automationsRouter } from "./routes/automations";
import { workflowsRouter } from "./routes/workflows";
import { memoriesRouter } from "./routes/memories";
import { scheduledEmailsRouter } from "./routes/scheduledEmails";
import { filesRouter } from "./routes/files";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "5mb" }));

// Mount all routers under /api
app.use("/api/auth", authRouter);
app.use("/api/agents", agentsRouter);
app.use("/api/groupchats", groupchatsRouter);
app.use("/api/cluster", clusterRouter);
app.use("/api/scheduler", schedulerRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/habits", habitsRouter);
app.use("/api/due-dates", dueDatesRouter);
app.use("/api/oauth", oauthRouter);
app.use("/api/integrations", integrationsRouter);
app.use("/api/widgets", widgetsRouter);
app.use("/api/credentials", credentialsRouter);
app.use("/api/automations", automationsRouter);
app.use("/api/workflows", workflowsRouter);
app.use("/api/memories", memoriesRouter);
app.use("/api/scheduled-emails", scheduledEmailsRouter);
app.use("/api/files", filesRouter);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    port: PORT,
    database: process.env.DATABASE_URL ? "configured" : "not configured (dev mode)",
    pythonService: process.env.PYTHON_SERVICE_URL ?? "http://localhost:8000",
  });
});

// Seed automation templates on boot (non-blocking, idempotent, catches errors)
seedAutomationTemplates(prisma).catch((err) => {
  console.warn("[seeder] Could not seed automation templates:", err instanceof Error ? err.message : err);
});

app.listen(PORT, () => {
  console.log(`[backend] AI Studio Scheduler API on http://localhost:${PORT}`);
  console.log(`[backend] Database: ${process.env.DATABASE_URL ? "connected" : "not configured (dev mode — routes will error on Prisma calls)"}`);
  console.log(`[backend] Agent service: ${process.env.PYTHON_SERVICE_URL ?? "http://localhost:8000"}`);
});
