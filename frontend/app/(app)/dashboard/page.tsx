"use client";

import { useState, useEffect } from "react";

interface Widget {
  id: string;
  title: string;
  value: string;
  label: string;
  color: string;
  icon: string;
}

const DEFAULT_WIDGETS: Widget[] = [
  { id: "users", title: "Total Users", value: "1,200", label: "+12% this week", color: "var(--accent-amber)", icon: "👥" },
  { id: "revenue", title: "Revenue", value: "$5,430", label: "+8% this month", color: "var(--accent-indigo)", icon: "📈" },
  { id: "tasks", title: "Active Tasks", value: "24", label: "6 due today", color: "var(--accent-green)", icon: "✓" },
];

export default function DashboardPage() {
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
  const [manageOpen, setManageOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [date, setDate] = useState("");

  useEffect(() => {
    const now = new Date();
    setDate(now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
  }, []);

  const toggleWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const addWidget = (widget: Widget) => {
    if (!widgets.find((w) => w.id === widget.id)) {
      setWidgets([...widgets, widget]);
    }
  };

  return (
    <div className="animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="accent-bar text-xs text-text-tertiary tnum mb-1">{date}</div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>
        {/* Search bar (neomorphic inset) */}
        <div className="neo-inset-sm flex items-center gap-2 px-3 py-2" style={{ width: 280 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: "var(--text-tertiary)" }}>
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-text-tertiary"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
      </div>

      {/* Main grid: left column (stats + manage) + right column (AI assistant) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — wider */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Stat cards row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {widgets.map((w) => (
              <div key={w.id} className="neo-outset p-4 flex items-center gap-3">
                {/* Inset icon container */}
                <div className="neo-icon-inset flex items-center justify-center shrink-0" style={{ width: 40, height: 40 }}>
                  <span style={{ fontSize: 18 }}>{w.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{w.title}</div>
                  <div className="text-xl font-bold tnum" style={{ color: "var(--text-primary)" }}>{w.value}</div>
                  <div className="text-xs tnum" style={{ color: w.color }}>{w.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Manage card */}
          <div className="neo-outset p-6 flex flex-col gap-4" style={{ minHeight: 320 }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Manage</h2>
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Customize your dashboard widgets</p>
              </div>
              {/* Manage button — coral pill */}
              <button
                onClick={() => setManageOpen(!manageOpen)}
                className="neo-pill px-5 py-2 text-sm font-semibold transition-all"
                style={{
                  background: "var(--accent-rose)",
                  color: "#fff",
                }}
              >
                Manage
              </button>
            </div>

            {/* Widget management panel (toggles on when Manage clicked) */}
            {manageOpen ? (
              <div className="flex flex-col gap-3 mt-2">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                  Active Widgets
                </p>
                {DEFAULT_WIDGETS.map((w) => {
                  const active = widgets.find((x) => x.id === w.id);
                  return (
                    <div key={w.id} className="neo-inset-sm flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span style={{ fontSize: 16 }}>{w.icon}</span>
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{w.title}</span>
                      </div>
                      <button
                        onClick={() => (active ? toggleWidget(w.id) : addWidget(w))}
                        className={`neo-toggle ${active ? "active" : ""}`}
                        aria-label={`Toggle ${w.title}`}
                      >
                        <div className="neo-toggle-knob" />
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={() => setWidgets(DEFAULT_WIDGETS)}
                  className="neo-pill px-4 py-2 text-sm font-medium self-start mt-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Reset to defaults
                </button>
              </div>
            ) : (
              /* Widget preview grid when not managing */
              <div className="grid grid-cols-2 gap-3 mt-2">
                {widgets.map((w) => (
                  <div key={w.id} className="neo-inset-sm p-4 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 14 }}>{w.icon}</span>
                      <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{w.title}</span>
                    </div>
                    <div className="text-lg font-bold tnum" style={{ color: "var(--text-primary)" }}>{w.value}</div>
                    <div className="text-xs tnum" style={{ color: w.color }}>{w.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column — AI Assistant card */}
        <div className="lg:col-span-1">
          <div className="neo-outset p-6 flex flex-col gap-4 h-full" style={{ minHeight: 420 }}>
            {/* Robot icon */}
            <div className="flex justify-center mb-2">
              <div className="neo-icon-inset flex items-center justify-center" style={{ width: 64, height: 64 }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ color: "var(--accent-indigo)" }}>
                  <rect x="8" y="10" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
                  <circle cx="13" cy="16" r="1.5" fill="currentColor" />
                  <circle cx="19" cy="16" r="1.5" fill="currentColor" />
                  <path d="M16 10V6M16 6C16 4.5 17 4 18 4M16 6C16 4.5 15 4 14 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 24V26M20 24V26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <h2 className="text-lg font-bold text-center" style={{ color: "var(--text-primary)" }}>AI Assistant</h2>
            <p className="text-sm text-center" style={{ color: "var(--text-tertiary)" }}>
              Your intelligent helper for tasks, scheduling, and insights.
            </p>

            {/* Toggle rows */}
            <div className="flex flex-col gap-3 mt-2">
              <div className="neo-inset-sm flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: "var(--text-tertiary)" }}>
                    <path d="M8 3C5 3 3 5 3 8C3 9 3.5 10 4 10.5L4 13H12V10.5C12.5 10 13 9 13 8C13 5 11 3 8 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M6 13C6 14 7 15 8 15C9 15 10 14 10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Dark Mode</span>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`neo-toggle ${darkMode ? "active" : ""}`}
                  aria-label="Toggle dark mode"
                >
                  <div className="neo-toggle-knob" />
                </button>
              </div>

              <div className="neo-inset-sm flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: "var(--text-tertiary)" }}>
                    <path d="M8 2C5.5 2 4 4 4 6.5V9L3 11H13L12 9V6.5C12 4 10.5 2 8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M6 11C6 12 7 13 8 13C9 13 10 12 10 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Notifications</span>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`neo-toggle ${notifications ? "active" : ""}`}
                  aria-label="Toggle notifications"
                >
                  <div className="neo-toggle-knob" />
                </button>
              </div>
            </div>

            {/* AI Assistant button — blue pill, full width */}
            <button
              className="neo-pill w-full py-3 text-sm font-semibold mt-auto"
              style={{
                background: "var(--accent-indigo)",
                color: "#fff",
              }}
            >
              AI Assistant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
