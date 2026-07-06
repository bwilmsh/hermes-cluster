"use client";

export default function TasksPage() {
  const tasks = [
    { id: "1", title: "Review PR #142", status: "todo", priority: "HIGH", project: "API Migration" },
    { id: "2", title: "Ship scheduler view", status: "in-progress", priority: "HIGH", project: "Mobile App" },
    { id: "3", title: "Send invoices", status: "todo", priority: "MEDIUM", project: "Finance" },
    { id: "4", title: "Plan Q3 roadmap", status: "todo", priority: "LOW", project: "Q3 Roadmap" },
    { id: "5", title: "Design review", status: "done", priority: "MEDIUM", project: "Marketing" },
    { id: "6", title: "Client demo prep", status: "in-progress", priority: "HIGH", project: "Mobile App" },
    { id: "7", title: "Update documentation", status: "todo", priority: "LOW", project: "API Migration" },
    { id: "8", title: "Fix login bug", status: "done", priority: "HIGH", project: "Mobile App" },
  ];
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
  return (
    <div className="animate-fade-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Tasks</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>{tasks.length} tasks across all projects</p>
        </div>
        <button className="saas-btn-primary px-4 py-2 text-sm">+ New Task</button>
      </div>
      <div className="saas-card-lg p-6">
        <div className="flex flex-col gap-1">
          {tasks.map((t) => {
            const sc = statusColors[t.status];
            return (
              <div key={t.id} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-bg-hover transition-colors" style={{ borderRadius: "var(--radius-xs)" }}>
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
