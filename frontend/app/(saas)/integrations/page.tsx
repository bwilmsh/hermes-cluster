"use client";

import { useState } from "react";

/* ── Types ── */
interface Integration {
  id: string;
  provider: string;
  name: string;
  description: string;
  icon: string;
  status: "connected" | "disconnected" | "error";
  connectedAt?: string;
  accountEmail?: string;
  color: string;
}

/* ── Demo data ── */
const DEMO_INTEGRATIONS: Integration[] = [
  { id: "i1", provider: "google", name: "Google Calendar", description: "Sync events and appointments", icon: "📅", status: "connected", connectedAt: "2026-06-15", accountEmail: "benji@company.com", color: "#4285F4" },
  { id: "i2", provider: "gmail", name: "Gmail", description: "Send and read emails via AI commands", icon: "📧", status: "connected", connectedAt: "2026-06-15", accountEmail: "benji@company.com", color: "#EA4335" },
  { id: "i3", provider: "slack", name: "Slack", description: "Post messages and receive notifications", icon: "💬", status: "disconnected", color: "#4A154B" },
  { id: "i4", provider: "notion", name: "Notion", description: "Read and create pages and databases", icon: "📝", status: "disconnected", color: "#000000" },
  { id: "i5", provider: "github", name: "GitHub", description: "Track PRs, issues, and CI status", icon: "🐙", status: "error", color: "#24292F" },
  { id: "i6", provider: "linear", name: "Linear", description: "Sync issues and project boards", icon: "🔺", status: "disconnected", color: "#5E6AD2" },
];

function statusMeta(s: string) {
  switch (s) {
    case "connected": return { color: "#22C55E", label: "Connected", bg: "#22C55E1A" };
    case "disconnected": return { color: "var(--text-tertiary)", label: "Not Connected", bg: "var(--bg-tertiary)" };
    case "error": return { color: "#F43F5E", label: "Error", bg: "#F43F5E1A" };
    default: return { color: "var(--text-tertiary)", label: "—", bg: "var(--bg-tertiary)" };
  }
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(DEMO_INTEGRATIONS);
  const [filter, setFilter] = useState<"all" | "connected" | "available">("all");

  const toggleConnection = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status: i.status === "connected" ? "disconnected" : "connected", connectedAt: i.status !== "connected" ? new Date().toISOString().slice(0, 10) : undefined }
          : i
      )
    );
  };

  const connectedCount = integrations.filter((i) => i.status === "connected").length;
  const filtered = integrations.filter((i) => {
    if (filter === "connected") return i.status === "connected";
    if (filter === "available") return i.status === "disconnected" || i.status === "error";
    return true;
  });

  return (
    <div className="animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Integrations</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {connectedCount} of {integrations.length} connected
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
          {(["all", "connected", "available"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize"
              style={{
                background: filter === f ? "var(--bg-secondary)" : "transparent",
                color: filter === f ? "var(--text-primary)" : "var(--text-tertiary)",
                boxShadow: filter === f ? "var(--shadow-card)" : "none",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Security notice */}
      <div className="saas-card p-4 mb-6 flex items-center gap-3" style={{ borderLeft: `3px solid var(--accent)` }}>
        <span className="text-lg">🔐</span>
        <div>
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>All tokens AES-256-GCM encrypted</div>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            OAuth tokens are encrypted at rest. We never store plaintext credentials.
          </div>
        </div>
      </div>

      {/* Integration list */}
      <div className="space-y-3">
        {filtered.map((i) => {
          const meta = statusMeta(i.status);
          const isConnected = i.status === "connected";
          return (
            <div key={i.id} className="saas-card p-5">
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0 text-2xl"
                  style={{ background: `${i.color}15` }}
                >
                  {i.icon}
                </div>

                {/* Name + description */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{i.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{i.description}</div>
                </div>

                {/* Status info */}
                {isConnected && i.accountEmail && (
                  <div className="hidden sm:block text-xs text-right shrink-0" style={{ color: "var(--text-tertiary)" }}>
                    <div className="font-medium" style={{ color: "var(--text-secondary)" }}>{i.accountEmail}</div>
                    {i.connectedAt && <div className="tnum mt-0.5">since {i.connectedAt}</div>}
                  </div>
                )}

                {/* Status pill */}
                <span className="saas-pill shrink-0" style={{ background: meta.bg, color: meta.color }}>
                  {meta.label}
                </span>

                {/* Action button */}
                <button
                  onClick={() => toggleConnection(i.id)}
                  className={
                    i.status === "disconnected"
                      ? "saas-btn-primary px-4 py-2 text-sm shrink-0"
                      : "saas-btn px-4 py-2 text-sm shrink-0"
                  }
                >
                  {i.status === "connected" ? "Disconnect" : i.status === "error" ? "Reconnect" : "Connect"}
                </button>
              </div>

              {/* Error message */}
              {i.status === "error" && (
                <div className="text-xs mt-3 flex items-center gap-1.5" style={{ color: "#F43F5E" }}>
                  <span>⚠</span>
                  <span>Token expired or revoked. Reconnect to restore access.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
