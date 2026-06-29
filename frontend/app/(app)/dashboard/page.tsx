"use client";

import { useState, useEffect } from "react";

interface Task {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
  tags?: string[];
  overdue?: boolean;
}

interface Event {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  weekday?: string;
}

const MOCK_TASKS: Task[] = [
  { id: "1", title: "Review PR #142", status: "todo", tags: ["review"], overdue: true },
  { id: "2", title: "Ship scheduler view", status: "todo", tags: ["dev", "urgent"] },
  { id: "3", title: "Migrate scheduler", status: "in-progress", tags: ["dev"] },
  { id: "4", title: "Send invoices", status: "todo", tags: ["finance"] },
  { id: "5", title: "Plan Q3 roadmap", status: "todo", tags: ["planning"] },
];

const MOCK_TODAY_EVENTS: Event[] = [
  { id: "e1", title: "Team Standup", startTime: "09:00", endTime: "09:15" },
  { id: "e2", title: "Ship scheduler view", startTime: "09:30", endTime: "12:00" },
  { id: "e3", title: "Client Review", startTime: "12:00", endTime: "13:00" },
  { id: "e4", title: "Lunch with Alex", startTime: "13:30", endTime: "14:30" },
  { id: "e5", title: "Submit Q3 report", startTime: "15:00" },
];

const MOCK_WEEK_EVENTS: Event[] = [
  { id: "w1", title: "1:1 with manager", startTime: "10:00", weekday: "Tue" },
  { id: "w2", title: "Product demo", startTime: "15:00", weekday: "Wed" },
  { id: "w3", title: "Sprint review", startTime: "09:00", weekday: "Thu" },
  { id: "w4", title: "Retro", startTime: "16:00", weekday: "Fri" },
];

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [quickAdd, setQuickAdd] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const now = new Date();
    setDate(now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
  }, []);

  const addTask = (title: string) => {
    if (!title.trim()) return;
    setTasks([{ id: Date.now().toString(), title, status: "todo" }, ...tasks]);
    setQuickAdd("");
  };

  const toggleDone = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status: "done" } : t)));
    setTimeout(() => setTasks(tasks.filter((t) => t.id !== id)), 300);
  };

  const overdueTasks = tasks.filter((t) => t.overdue);
  const activeTasks = tasks.filter((t) => !t.overdue && t.status !== "done");

  return (
    <div className="animate-fade-slide-up">
      {/* Header */}
      <div className="mb-6">
        <div className="accent-bar text-xs text-text-tertiary tnum mb-1">{date}</div>
        <h1 className="text-2xl font-bold tracking-tight">Today</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Tasks panel */}
        <div className="glass p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">Tasks</h2>
          {/* Quick add */}
          <form
            onSubmit={(e) => { e.preventDefault(); addTask(quickAdd); }}
            className="flex items-center gap-2 mb-4 pb-2 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <input
              type="text"
              value={quickAdd}
              onChange={(e) => setQuickAdd(e.target.value)}
              placeholder="Add a task..."
              aria-label="Add a task"
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-text-tertiary"
            />
            <button type="submit" className="text-text-tertiary hover:text-text-primary transition-colors">+</button>
          </form>

          {/* Overdue section */}
          {overdueTasks.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--accent-rose)" }}>
                ⚠ Overdue
              </div>
              <div className="space-y-1">
                {overdueTasks.map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={toggleDone} />
                ))}
              </div>
            </div>
          )}

          {/* Active tasks */}
          <div className="space-y-1">
            {activeTasks.length === 0 ? (
              <p className="text-sm text-text-tertiary text-center py-8">All clear. Add a task above to get started.</p>
            ) : (
              activeTasks.map((t) => <TaskRow key={t.id} task={t} onToggle={toggleDone} />)
            )}
          </div>
        </div>

        {/* Events panel */}
        <div className="glass p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">Today's Events</h2>
          {MOCK_TODAY_EVENTS.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-8">No events today.</p>
          ) : (
            <div className="space-y-1">
              {MOCK_TODAY_EVENTS.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-bg-hover transition-colors cursor-pointer group"
                >
                  <span className="tnum text-sm w-12 shrink-0" style={{ color: "var(--text-secondary)" }}>
                    {ev.startTime}
                  </span>
                  <span className="text-sm flex-1">{ev.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* Divider + rest of week */}
          {MOCK_WEEK_EVENTS.length > 0 && (
            <>
              <div className="flex items-center gap-2 my-4">
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                <span className="text-xs text-text-tertiary">Rest of week</span>
                <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              </div>
              <div className="space-y-1">
                {MOCK_WEEK_EVENTS.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-bg-hover transition-colors cursor-pointer"
                  >
                    <span className="text-xs w-8 shrink-0 text-text-tertiary">{ev.weekday}</span>
                    <span className="tnum text-sm w-12 shrink-0" style={{ color: "var(--text-secondary)" }}>
                      {ev.startTime}
                    </span>
                    <span className="text-sm flex-1">{ev.title}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const glyph = task.status === "in-progress" ? "⊡" : "☐";
  return (
    <div className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-bg-hover transition-colors group" style={{ minHeight: 36 }}>
      <button
        onClick={() => onToggle(task.id)}
        className="text-base shrink-0 hover:scale-110 transition-transform"
        style={{ color: task.status === "done" ? "var(--accent-teal)" : "var(--text-tertiary)" }}
        role="checkbox"
        aria-checked={task.status === "done"}
      >
        {glyph}
      </button>
      <span className={`text-sm flex-1 ${task.status === "done" ? "line-through text-text-tertiary" : ""}`}>
        {task.title}
      </span>
      {task.tags?.map((tag) => (
        <span key={tag} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--bg-hover)", color: "var(--text-tertiary)" }}>
          {tag}
        </span>
      ))}
    </div>
  );
}
