"use client";

export default function AnalyticsPage() {
  const metrics = [
    { label: "Total Projects", value: "12", change: "+2", trend: "up" },
    { label: "Completed Tasks", value: "248", change: "+18%", trend: "up" },
    { label: "Avg Completion Time", value: "3.2d", change: "-0.5d", trend: "up" },
    { label: "Team Velocity", value: "94%", change: "+5%", trend: "up" },
    { label: "Overdue Tasks", value: "7", change: "-3", trend: "up" },
    { label: "Client Satisfaction", value: "4.8/5", change: "+0.2", trend: "up" },
  ];
  return (
    <div className="animate-fade-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Analytics</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Performance insights across all projects</p>
        </div>
        <button className="saas-btn px-4 py-2 text-sm">Export Report</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="saas-card p-5 flex flex-col gap-2">
            <div className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{m.label}</div>
            <div className="text-2xl font-bold tnum" style={{ color: "var(--text-primary)" }}>{m.value}</div>
            <span className="saas-trend" style={{ background: "#E8F5E9", color: "#22C55E", alignSelf: "flex-start" }}>
              ↑ {m.change}
            </span>
          </div>
        ))}
      </div>
      {/* Simple bar chart */}
      <div className="saas-card-lg p-6 mt-6">
        <h3 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Weekly Task Completion</h3>
        <div className="flex items-end gap-4" style={{ height: 200 }}>
          {[
            { day: "Mon", val: 60 },
            { day: "Tue", val: 80 },
            { day: "Wed", val: 45 },
            { day: "Thu", val: 90 },
            { day: "Fri", val: 70 },
            { day: "Sat", val: 30 },
            { day: "Sun", val: 20 },
          ].map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                style={{
                  width: "100%",
                  height: `${d.val}%`,
                  background: "var(--accent)",
                  borderRadius: "var(--radius-xs) var(--radius-xs) 0 0",
                  transition: "height 0.5s ease",
                }}
              />
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{d.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
