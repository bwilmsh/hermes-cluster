"use client";

import { useState, useCallback } from "react";

/* ── Types ── */
interface Goal {
  id: string;
  goalText: string;
  deadline?: string;
  isActive: boolean;
  autoRunEnabled: boolean;
  autoRunAction?: "sendEmail" | "createCalendarEvent" | "markTaskComplete" | "sendNotification";
  progress: number; // 0–100
  status: "on-track" | "at-risk" | "behind";
}

/* ── Demo data ── */
const DEMO_GOALS: Goal[] = [
  { id: "g1", goalText: "Ship v2.0 of the scheduler", deadline: "2026-08-15", isActive: true, autoRunEnabled: true, autoRunAction: "sendNotification", progress: 68, status: "on-track" },
  { id: "g2", goalText: "Close 5 new enterprise deals", deadline: "2026-09-30", isActive: true, autoRunEnabled: false, progress: 20, status: "at-risk" },
  { id: "g3", goalText: "Run a half marathon", deadline: "2026-10-15", isActive: true, autoRunEnabled: true, autoRunAction: "createCalendarEvent", progress: 35, status: "on-track" },
  { id: "g4", goalText: "Read 24 books this year", deadline: "2026-12-31", isActive: true, autoRunEnabled: false, progress: 50, status: "on-track" },
  { id: "g5", goalText: "Complete AWS Solutions Architect cert", deadline: "2026-07-01", isActive: true, autoRunEnabled: true, autoRunAction: "markTaskComplete", progress: 90, status: "behind" },
];

function statusMeta(s: string) {
  switch (s) {
    case "on-track": return { color: "#22C55E", label: "On Track" };
    case "at-risk": return { color: "#F59E0B", label: "At Risk" };
    case "behind": return { color: "#F43F5E", label: "Behind" };
    default: return { color: "var(--text-tertiary)", label: "—" };
  }
}

function actionIcon(a?: string) {
  switch (a) {
    case "sendEmail": return "📧";
    case "createCalendarEvent": return "📅";
    case "markTaskComplete": return "✓";
    case "sendNotification": return "🔔";
    default: return "—";
  }
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>(DEMO_GOALS);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const toggleActive = useCallback((id: string) => {
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, isActive: !g.isActive } : g));
  }, []);

  const activeCount = goals.filter((g) => g.isActive).length;
  const onTrackCount = goals.filter((g) => g.status === "on-track").length;
  const avgProgress = Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length);

  const stats = [
    { label: "Active", value: activeCount, color: "var(--accent)" },
    { label: "On Track", value: onTrackCount, color: "#22C55E" },
    { label: "Avg Progress", value: `${avgProgress}%`, color: "var(--accent-indigo)" },
    { label: "Total Goals", value: goals.length, color: "var(--text-primary)" },
  ];

  return (
    <div className="animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Goals</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Track progress on what matters most
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="saas-btn-primary px-4 py-2 text-sm flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          New Goal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="saas-card p-3">
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{s.label}</div>
            <div className="tnum text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 mb-6 p-1 rounded-lg" style={{ background: "var(--bg-tertiary)", width: "fit-content" }}>
        {(["all", "active", "completed"] as const).map((f) => (
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

      {/* Add form */}
      {showAdd && (
        <div className="saas-card p-5 mb-6 space-y-3 animate-scale-in">
          <input
            type="text"
            placeholder="What's your goal?"
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
          />
          <div className="flex gap-3">
            <input
              type="date"
              placeholder="Deadline (optional)"
              className="flex-1 px-3 py-2 rounded-lg text-sm tnum"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
            />
            <select
              className="px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
            >
              <option value="">No auto-run</option>
              <option value="sendEmail">📧 Send Email</option>
              <option value="createCalendarEvent">📅 Calendar Event</option>
              <option value="markTaskComplete">✓ Mark Complete</option>
              <option value="sendNotification">🔔 Notification</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="saas-btn px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => setShowAdd(false)} className="saas-btn-primary px-4 py-2 text-sm">Create Goal</button>
          </div>
        </div>
      )}

      {/* Goal cards — progress-focused */}
      <div className="space-y-4">
        {goals
          .filter((g) => filter === "all" || (filter === "active" && g.isActive) || (filter === "completed" && !g.isActive))
          .map((g) => {
            const meta = statusMeta(g.status);
            return (
              <div key={g.id} className="saas-card p-5" style={{ opacity: g.isActive ? 1 : 0.6 }}>
                {/* Top row: title + status + toggle */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{g.goalText}</div>
                    {g.deadline && (
                      <div className="tnum text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                        Due {new Date(g.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    )}
                  </div>
                  <span className="saas-pill" style={{ background: `${meta.color}1A`, color: meta.color }}>
                    {meta.label}
                  </span>
                  <button
                    onClick={() => toggleActive(g.id)}
                    className="saas-btn px-3 py-1.5 text-xs"
                  >
                    {g.isActive ? "Pause" : "Resume"}
                  </button>
                </div>

                {/* Progress row — the focus */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="saas-progress flex-1">
                    <div
                      className="saas-progress-fill"
                      style={{ width: `${g.progress}%`, background: meta.color }}
                    />
                  </div>
                  <span className="tnum text-lg font-bold w-12 text-right" style={{ color: meta.color }}>
                    {g.progress}%
                  </span>
                </div>

                {/* Footer row */}
                {g.autoRunEnabled && g.autoRunAction && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                    <span>{actionIcon(g.autoRunAction)}</span>
                    <span>Auto-run enabled</span>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
