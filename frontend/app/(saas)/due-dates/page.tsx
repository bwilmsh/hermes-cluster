"use client";

const MOCK = [
  { id: "1", title: "Math Problem Set 4", dueDate: "2 days ago", dueTime: "23:59", priority: "HIGH", status: "OVERDUE", category: "ASSIGNMENT" },
  { id: "2", title: "Biology Midterm", dueDate: "Tomorrow", dueTime: "09:00", priority: "URGENT", status: "PENDING", category: "EXAM" },
  { id: "3", title: "Q3 Roadmap Doc", dueDate: "Next week", dueTime: "17:00", priority: "MEDIUM", status: "PENDING", category: "WORK" },
];

const PRIORITY_COLORS: Record<string, string> = { URGENT: "var(--accent-rose)", HIGH: "var(--accent-amber)", MEDIUM: "var(--accent-teal)", LOW: "var(--text-tertiary)" };
const STATUS_GROUPS = [
  { id: "OVERDUE", label: "Overdue", color: "var(--accent-rose)" },
  { id: "PENDING", label: "Pending", color: "var(--text-secondary)" },
  { id: "COMPLETED", label: "Completed", color: "var(--accent-green)" },
];

export default function DueDatesPage() {
  return (
    <div className="animate-fade-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div className="accent-bar"><h1 className="text-2xl font-bold tracking-tight">Due Dates</h1></div>
        <button className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "var(--accent-indigo)" }}>+ Add Due Date</button>
      </div>
      {STATUS_GROUPS.map((group) => {
        const items = MOCK.filter((d) => d.status === group.id);
        if (items.length === 0) return null;
        return (
          <div key={group.id} className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: group.color }}>{group.label}</h2>
            <div className="space-y-2">
              {items.map((d) => (
                <div key={d.id} className="glass p-4 card-hover flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{d.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
                      <span className="tnum">{d.dueDate} · {d.dueTime}</span>
                      <span className="px-2 py-0.5 rounded" style={{ background: "var(--bg-hover)" }}>{d.category}</span>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium capitalize" style={{ background: "var(--bg-hover)", color: PRIORITY_COLORS[d.priority] }}>
                    {d.priority.toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
