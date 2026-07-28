"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  useDueDates,
  useEvents,
  addDueDate,
  toggleDueDateDone,
  deleteDueDate,
  PRIORITY_META,
  dateOnly,
  type DueDate,
  type Priority,
} from "@/lib/eventStore";

/**
 * Due Dates page.
 *
 * Due Dates are explicit deadlines that DON'T need a specific calendar slot.
 * Examples: "Math Problem Set 4 — due Friday", "Bill payment — due 28th",
 * "Biology exam — cumulative".
 *
 * When you add a Due Date, an Appointment is automatically added to the
 * calendar at the same date/time so it shows up on the scheduler too.
 * Completing the Due Date marks the calendar event DONE; deleting the Due
 * Date removes the calendar event.
 *
 * For tasks that DO fit a specific time slot on your calendar (e.g. "Ship
 * scheduler view, 9:30am-12pm Tuesday"), use the Tasks page instead.
 */

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

const CATEGORY_SUGGESTIONS = [
  "Assignment", "Exam", "Project", "Work", "Personal", "Bill", "Meeting", "Health",
];

function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowTimeInputValue(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function useCountdown(targetMs: number) {
  const [remaining, setRemaining] = useState(() => targetMs - Date.now());
  useEffect(() => {
    setRemaining(targetMs - Date.now());
    const id = setInterval(() => setRemaining(targetMs - Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetMs]);
  return remaining;
}

function formatCountdown(ms: number): { text: string; isOverdue: boolean; isToday: boolean } {
  if (ms < 0) {
    const overdue = Math.abs(ms);
    const days = Math.floor(overdue / DAY);
    const hours = Math.floor((overdue % DAY) / HOUR);
    const mins = Math.floor((overdue % HOUR) / (60 * 1000));
    if (days > 0) return { text: `${days}d ${hours}h overdue`, isOverdue: true, isToday: false };
    if (hours > 0) return { text: `${hours}h ${mins}m overdue`, isOverdue: true, isToday: false };
    return { text: `${mins}m overdue`, isOverdue: true, isToday: false };
  }
  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / HOUR);
  const mins = Math.floor((ms % HOUR) / (60 * 1000));
  const secs = Math.floor((ms % (60 * 1000)) / 1000);
  if (days > 0) return { text: `${days}d ${hours}h ${mins}m left`, isOverdue: false, isToday: days === 0 };
  if (hours > 0) return { text: `${hours}h ${mins}m ${secs}s left`, isOverdue: false, isToday: true };
  return { text: `${mins}m ${secs}s left`, isOverdue: false, isToday: true };
}

function CountdownDisplay({ dueAt }: { dueAt: number }) {
  const remaining = useCountdown(dueAt);
  const { text, isOverdue, isToday } = formatCountdown(remaining);
  const color = isOverdue ? "#F43F5E" : isToday ? "#FF6B35" : "var(--text-tertiary)";
  return (
    <div className="flex items-center gap-1.5">
      {(isOverdue || isToday) && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            animation: "pulseGlow 1.5s ease-in-out infinite",
            flexShrink: 0,
          }}
        />
      )}
      <span className="text-xs font-semibold tnum" style={{ color }}>
        {text}
      </span>
    </div>
  );
}

export default function DueDatesPage() {
  const dueDates = useDueDates();
  const events = useEvents();
  const [filter, setFilter] = useState<"all" | "overdue" | "today" | "upcoming" | "completed">("all");
  const [showNew, setShowNew] = useState(false);

  // Form state
  const [fTitle, setFTitle] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fDate, setFDate] = useState(todayDateInputValue());
  const [fTime, setFTime] = useState(nowTimeInputValue());
  const [fPriority, setFPriority] = useState<Priority>("MEDIUM");
  const [fCategory, setFCategory] = useState("Assignment");
  const [fAutoCal, setFAutoCal] = useState(true);

  const resetForm = () => {
    setShowNew(false);
    setFTitle("");
    setFDesc("");
    setFDate(todayDateInputValue());
    setFTime(nowTimeInputValue());
    setFPriority("MEDIUM");
    setFCategory("Assignment");
    setFAutoCal(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fTitle.trim()) return;
    // Build ISO datetime in user's local TZ
    const dueAt = new Date(`${fDate}T${fTime}:00`).toISOString();
    addDueDate({
      title: fTitle.trim(),
      description: fDesc.trim() || undefined,
      dueAt,
      priority: fPriority,
      category: fCategory.trim() || undefined,
      autoAddToCalendar: fAutoCal,
    });
    resetForm();
  };

  const filtered = useMemo(() => {
    const now = Date.now();
    return dueDates.filter((d) => {
      const r = new Date(d.dueAt).getTime() - now;
      if (filter === "overdue") return !d.completed && r < 0;
      if (filter === "today") {
        if (d.completed) return false;
        return r > 0 && r < DAY;
      }
      if (filter === "upcoming") {
        if (d.completed) return false;
        return r >= DAY;
      }
      if (filter === "completed") return d.completed;
      return true;
    }).sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }, [dueDates, filter]);

  const stats = useMemo(() => {
    const now = Date.now();
    const overdue = dueDates.filter((d) => !d.completed && new Date(d.dueAt).getTime() < now).length;
    const today = dueDates.filter((d) => {
      if (d.completed) return false;
      const r = new Date(d.dueAt).getTime() - now;
      return r > 0 && r < DAY;
    }).length;
    const upcoming = dueDates.filter((d) => !d.completed && new Date(d.dueAt).getTime() - now >= DAY).length;
    const completed = dueDates.filter((d) => d.completed).length;
    return { overdue, today, upcoming, completed, total: dueDates.length };
  }, [dueDates]);

  return (
    <div className="flex flex-col gap-6 animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Due Dates
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Deadlines & reminders — auto-added to your calendar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/tasks"
            className="text-xs px-3 py-2 rounded-md transition-colors"
            style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}
            title="Tasks fit a specific calendar slot — use this when you have a time"
          >
            ← Need a scheduled task?
          </Link>
          <button
            type="button"
            className="saas-btn-primary flex items-center gap-1.5 px-4 py-2 text-sm"
            onClick={() => (showNew ? resetForm() : setShowNew(true))}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {showNew ? "Cancel" : "Add Due Date"}
          </button>
        </div>
      </div>

      {/* Add form */}
      {showNew && (
        <form onSubmit={submit} className="saas-card-lg p-5">
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                What's due?
              </label>
              <input
                type="text"
                value={fTitle}
                onChange={(e) => setFTitle(e.target.value)}
                placeholder="e.g. Math Problem Set 4"
                className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                autoFocus
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Notes (optional)
              </label>
              <input
                type="text"
                value={fDesc}
                onChange={(e) => setFDesc(e.target.value)}
                placeholder="e.g. Chapter 7 — Linear Algebra"
                className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Due date
                </label>
                <input
                  type="date"
                  value={fDate}
                  onChange={(e) => setFDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none"
                  style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Time
                </label>
                <input
                  type="time"
                  value={fTime}
                  onChange={(e) => setFTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none"
                  style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Category
                </label>
                <input
                  list="dd-categories"
                  value={fCategory}
                  onChange={(e) => setFCategory(e.target.value)}
                  placeholder="Assignment"
                  className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none"
                  style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
                <datalist id="dd-categories">
                  {CATEGORY_SUGGESTIONS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Priority
                </label>
                <select
                  value={fPriority}
                  onChange={(e) => setFPriority(e.target.value as Priority)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none"
                  style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--text-secondary)" }}>
              <input
                type="checkbox"
                checked={fAutoCal}
                onChange={(e) => setFAutoCal(e.target.checked)}
              />
              <span>
                Also add this to my calendar as an appointment at the due time
                <span style={{ color: "var(--text-tertiary)" }}> (recommended — you'll see it on the scheduler and get a reminder)</span>
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="saas-btn px-4 py-2 text-sm" onClick={resetForm}>
                Cancel
              </button>
              <button
                type="submit"
                className="saas-btn-primary px-4 py-2 text-sm"
                disabled={!fTitle.trim()}
                style={{ opacity: fTitle.trim() ? 1 : 0.5 }}
              >
                Add due date
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatChip label="Overdue" value={stats.overdue} accent="#F43F5E" />
        <StatChip label="Today" value={stats.today} accent="#FF6B35" />
        <StatChip label="Upcoming" value={stats.upcoming} accent="#3B82F6" />
        <StatChip label="Completed" value={stats.completed} accent="#22C55E" />
        <StatChip label="Total" value={stats.total} accent="var(--accent-indigo)" />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--bg-tertiary)", width: "fit-content" }}>
        {([
          { id: "all", label: `All · ${stats.total}` },
          { id: "overdue", label: `Overdue · ${stats.overdue}` },
          { id: "today", label: `Today · ${stats.today}` },
          { id: "upcoming", label: `Upcoming · ${stats.upcoming}` },
          { id: "completed", label: `Completed · ${stats.completed}` },
        ] as const).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
            style={{
              background: filter === f.id ? "var(--bg-secondary)" : "transparent",
              color: filter === f.id ? "var(--text-primary)" : "var(--text-tertiary)",
              boxShadow: filter === f.id ? "var(--shadow-card)" : "none",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Due date cards grid */}
      {filtered.length === 0 ? (
        <div className="saas-card-lg p-12 text-center">
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {filter === "all"
              ? "No due dates yet. Click Add Due Date to create one."
              : filter === "completed"
              ? "Nothing completed yet."
              : `No ${filter} due dates. You're all caught up!`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <DueDateCard key={item.id} item={item} onLinkedEventExists={!!events.find((e) => e.id === item.calendarEventId)} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatChip({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div
      className="p-3 rounded-lg flex flex-col gap-1"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
    >
      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{label}</span>
      <span className="text-xl font-bold tnum" style={{ color: accent }}>{value}</span>
    </div>
  );
}

function DueDateCard({ item, onLinkedEventExists }: { item: DueDate; onLinkedEventExists: boolean }) {
  const meta = PRIORITY_META[item.priority];
  const dueMs = new Date(item.dueAt).getTime();
  const dueLabel = new Date(item.dueAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const isOverdue = !item.completed && dueMs < Date.now();

  return (
    <div
      className="saas-card p-5 flex flex-col gap-3 group"
      style={{
        opacity: item.completed ? 0.65 : 1,
      }}
    >
      {/* Top row: category + priority + completion */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.category && (
            <span className="saas-pill" style={{ color: "var(--accent-indigo)", background: "rgba(72, 102, 254, 0.12)" }}>
              {item.category}
            </span>
          )}
          <span className="saas-pill" style={{ color: meta.color, background: meta.bg }}>
            {meta.label}
          </span>
          {onLinkedEventExists && (
            <span
              className="saas-pill"
              title="Also added to your calendar"
              style={{ color: "var(--text-tertiary)", background: "var(--bg-tertiary)" }}
            >
              📅 on calendar
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => toggleDueDateDone(item.id)}
          aria-label={item.completed ? "Mark as not done" : "Mark as done"}
          className="shrink-0 flex items-center justify-center transition-all"
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            border: `2px solid ${item.completed ? "var(--accent)" : "var(--border)"}`,
            background: item.completed ? "var(--accent)" : "transparent",
            cursor: "pointer",
          }}
        >
          {item.completed && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Title + description */}
      <div>
        <div
          className="text-sm font-semibold"
          style={{
            color: "var(--text-primary)",
            textDecoration: item.completed ? "line-through" : "none",
          }}
        >
          {item.title}
        </div>
        {item.description && (
          <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {item.description}
          </div>
        )}
      </div>

      {/* Countdown */}
      {!item.completed && (
        <div
          className="flex items-center justify-between p-2 rounded-lg"
          style={{ background: "var(--bg-tertiary)", borderRadius: "var(--radius-xs)" }}
        >
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: "var(--text-tertiary)" }}>
              <path d="M12 8V12L14.5 14.5M12 3C7 3 3 7 3 12C3 17 7 21 12 21C17 21 21 17 21 12C21 7 17 3 12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{isOverdue ? "Overdue" : "Due"}</span>
          </div>
          <CountdownDisplay dueAt={dueMs} />
        </div>
      )}

      {/* Bottom row: full date + delete */}
      <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid var(--border-light)" }}>
        <span className="text-xs tnum" style={{ color: "var(--text-tertiary)" }}>
          {dueLabel}
        </span>
        <button
          type="button"
          onClick={() => deleteDueDate(item.id)}
          aria-label="Delete due date"
          className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 4,
            borderRadius: 6,
            color: "var(--accent-rose)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}