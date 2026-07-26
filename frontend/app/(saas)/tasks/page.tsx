"use client";

import { useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const INITIAL_TASKS = [
  { id: "1", title: "Review PR #142", status: "todo", priority: "HIGH", project: "API Migration" },
  { id: "2", title: "Ship scheduler view", status: "in-progress", priority: "HIGH", project: "Mobile App" },
  { id: "3", title: "Send invoices", status: "todo", priority: "MEDIUM", project: "Finance" },
  { id: "4", title: "Plan Q3 roadmap", status: "todo", priority: "LOW", project: "Q3 Roadmap" },
  { id: "5", title: "Design review", status: "done", priority: "MEDIUM", project: "Marketing" },
  { id: "6", title: "Client demo prep", status: "in-progress", priority: "HIGH", project: "Mobile App" },
  { id: "7", title: "Update documentation", status: "todo", priority: "LOW", project: "API Migration" },
  { id: "8", title: "Fix login bug", status: "done", priority: "HIGH", project: "Mobile App" },
];

type Task = (typeof INITIAL_TASKS)[number];

function TasksContent() {
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newProject, setNewProject] = useState("General");

  const filtered = useMemo(() => {
    if (!q) return tasks;
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.project.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q) ||
        t.priority.toLowerCase().includes(q)
    );
  }, [tasks, q]);

  const statusColors: Record<string, { color: string; bg: string }> = {
    todo: { color: "#F59E0B", bg: "#FFF8E1" },
    "in-progress": { color: "#3B82F6", bg: "#E3F2FD" },
    done: { color: "#22C55E", bg: "#E8F5E9" },
  };
  const priorityColors: Record<string, string> = {
    HIGH: "#F43F5E",
    MEDIUM: "#F59E0B",
    LOW: "#9CA3AF",
  };

  const addTask = () => {
    if (!newTitle.trim()) return;
    const id = String(Date.now());
    setTasks((prev) => [
      { id, title: newTitle.trim(), status: "todo", priority: "MEDIUM", project: newProject.trim() || "General" },
      ...prev,
    ]);
    setNewTitle("");
    setNewProject("General");
    setShowNew(false);
  };

  const cycleStatus = (id: string) => {
    const order = ["todo", "in-progress", "done"] as const;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next = order[(order.indexOf(t.status as (typeof order)[number]) + 1) % order.length];
        return { ...t, status: next };
      })
    );
  };

  return (
    <div className="animate-fade-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Tasks</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {q
              ? `${filtered.length} result${filtered.length === 1 ? "" : "s"} for “${searchParams.get("q")}”`
              : `${tasks.length} tasks across all projects`}
          </p>
        </div>
        <button type="button" className="saas-btn-primary px-4 py-2 text-sm" onClick={() => setShowNew((v) => !v)}>
          {showNew ? "Cancel" : "+ New Task"}
        </button>
      </div>

      {showNew && (
        <div className="saas-card p-4 mb-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex-1">
            <label className="text-xs block mb-1" style={{ color: "var(--text-tertiary)" }}>Title</label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="What needs doing?"
              className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              autoFocus
            />
          </div>
          <div className="sm:w-40">
            <label className="text-xs block mb-1" style={{ color: "var(--text-tertiary)" }}>Project</label>
            <input
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          <button type="button" className="saas-btn-primary px-4 py-2 text-sm" onClick={addTask}>
            Add task
          </button>
        </div>
      )}

      <div className="saas-card-lg p-6">
        <div className="flex flex-col gap-1">
          {filtered.length === 0 && (
            <div className="text-center py-10 text-sm" style={{ color: "var(--text-tertiary)" }}>
              No tasks match your search.
            </div>
          )}
          {filtered.map((t) => {
            const sc = statusColors[t.status];
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => cycleStatus(t.id)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-bg-hover transition-colors text-left w-full"
                style={{ borderRadius: "var(--radius-xs)", background: "transparent", border: "none", cursor: "pointer" }}
                title="Click to cycle status"
              >
                <div className="saas-avatar" style={{ width: 24, height: 24, fontSize: 10, background: priorityColors[t.priority] }}>
                  {t.priority[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${t.status === "done" ? "line-through" : ""}`} style={{ color: t.status === "done" ? "var(--text-tertiary)" : "var(--text-primary)" }}>
                    {t.title}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{t.project}</div>
                </div>
                <span className="saas-pill" style={{ color: sc.color, background: sc.bg }}>
                  {t.status.replace("-", " ")}
                </span>
              </button>
            );
          })}
        </div>
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
