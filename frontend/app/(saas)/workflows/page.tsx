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

function statusMeta(s: string) {
  switch (s) {
    case "active": return { color: "#22C55E", bg: "#22C55E1A", label: "Active" };
    case "paused": return { color: "#F59E0B", bg: "#F59E0B1A", label: "Paused" };
    case "draft": return { color: "var(--text-tertiary)", bg: "var(--bg-tertiary)", label: "Draft" };
    default: return { color: "var(--text-tertiary)", bg: "var(--bg-tertiary)", label: "—" };
  }
}

function nodeTypeMeta(t: string) {
  switch (t) {
    case "trigger": return { icon: "⚡", label: "Trigger" };
    case "action": return { icon: "⚙️", label: "Action" };
    case "condition": return { icon: "🔀", label: "Condition" };
    case "delay": return { icon: "�", label: "Delay" };
    default: return { icon: "●", label: t };
  }
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>(DEMO_WORKFLOWS);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [view, setView] = useState<"workflows" | "templates">("workflows");

  const toggleStatus = useCallback((id: string) => {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, status: w.status === "active" ? "paused" : "active" } : w
      )
    );
  }, []);

  const activeCount = workflows.filter((w) => w.status === "active").length;
  const totalRuns = workflows.reduce((a, w) => a + w.runCount, 0);
  const selected = workflows.find((w) => w.id === selectedWorkflow);

  const stats = [
    { label: "Active", value: activeCount, color: "#22C55E" },
    { label: "Total", value: workflows.length, color: "var(--accent)" },
    { label: "Total Runs", value: totalRuns, color: "var(--accent-indigo)" },
  ];

  return (
    <div className="animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Workflows</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Automate your work with triggers and actions
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
          <button
            onClick={() => setView("workflows")}
            className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
            style={{
              background: view === "workflows" ? "var(--bg-secondary)" : "transparent",
              color: view === "workflows" ? "var(--text-primary)" : "var(--text-tertiary)",
              boxShadow: view === "workflows" ? "var(--shadow-card)" : "none",
            }}
          >
            My Workflows
          </button>
          <button
            onClick={() => setView("templates")}
            className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
            style={{
              background: view === "templates" ? "var(--bg-secondary)" : "transparent",
              color: view === "templates" ? "var(--text-primary)" : "var(--text-tertiary)",
              boxShadow: view === "templates" ? "var(--shadow-card)" : "none",
            }}
          >
            Templates
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="saas-card p-3">
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{s.label}</div>
            <div className="tnum text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {view === "workflows" ? (
        <div className="flex gap-6">
          {/* ── Workflow list ── */}
          <div className="flex-1 space-y-3">
            {workflows.map((w) => {
              const meta = statusMeta(w.status);
              const isSelected = selectedWorkflow === w.id;
              return (
                <div
                  key={w.id}
                  className="saas-card p-4 cursor-pointer transition-all"
                  style={{
                    borderLeft: `3px solid ${meta.color}`,
                    boxShadow: isSelected
                      ? `0 0 0 1px var(--accent)`
                      : undefined,
                  }}
                  onClick={() => setSelectedWorkflow(isSelected ? null : w.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{w.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{w.name}</div>
                      <div className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>{w.description}</div>
                    </div>
                    <span className="saas-pill shrink-0" style={{ background: meta.bg, color: meta.color }}>
                      {meta.label}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleStatus(w.id); }}
                      className="saas-btn px-3 py-1.5 text-xs shrink-0"
                    >
                      {w.status === "active" ? "Pause" : "Activate"}
                    </button>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pl-9">
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
              );
            })}
          </div>

          {/* ── Detail panel — flow diagram ── */}
          {selected && (
            <div className="w-[320px] shrink-0 saas-card p-5 space-y-4 animate-scale-in">
              <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                {selected.icon} {selected.name}
              </div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{selected.description}</div>

              {/* Node pipeline — vertical flow diagram */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                  Pipeline
                </div>
                <div className="space-y-0">
                  {selected.nodes.map((n, i) => {
                    const nm = nodeTypeMeta(n.type);
                    return (
                      <div key={n.id} className="flex items-center gap-3">
                        {/* Node icon with connector */}
                        <div className="flex flex-col items-center shrink-0">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-base"
                            style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)" }}
                          >
                            {nm.icon}
                          </div>
                          {i < selected.nodes.length - 1 && (
                            <div className="w-0.5 h-4" style={{ background: "var(--border)" }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pb-4">
                          <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{n.label}</div>
                          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{nm.label}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Run stats */}
              <div className="saas-card p-3 space-y-1" style={{ background: "var(--bg-tertiary)" }}>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DEMO_TEMPLATES.map((t) => (
            <div key={t.id} className="saas-card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t.name}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{t.category}</span>
                    {t.isOfficial && (
                      <span className="saas-pill" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                        Official
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{t.description}</div>
              <button className="saas-btn-primary px-3 py-1.5 text-xs">
                Use Template
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
