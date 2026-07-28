"use client";

import { useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useEvents,
  useTasks,
  addEvent,
  toggleTaskDone,
  updateEvent,
  deleteEvent,
  PRIORITY_META,
  dateOnly,
  type CalendarEvent,
  type Priority,
} from "@/lib/eventStore";

/**
 * Tasks page.
 *
 * Tasks are NOT a separate list — they are calendar events of type TASK.
 * The user adds a task by giving it a title + date/time/priority, which
 * adds a TASK-typed event to the calendar. Checking one off updates the
 * event's status (DONE / TODO). Deleting removes the event.
 *
 * For deadline-style items that AREN'T on the calendar at a specific time
 * (e.g. "Math Problem Set 4 — due Friday"), use the Due Dates page.
 */

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDue(date: string): { label: string; tone: "overdue" | "today" | "soon" | "later" } {
  const today = todayISO();
  if (date < today) return { label: `${date} · overdue`, tone: "overdue" };
  if (date === today) return { label: "Today", tone: "today" };
  const days = Math.round((new Date(date).getTime() - new Date(today).getTime()) / 86400000);
  if (days <= 3) return { label: `in ${days} day${days === 1 ? "" : "s"}`, tone: "soon" };
  return { label: date, tone: "later" };
}

function TasksContent() {
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const tasks = useTasks();
  const allEvents = useEvents();
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "done">("open");

  // Form state
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("MEDIUM");
  const [newDate, setNewDate] = useState<string>(todayISO());
  const [newTime, setNewTime] = useState<string>("09:00");
  const [newDuration, setNewDuration] = useState(60);
  const [newProject, setNewProject] = useState("");

  const filtered = useMemo(() => {
    let list = tasks;
    if (filter === "open") list = list.filter((t) => t.status !== "DONE");
    if (filter === "done") list = list.filter((t) => t.status === "DONE");
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
      );
    }
    const priorityOrder: Record<Priority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return [...list].sort((a, b) => {
      if (a.status !== b.status) return a.status === "DONE" ? 1 : -1;
      const p = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (p !== 0) return p;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [tasks, q, filter]);

  const counts = useMemo(() => {
    const open = tasks.filter((t) => t.status !== "DONE").length;
    const done = tasks.filter((t) => t.status === "DONE").length;
    const overdue = tasks.filter((t) => t.status !== "DONE" && dateOnly(t.startTime) < todayISO()).length;
    return { all: tasks.length, open, done, overdue };
  }, [tasks]);

  const resetForm = () => {
    setShowNew(false);
    setNewTitle("");
    setNewPriority("MEDIUM");
    setNewDate(todayISO());
    setNewTime("09:00");
    setNewDuration(60);
    setNewProject("");
  };

  const addTask = () => {
    if (!newTitle.trim()) return;
    // Build ISO datetime in user's local TZ from the date+time+duration fields.
    const start = new Date(`${newDate}T${newTime}:00`);
    const end = new Date(start.getTime() + newDuration * 60 * 1000);
    addEvent({
      title: newTitle.trim(),
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      eventType: "TASK",
      status: "TODO",
      priority: newPriority,
      tags: newProject.trim() ? [newProject.trim()] : [],
    });
    resetForm();
  };

  const grouped = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const t of filtered) {
      const day = dateOnly(t.startTime);
      (map[day] ??= []).push(t);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Tasks</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {q
              ? `${filtered.length} result${filtered.length === 1 ? "" : "s"} for "${searchParams.get("q")}"`
              : `${counts.open} open · ${counts.done} done${counts.overdue ? ` · ${counts.overdue} overdue` : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/due-dates"
            className="text-xs px-3 py-2 rounded-md transition-colors"
            style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}
            title="Deadlines that don't fit a calendar slot go on the Due Dates page"
          >
            Need a deadline instead? →
          </Link>
          <button
            type="button"
            className="saas-btn-primary px-4 py-2 text-sm flex items-center gap-1.5"
            onClick={() => (showNew ? resetForm() : setShowNew(true))}
          >
            {showNew ? "Cancel" : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Add Task
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-4 p-1 rounded-lg" style={{ background: "var(--bg-tertiary)", width: "fit-content" }}>
        {(["open", "all", "done"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize"
            style={{
              background: filter === f ? "var(--bg-secondary)" : "transparent",
              color: filter === f ? "var(--text-primary)" : "var(--text-tertiary)",
              boxShadow: filter === f ? "var(--shadow-card)" : "none",
            }}
          >
            {f === "open" ? `Open · ${counts.open}` : f === "done" ? `Done · ${counts.done}` : `All · ${counts.all}`}
          </button>
        ))}
      </div>

      {/* Add task form */}
      {showNew && (
        <div className="saas-card p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="What needs doing?"
              className="flex-1 px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="text-xs block mb-1.5 font-medium" style={{ color: "var(--text-secondary)" }}>
                Date
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="text-xs block mb-1.5 font-medium" style={{ color: "var(--text-secondary)" }}>
                Time
              </label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="text-xs block mb-1.5 font-medium" style={{ color: "var(--text-secondary)" }}>
                Duration (min)
              </label>
              <input
                type="number"
                min={5}
                max={480}
                step={5}
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none tnum"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="text-xs block mb-1.5 font-medium" style={{ color: "var(--text-secondary)" }}>
                Project / Tag (optional)
              </label>
              <input
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                placeholder="General"
                className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="text-xs block mb-1.5 font-medium" style={{ color: "var(--text-secondary)" }}>
              Priority
            </label>
            <div className="flex gap-1.5">
              {(["LOW", "MEDIUM", "HIGH", "URGENT"] as Priority[]).map((p) => {
                const meta = PRIORITY_META[p];
                const active = newPriority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewPriority(p)}
                    className="flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all capitalize"
                    style={{
                      background: active ? meta.bg : "var(--bg-tertiary)",
                      color: active ? meta.color : "var(--text-tertiary)",
                      border: `1px solid ${active ? meta.border : "var(--border)"}`,
                    }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="saas-btn px-4 py-2 text-sm" onClick={resetForm}>
              Cancel
            </button>
            <button
              type="button"
              className="saas-btn-primary px-4 py-2 text-sm"
              onClick={addTask}
              disabled={!newTitle.trim()}
              style={{ opacity: newTitle.trim() ? 1 : 0.5 }}
            >
              Add task to calendar
            </button>
          </div>
        </div>
      )}

      {/* Task list grouped by date */}
      {filtered.length === 0 ? (
        <div className="saas-card-lg p-12 text-center">
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {filter === "open" && counts.done > 0
              ? "All caught up. Nothing open."
              : filter === "done"
              ? "No completed tasks yet."
              : q
              ? "No tasks match your search."
              : "No tasks yet. Click Add Task to put one on your calendar."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(([day, dayTasks]) => {
            const dayDate = new Date(`${day}T12:00:00Z`);
            const dayLabel = dayDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
            const isToday = day === todayISO();
            return (
              <div key={day} className="saas-card-lg p-3">
                <div className="flex items-center justify-between px-2 py-1 mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: isToday ? "var(--accent)" : "var(--text-secondary)" }}>
                    {isToday ? `Today · ${dayLabel}` : dayLabel}
                  </h3>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {dayTasks.length} task{dayTasks.length === 1 ? "" : "s"}
                  </span>
                </div>
                <ul className="flex flex-col">
                  {dayTasks.map((t) => (
                    <TaskRow key={t.id} task={t} />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: CalendarEvent }) {
  const meta = PRIORITY_META[task.priority];
  const day = dateOnly(task.startTime);
  const due = formatDue(day);
  const dueColor =
    due.tone === "overdue" ? "#F43F5E" :
    due.tone === "today"   ? "#F59E0B" :
    due.tone === "soon"    ? "#F59E0B" : "var(--text-tertiary)";
  const startTime = new Date(task.startTime);
  const timeLabel = startTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  return (
    <li
      className="group flex items-center gap-3 px-2 py-2 rounded-lg transition-colors hover:bg-bg-hover"
      style={{ borderRadius: "var(--radius-xs)" }}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={() => toggleTaskDone(task.id)}
        aria-label={task.status === "DONE" ? "Mark as not done" : "Mark as done"}
        className="shrink-0 flex items-center justify-center transition-all"
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          border: `2px solid ${task.status === "DONE" ? "var(--accent)" : "var(--border)"}`,
          background: task.status === "DONE" ? "var(--accent)" : "transparent",
          cursor: "pointer",
        }}
      >
        {task.status === "DONE" && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Priority dot */}
      <span
        aria-hidden
        className="shrink-0"
        style={{
          width: 8,
          height: 8,
          borderRadius: 9999,
          background: meta.dot,
          opacity: task.status === "DONE" ? 0.3 : 1,
        }}
        title={meta.label}
      />

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-medium truncate"
          style={{
            color: task.status === "DONE" ? "var(--text-tertiary)" : "var(--text-primary)",
            textDecoration: task.status === "DONE" ? "line-through" : "none",
          }}
        >
          {task.title}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
          <span className="tnum">{timeLabel}</span>
          {(task.tags ?? []).length > 0 && (
            <>
              <span style={{ color: "var(--border)" }}>·</span>
              <span className="truncate">{(task.tags ?? []).join(", ")}</span>
            </>
          )}
          <span style={{ color: "var(--border)" }}>·</span>
          <span style={{ color: dueColor, fontWeight: due.tone === "overdue" || due.tone === "today" ? 600 : 400 }}>
            {due.label}
          </span>
        </div>
      </div>

      {/* Priority pill (clickable to change) */}
      <select
        value={task.priority}
        onChange={(e) => updateEvent(task.id, { priority: e.target.value as Priority })}
        className="text-xs font-medium px-2 py-1 rounded-full cursor-pointer appearance-none focus:outline-none"
        style={{
          background: meta.bg,
          color: meta.color,
          border: `1px solid ${meta.border}`,
          paddingRight: 20,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M6 9l6 6 6-6' stroke='${encodeURIComponent(meta.color)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 6px center",
        }}
        aria-label="Change priority"
      >
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="URGENT">Urgent</option>
      </select>

      {/* Delete (appears on hover) */}
      <button
        type="button"
        onClick={() => deleteEvent(task.id)}
        aria-label="Delete task"
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 4,
          borderRadius: 6,
          color: "var(--text-tertiary)",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </li>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="animate-fade-slide-up text-sm" style={{ color: "var(--text-tertiary)" }}>Loading tasks…</div>}>
      <TasksContent />
    </Suspense>
  );
}