"use client";

const MOCK = [
  { id: "1", goalText: "Ship the scheduler feature by end of week", deadline: "5 days", autoRun: false },
  { id: "2", goalText: "Read 100 pages this week", deadline: "7 days", autoRun: true, action: "SEND_NOTIFICATION" },
];

export default function GoalsPage() {
  return (
    <div className="animate-fade-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div className="accent-bar"><h1 className="text-2xl font-bold tracking-tight">Goals</h1></div>
        <button className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "var(--accent-indigo)" }}>+ New Goal</button>
      </div>
      <div className="space-y-3 stagger">
        {MOCK.map((g) => (
          <div key={g.id} className="glass p-4 card-hover">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium mb-1">{g.goalText}</h3>
                <div className="flex items-center gap-3 text-xs text-text-tertiary">
                  <span>Deadline: <span className="tnum">{g.deadline}</span></span>
                  {g.autoRun && <span className="px-2 py-0.5 rounded" style={{ background: "var(--glow-teal)", color: "var(--accent-teal)" }}>⚙ {g.action?.toLowerCase().replace(/_/g, " ")}</span>}
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-text-secondary">
                <input type="checkbox" defaultChecked={g.autoRun} /> Auto-run
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
