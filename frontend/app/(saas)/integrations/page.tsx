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

function statusStyle(s: string) {
  switch (s) {
    case "connected": return { bg: "#22C55E20", color: "#22C55E", label: "Connected" };
    case "disconnected": return { bg: "var(--bg-hover)", color: "var(--text-tertiary)", label: "Connect" };
    case "error": return { bg: "#F43F5E20", color: "#F43F5E", label: "Reconnect" };
    default: return { bg: "var(--bg-hover)", color: "var(--text-tertiary)", label: "Connect" };
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
    <div className="flex flex-col gap-6 animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="accent-bar text-xl font-semibold">Integrations</div>
        <span className="tnum text-xs px-3 py-1 rounded-full" style={{ background: "var(--bg-hover)", color: "var(--accent-teal)" }}>
          {connectedCount} connected
        </span>
      </div>

      {/* Security notice */}
      <div className="glass p-4 flex items-center gap-3" style={{ borderLeft: "3px solid var(--accent-teal)" }}>
        <span className="text-lg">🔐</span>
        <div>
          <div className="text-sm font-medium">All tokens AES-256-GCM encrypted</div>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            OAuth tokens are encrypted at rest. We never store plaintext credentials.
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {(["all", "connected", "available"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="text-xs px-3 py-1.5 rounded-full capitalize transition-colors"
            style={{
              background: filter === f ? "var(--accent-indigo)" : "var(--bg-hover)",
              color: filter === f ? "white" : "var(--text-secondary)",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Integration cards */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map((i) => {
          const ss = statusStyle(i.status);
          return (
            <div
              key={i.id}
              className="glass p-5 space-y-3 transition-colors"
              style={{ borderLeft: `3px solid ${i.color}` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{i.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{i.name}</div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{i.description}</div>
                </div>
              </div>

              {/* Connection info */}
              {i.status === "connected" && i.accountEmail && (
                <div className="text-xs flex items-center gap-2" style={{ color: "var(--text-tertiary)" }}>
                  <span>✓</span>
                  <span>{i.accountEmail}</span>
                  {i.connectedAt && (
                    <span className="tnum">· connected {i.connectedAt}</span>
                  )}
                </div>
              )}

              {i.status === "error" && (
                <div className="text-xs" style={{ color: "#F43F5E" }}>
                  ⚠ Token expired or revoked. Reconnect to restore access.
                </div>
              )}

              {/* Action button */}
              <button
                onClick={() => toggleConnection(i.id)}
                className="text-xs px-4 py-2 rounded-lg w-full transition-colors"
                style={{ background: ss.bg, color: ss.color }}
              >
                {ss.label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
