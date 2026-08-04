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
  const maxCat = Math.max(...data.categoryBreakdown.map((x) => x.count));

  const metrics = [
    { label: "Completed", value: data.tasksCompleted, sub: `of ${data.tasksTotal}`, color: "var(--accent)" },
    { label: "Avg Time", value: data.avgCompletionTime, sub: "per task", color: "var(--accent-indigo)" },
    { label: "On Time", value: `${Math.round(data.onTimeRate * 100)}%`, sub: "completion rate", color: data.onTimeRate >= 0.7 ? "#22C55E" : "#F59E0B" },
    { label: "Day Streak", value: data.streakDays, sub: "consecutive", color: "#22C55E" },
  ];

  const scoreVerdict =
    data.productivityScore >= 85
      ? "Excellent — you're consistently hitting your targets."
      : data.productivityScore >= 70
      ? "Good — on track but room to improve on-time rate."
      : "Needs attention — several overdue items this period.";

  return (
    <div className="animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Analytics</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Your productivity at a glance
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
          {(["This Week", "This Month", "This Quarter"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
              style={{
                background: period === p ? "var(--bg-secondary)" : "transparent",
                color: period === p ? "var(--text-primary)" : "var(--text-tertiary)",
                boxShadow: period === p ? "var(--shadow-card)" : "none",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {metrics.map((m) => (
          <div key={m.label} className="saas-card p-3">
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{m.label}</div>
            <div className="tnum text-2xl font-bold mt-1" style={{ color: m.color }}>{m.value}</div>
            <div className="tnum text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Productivity score + bar chart side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Productivity score */}
        <div className="saas-card p-5 flex items-center gap-5">
          <div className="relative w-24 h-24 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-tertiary)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke="var(--accent)"
                strokeWidth="8"
                strokeDasharray={`${data.productivityScore * 2.64} ${264 - data.productivityScore * 2.64}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="tnum text-xl font-bold" style={{ color: "var(--accent)" }}>{data.productivityScore}</span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Productivity Score</div>
            <div className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-tertiary)" }}>{scoreVerdict}</div>
          </div>
        </div>

        {/* Bar chart */}
        <div className="saas-card p-5 lg:col-span-2 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
            Completion Trend
          </div>
          <div className="flex items-end gap-2 h-32">
            {data.dailyBreakdown.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex flex-col items-center" style={{ height: "110px" }}>
                  {/* Total (background) bar */}
                  <div
                    className="w-full rounded-t-md"
                    style={{
                      height: `${(d.total / maxDaily) * 100}%`,
                      background: "var(--bg-tertiary)",
                    }}
                  />
                  {/* Completed bar overlaid from bottom */}
                  <div
                    className="w-full rounded-md"
                    style={{
                      height: `${(d.completed / maxDaily) * 100}%`,
                      background: "var(--accent)",
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
              <div className="w-3 h-3 rounded-sm" style={{ background: "var(--accent)" }} />
              Completed
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: "var(--bg-tertiary)" }} />
              Total
            </div>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="saas-card p-5 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          By Category
        </div>
        {data.categoryBreakdown.map((c) => (
          <div key={c.category} className="flex items-center gap-3">
            <span className="text-xs w-24 shrink-0" style={{ color: "var(--text-secondary)" }}>{c.category}</span>
            <div className="saas-progress flex-1">
              <div
                className="saas-progress-fill"
                style={{ width: `${(c.count / maxCat) * 100}%`, background: c.color }}
              />
            </div>
            <span className="tnum text-xs font-medium w-8 text-right" style={{ color: c.color }}>{c.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
