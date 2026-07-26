"use client";

import { useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Urgency = "low" | "medium" | "urgent";
type Status = "todo" | "done";

interface Task {
  id: string;
  title: string;
  status: Status;
  urgency: Urgency;
  /** ISO date string (YYYY-MM-DD) — when the task needs to be done by */
  due: string;
  project: string;
}

const INITIAL_TASKS: Task[] = [
  { id: "1", title: "Review PR #142", status: "todo", urgency: "urgent", due: "2026-07-27", project: "API Migration" },
  { id: "2", title: "Ship scheduler view", status: "todo", urgency: "urgent", due: "2026-07-29", project: "Mobile App" },
  { id: "3", title: "Send invoices", status: "todo", urgency: "medium", due: "2026-07-31", project: "Finance" },
  { id: "4", title: "Plan Q3 roadmap", status: "todo", urgency: "low", due: "2026-08-15", project: "Q3 Roadmap" },
  { id: "5", title: "Design review", status: "done", urgency: "medium", due: "2026-07-20", project: "Marketing" },
  { id: "6", title: "Client demo prep", status: "todo", urgency: "urgent", due: "2026-07-28", project: "Mobile App" },
  { id: "7", title: "Update documentation", status: "todo", urgency: "low", due: "2026-08-10", project: "API Migration" },
  { id: "8", title: "Fix login bug", status: "done", urgency: "urgent", due: "2026-07-22", project: "Mobile App" },
];

const URGENCY_META: Record<Urgency, { label: string; color: string; bg: string; border: string; dot: string }> = {
  low:    { label: "Low",    color: "#6F87FC", bg: "rgba(111, 135, 252, 0.12)", border: "rgba(111, 135, 252, 0.30)", dot: "#6F87FC" },
  medium: { label: "Medium", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)",  border: "rgba(245, 158, 11, 0.30)",  dot: "#F59E0B" },
  urgent: { label: "Urgent", color: "#F43F5E", bg: "rgba(244, 63, 94, 0.12)",   border: "rgba(244, 63, 94, 0.30)",   dot: "#F43F5E" },
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDue(due: string): { label: string; tone: "overdue" | "today" | "soon" | "later" } {
  const today = todayISO();
  if (due < today) return { label: `${due} · overdue`, tone: "overdue" };
  if (due === today) return { label: "Today", tone: "today" };
  const days = Math.round((new Date(due).getTime() - new Date(today).getTime()) / 86400000);
  if (days <= 3) return { label: `${due} · in ${days} day${days === 1 ? "" : "s"}`, tone: "soon" };
  return { label: due, tone: "later" };
}

function TasksContent() {
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "done">("open");

  // New task form state
  const [newTitle, setNewTitle] = useState("");
  const [newUrgency, setNewUrgency] = useState<Urgency>("medium");
  const [newDue, setNewDue] = useState<string>("");
  const [newProject, setNewProject] = useState("General");

  const filtered = useMemo(() => {
    let list = tasks;
    if (filter === "open") list = list.filter((t) => t.status === "todo");
    if (filter === "done") list = list.filter((t) => t.status === "done");
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.project.toLowerCase().includes(q) ||
          t.urgency.toLowerCase().includes(q)
      );
    }
    // Sort: urgent first, then by due date, then by id
    const urgencyOrder: Record<Urgency, number> = { urgent: 0, medium: 1, low: 2 };
    return [...list].sort((a, b) => {
      if (a.status !== b.status) return a.status === "todo" ? -1 : 1;
      const u = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (u !== 0) return u;
      return a.due.localeCompare(b.due);
    });
  }, [tasks, q, filter]);

  const counts = useMemo(() => {
    const open = tasks.filter((t) => t.status === "todo").length;
    const done = tasks.filter((t) => t.status === "done").length;
    const overdue = tasks.filter((t) => t.status === "todo" && t.due < todayISO()).length;
    return { all: tasks.length, open, done, overdue };
  }, [tasks]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: t.status === "todo" ? "done" : "todo" } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const updateUrgency = (id: string, urgency: Urgency) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, urgency } : t)));
  };

  const addTask = () => {
    if (!newTitle.trim()) return;
    const id = String(Date.now());
    const due = newDue || todayISO();
    setTasks((prev) => [
      { id, title: newTitle.trim(), status: "todo", urgency: newUrgency, due, project: newProject.trim() || "General" },
      ...prev,
    ]);
    setNewTitle("");
    setNewUrgency("medium");
    setNewDue("");
    setNewProject("General");
    setShowNew(false);
  };

  const resetForm = () => {
    setShowNew(false);
    setNewTitle("");
    setNewUrgency("medium");
    setNewDue("");
    setNewProject("General");
  };

  return (
    <div className="animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Tasks</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {q
              ? `${filtered.length} result${filtered.length === 1 ? "" : "s"} for “${searchParams.get("q")}”`
              : `${counts.open} open · ${counts.done} done${counts.overdue ? ` · ${counts.overdue} overdue` : ""}`}
          </p>
        </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs block mb-1.5 font-medium" style={{ color: "var(--text-secondary)" }}>
                Urgency
              </label>
              <div className="flex gap-1.5">
                {(["low", "medium", "urgent"] as const).map((u) => {
                  const meta = URGENCY_META[u];
                  const active = newUrgency === u;
                  return (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setNewUrgency(u)}
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
            <div>
              <label className="text-xs block mb-1.5 font-medium" style={{ color: "var(--text-secondary)" }}>
                Needs to be done by
              </label>
              <input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                min={todayISO()}
                className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="text-xs block mb-1.5 font-medium" style={{ color: "var(--text-secondary)" }}>
                Project
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
              Add task
            </button>
          </div>
        </div>
      )}

      {/* Todo list */}
      <div className="saas-card-lg p-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm" style={{ color: "var(--text-tertiary)" }}>
            {filter === "open" && counts.done > 0
              ? "All caught up. Nothing open."
              : filter === "done"
              ? "No completed tasks yet."
              : q
              ? "No tasks match your search."
              : "No tasks yet. Click Add Task to get started."}
          </div>
        )}
        <ul className="flex flex-col">
          {filtered.map((t) => {
            const meta = URGENCY_META[t.urgency];
            const due = formatDue(t.due);
            const dueColor =
              due.tone === "overdue" ? "#F43F5E" :
              due.tone === "today"   ? "#F59E0B" :
              due.tone === "soon"    ? "#F59E0B" : "var(--text-tertiary)";

            return (
              <li
                key={t.id}
                className="group flex items-center gap-3 px-3 py-3 rounded-lg transition-colors"
                style={{ borderRadius: "var(--radius-xs)" }}
              >
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleTask(t.id)}
                  aria-label={t.status === "done" ? "Mark as not done" : "Mark as done"}
                  className="shrink-0 flex items-center justify-center transition-all"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    border: `2px solid ${t.status === "done" ? "var(--accent)" : "var(--border)"}`,
                    background: t.status === "done" ? "var(--accent)" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  {t.status === "done" && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {/* Urgency dot */}
                <span
                  aria-hidden
                  className="shrink-0"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 9999,
                    background: meta.dot,
                    opacity: t.status === "done" ? 0.3 : 1,
                  }}
                  title={meta.label}
                />

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-medium truncate"
                    style={{
                      color: t.status === "done" ? "var(--text-tertiary)" : "var(--text-primary)",
                      textDecoration: t.status === "done" ? "line-through" : "none",
                    }}
                  >
                    {t.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                    <span className="truncate">{t.project}</span>
                    <span style={{ color: "var(--border)" }}>·</span>
                    <span style={{ color: dueColor, fontWeight: due.tone === "overdue" || due.tone === "today" ? 600 : 400 }}>
                      {due.label}
                    </span>
                  </div>
                </div>

                {/* Urgency pill (clickable to change) */}
                <select
                  value={t.urgency}
                  onChange={(e) => updateUrgency(t.id, e.target.value as Urgency)}
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
                  aria-label="Change urgency"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="urgent">Urgent</option>
                </select>

                {/* Delete (appears on hover) */}
                <button
                  type="button"
                  onClick={() => deleteTask(t.id)}
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
          })}
        </ul>
      </div>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="animate-fade-slide-up text-sm" style={{ color: "var(--text-tertiary)" }}>Loading tasks…</div>}>
      <TasksContent />
    </Suspense>
  );
}
