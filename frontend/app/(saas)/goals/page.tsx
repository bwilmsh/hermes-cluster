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

function statusColor(s: string) {
  switch (s) {
    case "on-track": return "#22C55E";
    case "at-risk": return "#F59E0B";
    case "behind": return "#F43F5E";
    default: return "var(--text-tertiary)";
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

  return (
    <div className="flex flex-col gap-6 animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="accent-bar text-xl font-semibold">Goals</div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-sm px-4 py-2 rounded-lg transition-colors"
          style={{ background: "var(--accent-indigo)", color: "white" }}
        >
          + New Goal
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass p-4 text-center">
          <div className="tnum text-2xl font-bold" style={{ color: "var(--accent-teal)" }}>{activeCount}</div>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Active</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="tnum text-2xl font-bold" style={{ color: "#22C55E" }}>{onTrackCount}</div>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>On Track</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="tnum text-2xl font-bold" style={{ color: "var(--accent-indigo)" }}>{avgProgress}%</div>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Avg Progress</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {(["all", "active", "completed"] as const).map((f) => (
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

      {/* Add form */}
      {showAdd && (
        <div className="glass p-5 space-y-3 animate-scale-in">
          <input
            type="text"
            placeholder="What's your goal?"
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ background: "var(--bg-hover)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
          />
          <div className="flex gap-3">
            <input
              type="date"
              placeholder="Deadline (optional)"
              className="flex-1 px-3 py-2 rounded-lg text-sm tnum"
              style={{ background: "var(--bg-hover)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
            />
            <select
              className="px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-hover)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
            >
              <option value="">No auto-run</option>
              <option value="sendEmail">📧 Send Email</option>
              <option value="createCalendarEvent">📅 Calendar Event</option>
              <option value="markTaskComplete">✓ Mark Complete</option>
              <option value="sendNotification">🔔 Notification</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="text-sm px-4 py-2 rounded-lg" style={{ color: "var(--text-tertiary)" }}>Cancel</button>
            <button onClick={() => setShowAdd(false)} className="text-sm px-4 py-2 rounded-lg" style={{ background: "var(--accent-indigo)", color: "white" }}>Create Goal</button>
          </div>
        </div>
      )}

      {/* Goal cards */}
      <div className="space-y-3">
        {goals
          .filter((g) => filter === "all" || (filter === "active" && g.isActive) || (filter === "completed" && !g.isActive))
          .map((g) => (
            <div
              key={g.id}
              className="glass px-5 py-4 space-y-3 transition-colors"
              style={{ borderLeft: `3px solid ${statusColor(g.status)}`, opacity: g.isActive ? 1 : 0.5 }}
            >
              {/* Top row */}
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{g.goalText}</div>
                  {g.deadline && (
                    <div className="tnum text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      Due {new Date(g.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  )}
                </div>

                {/* Status badge */}
                <span
                  className="text-xs px-2 py-0.5 rounded-full capitalize"
                  style={{ background: "var(--bg-hover)", color: statusColor(g.status) }}
                >
                  {g.status}
                </span>

                {/* Auto-run badge */}
                {g.autoRunEnabled && g.autoRunAction && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-hover)", color: "var(--text-tertiary)" }}>
                    {actionIcon(g.autoRunAction)} auto
                  </span>
                )}

                {/* Toggle */}
                <button
                  onClick={() => toggleActive(g.id)}
                  className="text-xs px-2 py-1 rounded"
                  style={{ background: "var(--bg-hover)", color: "var(--text-tertiary)" }}
                >
                  {g.isActive ? "Pause" : "Resume"}
                </button>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${g.progress}%`, background: statusColor(g.status) }}
                  />
                </div>
                <span className="tnum text-xs font-medium" style={{ color: statusColor(g.status) }}>
                  {g.progress}%
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
