"use client";

const TEMPLATES = [
  { id: "1", name: "Daily Morning Briefing", description: "Every morning at 8am, summarize tasks, events, and overdue items.", category: "Daily", icon: "☀" },
  { id: "2", name: "Weekly Friday Review", description: "Every Friday at 5pm, review the week and plan next week.", category: "Weekly", icon: "📅" },
  { id: "3", name: "Overdue Task Reminder", description: "Check for overdue tasks every 2 hours and notify in chat.", category: "Monitoring", icon: "⚠" },
];

export default function WorkflowsPage() {
  return (
    <div className="animate-fade-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div className="accent-bar"><h1 className="text-2xl font-bold tracking-tight">Workflows</h1></div>
        <button className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "var(--accent-indigo)" }}>+ New Workflow</button>
      </div>

      {/* Seeded templates */}
      <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">Templates</h2>
      <div className="grid md:grid-cols-3 gap-4 mb-8 stagger">
        {TEMPLATES.map((t) => (
          <div key={t.id} className="workflow-card glass p-4 cursor-pointer">
            <div className="text-2xl mb-2">{t.icon}</div>
            <h3 className="font-medium mb-1">{t.name}</h3>
            <p className="text-sm text-text-secondary mb-3">{t.description}</p>
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--bg-hover)", color: "var(--text-tertiary)" }}>{t.category}</span>
          </div>
        ))}
      </div>

      {/* Empty state with sample chain */}
      <h2 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">Your Workflows</h2>
      <div className="glass p-8 text-center">
        <div className="inline-flex items-center gap-3 mb-4 opacity-50">
          <div className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--bg-hover)" }}>Trigger</div>
          <svg width="40" height="2" className="workflow-connector"><line x1="0" y1="1" x2="40" y2="1" stroke="var(--accent-teal)" strokeWidth="2" strokeDasharray="4 4" /></svg>
          <div className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--bg-hover)" }}>Action</div>
          <svg width="40" height="2" className="workflow-connector"><line x1="0" y1="1" x2="40" y2="1" stroke="var(--accent-indigo)" strokeWidth="2" strokeDasharray="4 4" /></svg>
          <div className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--bg-hover)" }}>Notify</div>
        </div>
        <p className="text-sm text-text-tertiary">No custom workflows yet. Pick a template above to get started.</p>
      </div>
    </div>
  );
}
