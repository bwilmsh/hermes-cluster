"use client";

import { useState, useCallback } from "react";

/* ── Types ── */
interface Workflow {
  id: string;
  name: string;
  description: string;
  status: "draft" | "active" | "paused";
  category: string;
  icon: string;
  lastRunAt?: string;
  lastRunStatus?: "success" | "failed";
  runCount: number;
  nodes: WorkflowNode[];
}

interface WorkflowNode {
  id: string;
  type: "trigger" | "action" | "condition" | "delay";
  label: string;
  config: Record<string, string>;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  isOfficial: boolean;
}

/* ── Demo data ── */
const DEMO_TEMPLATES: Template[] = [
  { id: "t1", name: "Daily Standup Bot", description: "Posts standup questions every morning and summarizes responses", category: "Productivity", icon: "🌅", isOfficial: true },
  { id: "t2", name: "Client Follow-up", description: "Sends follow-up emails 3 days after client meetings", category: "Sales", icon: "📧", isOfficial: true },
  { id: "t3", name: "Habit Tracker", description: "Logs habit completion and sends weekly summaries", category: "Health", icon: "🧘", isOfficial: true },
  { id: "t4", name: "PR Review Reminder", description: "Notifies when a PR has been open for 24h without review", category: "Engineering", icon: "🔍", isOfficial: false },
  { id: "t5", name: "Invoice Generator", description: "Creates invoices on the 1st of each month from tracked hours", category: "Finance", icon: "💰", isOfficial: false },
];

const DEMO_WORKFLOWS: Workflow[] = [
  {
    id: "w1",
    name: "Morning Briefing",
    description: "Cluster AI summarizes today's schedule and sends to Slack",
    status: "active",
    category: "Productivity",
    icon: "🌅",
    lastRunAt: new Date(Date.now() - 3600000).toISOString(),
    lastRunStatus: "success",
    runCount: 42,
    nodes: [
      { id: "n1", type: "trigger", label: "Every day at 7:00 AM", config: { schedule: "0 7 * * *" } },
      { id: "n2", type: "action", label: "Cluster AI: Generate day plan", config: { agent: "cluster", prompt: "Summarize today" } },
      { id: "n3", type: "action", label: "Send to Slack", config: { channel: "#general" } },
    ],
  },
  {
    id: "w2",
    name: "Overdue Task Escalation",
    description: "Notifies when tasks are overdue by more than 24 hours",
    status: "active",
    category: "Engineering",
    icon: "🚨",
    lastRunAt: new Date(Date.now() - 7200000).toISOString(),
    lastRunStatus: "success",
    runCount: 18,
    nodes: [
      { id: "n4", type: "trigger", label: "Every 4 hours", config: { schedule: "0 */4 * * *" } },
      { id: "n5", type: "condition", label: "Has overdue tasks?", config: { threshold: "24h" } },
      { id: "n6", type: "action", label: "Send notification", config: { type: "push" } },
      { id: "n7", type: "delay", label: "Wait 30 min", config: { minutes: "30" } },
      { id: "n8", type: "action", label: "Escalate to email", config: { to: "team@company.com" } },
    ],
  },
  {
    id: "w3",
    name: "Weekly Review",
    description: "Compiles weekly metrics and sends a summary every Friday",
    status: "paused",
    category: "Analytics",
    icon: "📊",
    runCount: 12,
    nodes: [
      { id: "n9", type: "trigger", label: "Every Friday 5 PM", config: { schedule: "0 17 * * 5" } },
      { id: "n10", type: "action", label: "Gather metrics", config: { sources: "tasks,habits,events" } },
      { id: "n11", type: "action", label: "Generate report", config: { format: "markdown" } },
    ],
  },
];

function statusStyle(s: string) {
  switch (s) {
    case "active": return { bg: "#22C55E20", color: "#22C55E" };
    case "paused": return { bg: "#F59E0B20", color: "#F59E0B" };
    case "draft": return { bg: "var(--bg-hover)", color: "var(--text-tertiary)" };
    default: return { bg: "var(--bg-hover)", color: "var(--text-tertiary)" };
  }
}

function nodeTypeIcon(t: string) {
  switch (t) {
    case "trigger": return "⚡";
    case "action": return "⚙️";
    case "condition": return "🔀";
    case "delay": return "⏱";
    default: return "●";
  }
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>(DEMO_WORKFLOWS);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [view, setView] = useState<"workflows" | "templates">("workflows");

  const toggleStatus = useCallback((id: string) => {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, status: w.status === "active" ? "paused" : "active" }
          : w
      )
    );
  }, []);

  const activeCount = workflows.filter((w) => w.status === "active").length;
  const totalRuns = workflows.reduce((a, w) => a + w.runCount, 0);

  const selected = workflows.find((w) => w.id === selectedWorkflow);

  return (
    <div className="flex flex-col gap-6 animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="accent-bar text-xl font-semibold">Workflows</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("workflows")}
            className="text-xs px-3 py-1.5 rounded-full transition-colors"
            style={{
              background: view === "workflows" ? "var(--accent-indigo)" : "var(--bg-hover)",
              color: view === "workflows" ? "white" : "var(--text-secondary)",
            }}
          >
            My Workflows
          </button>
          <button
            onClick={() => setView("templates")}
            className="text-xs px-3 py-1.5 rounded-full transition-colors"
            style={{
              background: view === "templates" ? "var(--accent-teal)" : "var(--bg-hover)",
              color: view === "templates" ? "white" : "var(--text-secondary)",
            }}
          >
            Templates
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass p-4 text-center">
          <div className="tnum text-2xl font-bold" style={{ color: "#22C55E" }}>{activeCount}</div>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Active</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="tnum text-2xl font-bold" style={{ color: "var(--accent-teal)" }}>{workflows.length}</div>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Total</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="tnum text-2xl font-bold" style={{ color: "var(--accent-indigo)" }}>{totalRuns}</div>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Total Runs</div>
        </div>
      </div>

      {view === "workflows" ? (
        <div className="flex gap-6">
          {/* ── Workflow list ── */}
          <div className="flex-1 space-y-3">
            {workflows.map((w) => (
              <div
                key={w.id}
                className="glass px-5 py-4 cursor-pointer transition-colors hover:brightness-110"
                style={{
                  borderLeft: `3px solid ${statusStyle(w.status).color}`,
                  outline: selectedWorkflow === w.id ? "2px solid var(--accent-indigo)" : "none",
                }}
                onClick={() => setSelectedWorkflow(selectedWorkflow === w.id ? null : w.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{w.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{w.name}</div>
                    <div className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>{w.description}</div>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full capitalize"
                    style={statusStyle(w.status)}
                  >
                    {w.status}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleStatus(w.id); }}
                    className="text-xs px-3 py-1 rounded-lg"
                    style={{ background: "var(--bg-hover)", color: "var(--text-tertiary)" }}
                  >
                    {w.status === "active" ? "Pause" : "Activate"}
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="tnum text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {w.nodes.length} nodes
                  </span>
                  <span className="tnum text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {w.runCount} runs
                  </span>
                  {w.lastRunAt && (
                    <span className="tnum text-xs" style={{ color: "var(--text-tertiary)" }}>
                      Last: {new Date(w.lastRunAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      {w.lastRunStatus === "success" ? " ✓" : w.lastRunStatus === "failed" ? " ✗" : ""}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Detail panel ── */}
          {selected && (
            <div className="w-[320px] shrink-0 glass p-5 space-y-4 animate-scale-in">
              <div className="text-base font-semibold">{selected.icon} {selected.name}</div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{selected.description}</div>

              {/* Node pipeline */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                  Pipeline
                </div>
                {selected.nodes.map((n, i) => (
                  <div key={n.id} className="flex items-center gap-3">
                    {/* Connector line */}
                    {i > 0 && (
                      <div className="absolute ml-2 -mt-5 w-0.5 h-4" style={{ background: "var(--border)" }} />
                    )}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                      style={{ background: "var(--bg-hover)" }}
                    >
                      {nodeTypeIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{n.label}</div>
                      <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{n.type}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Run stats */}
              <div className="glass p-3 space-y-1">
                <div className="tnum text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Total runs: {selected.runCount}
                </div>
                <div className="tnum text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Success rate: {selected.lastRunStatus === "success" ? "100%" : "—"}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Templates view ── */
        <div className="grid grid-cols-2 gap-4">
          {DEMO_TEMPLATES.map((t) => (
            <div key={t.id} className="glass p-5 space-y-2 cursor-pointer transition-colors hover:brightness-110">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{t.category}</span>
                    {t.isOfficial && (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--accent-teal)", color: "white" }}>
                        Official
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{t.description}</div>
              <button
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ background: "var(--accent-indigo)", color: "white" }}
              >
                Use Template
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
