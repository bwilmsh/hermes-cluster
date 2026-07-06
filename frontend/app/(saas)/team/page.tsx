"use client";

export default function TeamPage() {
  const members = [
    { id: "1", name: "Benji", role: "Workspace Owner", color: "#FF6B35", tasks: 12, completed: 48 },
    { id: "2", name: "James D", role: "Lead Designer", color: "#8B5CF6", tasks: 8, completed: 32 },
    { id: "3", name: "Maria K", role: "Senior Engineer", color: "#3B82F6", tasks: 15, completed: 41 },
    { id: "4", name: "Alex S", role: "Product Manager", color: "#22C55E", tasks: 6, completed: 28 },
    { id: "5", name: "Ryan B", role: "Frontend Dev", color: "#F59E0B", tasks: 10, completed: 35 },
    { id: "6", name: "Tina L", role: "QA Engineer", color: "#F43F5E", tasks: 7, completed: 22 },
  ];
  return (
    <div className="animate-fade-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Team</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>{members.length} members</p>
        </div>
        <button className="saas-btn-primary px-4 py-2 text-sm">+ Invite Member</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m) => (
          <div key={m.id} className="saas-card p-5 flex items-center gap-4">
            <div className="saas-avatar" style={{ width: 48, height: 48, fontSize: 16, background: m.color }}>
              {m.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{m.name}</div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{m.role}</div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{m.tasks} active</span>
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{m.completed} done</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
