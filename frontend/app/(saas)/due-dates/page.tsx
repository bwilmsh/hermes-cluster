"use client";

import { useState, useEffect, useCallback } from "react";

/* ── Types ── */
interface DueDate {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO date
  dueTime: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "completed" | "overdue";
  category: "assignment" | "exam" | "work" | "personal";
}

/* ── Demo data ── */
const NOW = new Date();
const DAY = 86400000;

const DEMO_DUE_DATES: DueDate[] = [
  { id: "dd1", title: "CS 410 Homework 5", description: "Graph algorithms problem set", dueDate: new Date(NOW.getTime() - DAY).toISOString().slice(0, 10), dueTime: "23:59", priority: "urgent", status: "overdue", category: "assignment" },
  { id: "dd2", title: "Q3 Revenue Report", description: "Final numbers for board meeting", dueDate: new Date(NOW.getTime() - DAY * 2).toISOString().slice(0, 10), dueTime: "17:00", priority: "high", status: "overdue", category: "work" },
  { id: "dd3", title: "Physics Lab Report", description: "Electromagnetic induction lab", dueDate: new Date(NOW.getTime() + DAY).toISOString().slice(0, 10), dueTime: "14:00", priority: "high", status: "pending", category: "assignment" },
  { id: "dd4", title: "Midterm Exam — Data Structures", description: "Chapters 1–8, open notes", dueDate: new Date(NOW.getTime() + DAY * 3).toISOString().slice(0, 10), dueTime: "09:00", priority: "urgent", status: "pending", category: "exam" },
  { id: "dd5", title: "Client proposal draft", description: "Draft for Acme Corp re-engagement", dueDate: new Date(NOW.getTime() + DAY * 5).toISOString().slice(0, 10), dueTime: "12:00", priority: "medium", status: "pending", category: "work" },
  { id: "dd6", title: "Renew gym membership", description: "", dueDate: new Date(NOW.getTime() + DAY * 7).toISOString().slice(0, 10), dueTime: "", priority: "low", status: "pending", category: "personal" },
];

/* ── Helpers ── */
function priorityColor(p: string) {
  switch (p) {
    case "urgent": return "#F43F5E";
    case "high": return "#F59E0B";
    case "medium": return "var(--accent-teal)";
    case "low": return "var(--text-tertiary)";
    default: return "var(--text-tertiary)";
  }
}

function categoryIcon(c: string) {
  switch (c) {
    case "assignment": return "📝";
    case "exam": return "🎯";
    case "work": return "💼";
    case "personal": return "👤";
    default: return "📋";
  }
}

function getCountdown(dueDate: string, dueTime: string): string {
  const target = new Date(`${dueDate}T${dueTime || "23:59"}`);
  const diff = target.getTime() - Date.now();
  if (diff < 0) {
    const daysOver = Math.ceil(Math.abs(diff) / DAY);
    return `${daysOver}d overdue`;
  }
  const daysLeft = Math.floor(diff / DAY);
  const hoursLeft = Math.floor((diff % DAY) / 3600000);
  if (daysLeft > 0) return `${daysLeft}d ${hoursLeft}h left`;
  if (hoursLeft > 0) return `${hoursLeft}h left`;
  const minsLeft = Math.floor(diff / 60000);
  return `${minsLeft}m left`;
}

export default function DueDatesPage() {
  const [items, setItems] = useState<DueDate[]>(DEMO_DUE_DATES);
  const [filter, setFilter] = useState<"all" | "overdue" | "upcoming" | "completed">("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Live countdown timer
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(iv);
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status: d.status === "completed" ? "pending" : "completed" }
          : d
      )
    );
  }, []);

  const filtered = items.filter((d) => {
    if (filter === "overdue" && d.status !== "overdue") return false;
    if (filter === "upcoming" && d.status !== "pending") return false;
    if (filter === "completed" && d.status !== "completed") return false;
    if (catFilter !== "all" && d.category !== catFilter) return false;
    return true;
  });

  // Sort: overdue first, then by due date
  const sorted = [...filtered].sort((a, b) => {
    if (a.status === "overdue" && b.status !== "overdue") return -1;
    if (b.status === "overdue" && a.status !== "overdue") return 1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const overdueCount = items.filter((d) => d.status === "overdue").length;
  const upcomingCount = items.filter((d) => d.status === "pending").length;
  const completedCount = items.filter((d) => d.status === "completed").length;

  return (
    <div className="flex flex-col gap-6 animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="accent-bar text-xl font-semibold">Due Dates</div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-sm px-4 py-2 rounded-lg transition-colors"
          style={{ background: "var(--accent-indigo)", color: "white" }}
        >
          + Add
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass p-4 text-center">
          <div className="tnum text-2xl font-bold" style={{ color: "#F43F5E" }}>{overdueCount}</div>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Overdue</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="tnum text-2xl font-bold" style={{ color: "var(--accent-teal)" }}>{upcomingCount}</div>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Upcoming</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="tnum text-2xl font-bold" style={{ color: "#22C55E" }}>{completedCount}</div>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Completed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {(["all", "overdue", "upcoming", "completed"] as const).map((f) => (
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
        <span className="text-xs" style={{ color: "var(--border)" }}>|</span>
        {(["all", "assignment", "exam", "work", "personal"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className="text-xs px-3 py-1.5 rounded-full capitalize transition-colors"
            style={{
              background: catFilter === c ? "var(--accent-teal)" : "var(--bg-hover)",
              color: catFilter === c ? "white" : "var(--text-secondary)",
            }}
          >
            {c === "all" ? "All" : `${categoryIcon(c)} ${c}`}
          </button>
        ))}
      </div>

      {/* Add form (collapsible) */}
      {showAdd && (
        <div className="glass p-5 space-y-3 animate-scale-in">
          <input
            type="text"
            placeholder="Title"
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ background: "var(--bg-hover)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
          />
          <textarea
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
            style={{ background: "var(--bg-hover)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
          />
          <div className="flex gap-3">
            <input
              type="date"
              className="flex-1 px-3 py-2 rounded-lg text-sm tnum"
              style={{ background: "var(--bg-hover)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
            />
            <input
              type="time"
              className="w-28 px-3 py-2 rounded-lg text-sm tnum"
              style={{ background: "var(--bg-hover)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
            />
            <select
              className="px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-hover)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <select
              className="px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-hover)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
            >
              <option value="assignment">Assignment</option>
              <option value="exam">Exam</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAdd(false)}
              className="text-sm px-4 py-2 rounded-lg"
              style={{ color: "var(--text-tertiary)" }}
            >
              Cancel
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="text-sm px-4 py-2 rounded-lg"
              style={{ background: "var(--accent-indigo)", color: "white" }}
            >
              Add Due Date
            </button>
          </div>
        </div>
      )}

      {/* Due date cards */}
      <div className="space-y-3">
        {sorted.map((d) => (
          <div
            key={d.id}
            className="glass flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors hover:brightness-110"
            style={{ borderLeft: `3px solid ${priorityColor(d.priority)}` }}
            onClick={() => toggleComplete(d.id)}
          >
            {/* Status checkbox */}
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center text-xs shrink-0"
              style={{
                border: `2px solid ${d.status === "completed" ? "#22C55E" : d.status === "overdue" ? "#F43F5E" : "var(--border)"}`,
                background: d.status === "completed" ? "#22C55E" : "transparent",
                color: d.status === "completed" ? "white" : "transparent",
              }}
            >
              {d.status === "completed" ? "✓" : ""}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${d.status === "completed" ? "line-through opacity-50" : ""}`}>
                {categoryIcon(d.category)} {d.title}
              </div>
              {d.description && (
                <div className="text-xs mt-0.5 truncate" style={{ color: "var(--text-tertiary)" }}>
                  {d.description}
                </div>
              )}
            </div>

            {/* Priority badge */}
            <span
              className="text-xs px-2 py-0.5 rounded-full capitalize shrink-0"
              style={{ background: "var(--bg-hover)", color: priorityColor(d.priority) }}
            >
              {d.priority}
            </span>

            {/* Countdown */}
            <div className="tnum text-xs text-right shrink-0 min-w-[80px]" style={{
              color: d.status === "overdue" ? "#F43F5E" : d.status === "completed" ? "#22C55E" : "var(--text-tertiary)"
            }}>
              {d.status === "completed" ? "Done" : getCountdown(d.dueDate, d.dueTime)}
            </div>

            {/* Due date */}
            <div className="tnum text-xs shrink-0" style={{ color: "var(--text-tertiary)" }}>
              {new Date(d.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              {d.dueTime && <span> {d.dueTime}</span>}
            </div>
          </div>
        ))}

        {sorted.length === 0 && (
          <div className="text-center py-12" style={{ color: "var(--text-tertiary)" }}>
            <div className="text-4xl mb-3">📋</div>
            <div className="text-sm">No due dates match your filters</div>
          </div>
        )}
      </div>
    </div>
  );
}
