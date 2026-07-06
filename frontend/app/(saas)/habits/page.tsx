"use client";

const MOCK_HABITS = [
  { id: "1", name: "Morning Standup", frequency: "DAILY", idealTime: "MORNING", streak: 0, active: true, timeRange: "09:00" },
  { id: "2", name: "Gym Workout", frequency: "WEEKLY", idealTime: "EVENING", streak: 5, active: true, timeRange: "18:00", days: ["Mon","Wed","Fri"] },
  { id: "3", name: "Evening Reading", frequency: "DAILY", idealTime: "EVENING", streak: 8, active: true, timeRange: "21:00" },
];

export default function HabitsPage() {
  return (
    <div className="animate-fade-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div className="accent-bar"><h1 className="text-2xl font-bold tracking-tight">Habits</h1></div>
        <button className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "var(--accent-indigo)" }}>+ New Habit</button>
      </div>
      <div className="grid md:grid-cols-3 gap-4 stagger">
        {MOCK_HABITS.map((h) => (
          <div key={h.id} className="glass p-4 card-hover">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">{h.name}</h3>
              {h.streak > 0 && <span className="text-sm">🔥 <span className="tnum font-bold" style={{ color: "var(--accent-amber)" }}>{h.streak}</span></span>}
            </div>
            <div className="flex items-center gap-2 text-xs text-text-tertiary mb-3">
              <span className="px-2 py-0.5 rounded" style={{ background: "var(--bg-hover)" }}>{h.frequency}</span>
              <span className="capitalize">{h.idealTime.toLowerCase()}</span>
              <span className="tnum">{h.timeRange}</span>
            </div>
            {h.days && <p className="text-xs text-text-tertiary mb-3">{h.days.join(", ")}</p>}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-text-secondary">
                <input type="checkbox" defaultChecked={h.active} /> Auto-schedule
              </label>
              <button className="text-xs text-text-tertiary hover:text-text-primary">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
