"use client";

import { useState } from "react";

/* ── Types ── */
type Period = "This Week" | "This Month" | "This Quarter";

interface AnalyticsData {
  tasksCompleted: number;
  tasksTotal: number;
  avgCompletionTime: string;
  onTimeRate: number;
  streakDays: number;
  productivityScore: number;
  dailyBreakdown: { day: string; completed: number; total: number }[];
  categoryBreakdown: { category: string; count: number; color: string }[];
}

const PERIOD_DATA: Record<Period, AnalyticsData> = {
  "This Week": {
    tasksCompleted: 23,
    tasksTotal: 31,
    avgCompletionTime: "2.4h",
    onTimeRate: 0.78,
    streakDays: 5,
    productivityScore: 87,
    dailyBreakdown: [
      { day: "Mon", completed: 5, total: 6 },
      { day: "Tue", completed: 4, total: 5 },
      { day: "Wed", completed: 6, total: 7 },
      { day: "Thu", completed: 3, total: 5 },
      { day: "Fri", completed: 3, total: 4 },
      { day: "Sat", completed: 1, total: 2 },
      { day: "Sun", completed: 1, total: 2 },
    ],
    categoryBreakdown: [
      { category: "Engineering", count: 12, color: "#4866FD" },
      { category: "Work", count: 6, color: "#F59E0B" },
      { category: "Personal", count: 3, color: "#22C55E" },
      { category: "Health", count: 2, color: "#F43F5E" },
    ],
  },
  "This Month": {
    tasksCompleted: 94,
    tasksTotal: 120,
    avgCompletionTime: "3.1h",
    onTimeRate: 0.71,
    streakDays: 12,
    productivityScore: 82,
    dailyBreakdown: [
      { day: "Wk1", completed: 28, total: 35 },
      { day: "Wk2", completed: 23, total: 30 },
      { day: "Wk3", completed: 22, total: 28 },
      { day: "Wk4", completed: 21, total: 27 },
    ],
    categoryBreakdown: [
      { category: "Engineering", count: 45, color: "#4866FD" },
      { category: "Work", count: 25, color: "#F59E0B" },
      { category: "Personal", count: 14, color: "#22C55E" },
      { category: "Health", count: 10, color: "#F43F5E" },
    ],
  },
  "This Quarter": {
    tasksCompleted: 287,
    tasksTotal: 350,
    avgCompletionTime: "3.8h",
    onTimeRate: 0.68,
    streakDays: 18,
    productivityScore: 78,
    dailyBreakdown: [
      { day: "M1", completed: 72, total: 90 },
      { day: "M2", completed: 98, total: 120 },
      { day: "M3", completed: 117, total: 140 },
    ],
    categoryBreakdown: [
      { category: "Engineering", count: 130, color: "#4866FD" },
      { category: "Work", count: 75, color: "#F59E0B" },
      { category: "Personal", count: 48, color: "#22C55E" },
      { category: "Health", count: 34, color: "#F43F5E" },
    ],
  },
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("This Week");
  const data = PERIOD_DATA[period];

  const maxDaily = Math.max(...data.dailyBreakdown.map((d) => d.total));

  return (
    <div className="flex flex-col gap-6 animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="accent-bar text-xl font-semibold">Analytics</div>
        <div className="flex items-center gap-2">
          {(["This Week", "This Month", "This Quarter"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="text-xs px-3 py-1.5 rounded-full transition-colors"
              style={{
                background: period === p ? "var(--accent-indigo)" : "var(--bg-hover)",
                color: period === p ? "white" : "var(--text-secondary)",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass p-4 text-center">
          <div className="tnum text-2xl font-bold" style={{ color: "var(--accent-teal)" }}>{data.tasksCompleted}</div>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Completed</div>
          <div className="tnum text-xs" style={{ color: "var(--text-tertiary)" }}>of {data.tasksTotal}</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="tnum text-2xl font-bold" style={{ color: "var(--accent-indigo)" }}>{data.avgCompletionTime}</div>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Avg Time</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="tnum text-2xl font-bold" style={{ color: data.onTimeRate >= 0.7 ? "#22C55E" : "#F59E0B" }}>
            {Math.round(data.onTimeRate * 100)}%
          </div>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>On Time</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="tnum text-2xl font-bold" style={{ color: "#22C55E" }}>{data.streakDays}</div>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Day Streak</div>
        </div>
      </div>

      {/* Productivity score */}
      <div className="glass p-6 flex items-center gap-6">
        <div className="relative w-24 h-24 shrink-0">
          {/* Circular progress */}
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-hover)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke="var(--accent-indigo)"
              strokeWidth="8"
              strokeDasharray={`${data.productivityScore * 2.64} ${264 - data.productivityScore * 2.64}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="tnum text-xl font-bold" style={{ color: "var(--accent-indigo)" }}>{data.productivityScore}</span>
          </div>
        </div>
        <div>
          <div className="text-base font-semibold">Productivity Score</div>
          <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {data.productivityScore >= 85
              ? "Excellent — you're consistently hitting your targets."
              : data.productivityScore >= 70
              ? "Good — on track but room to improve on-time rate."
              : "Needs attention — several overdue items this period."}
          </div>
        </div>
      </div>

      {/* Daily/weekly bar chart */}
      <div className="glass p-5 space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          Completion Trend
        </div>
        <div className="flex items-end gap-3 h-32">
          {data.dailyBreakdown.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col items-center gap-0.5" style={{ height: "100px" }}>
                {/* Total bar */}
                <div
                  className="w-full rounded-t-md"
                  style={{
                    height: `${(d.total / maxDaily) * 100}%`,
                    background: "var(--bg-hover)",
                  }}
                />
                {/* Completed bar (overlaid from bottom) */}
                <div
                  className="w-full rounded-md -mt-full"
                  style={{
                    height: `${(d.completed / maxDaily) * 100}%`,
                    background: "var(--accent-teal)",
                    marginTop: `-${(d.total / maxDaily) * 100}%`,
                  }}
                />
              </div>
              <span className="tnum text-xs" style={{ color: "var(--text-tertiary)" }}>{d.day}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-tertiary)" }}>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: "var(--accent-teal)" }} />
            Completed
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: "var(--bg-hover)" }} />
            Total
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="glass p-5 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          By Category
        </div>
        {data.categoryBreakdown.map((c) => {
          const maxCat = Math.max(...data.categoryBreakdown.map((x) => x.count));
          return (
            <div key={c.category} className="flex items-center gap-3">
              <span className="text-xs w-24 shrink-0">{c.category}</span>
              <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
                <div className="h-full rounded-full" style={{ width: `${(c.count / maxCat) * 100}%`, background: c.color }} />
              </div>
              <span className="tnum text-xs w-8 text-right" style={{ color: c.color }}>{c.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
