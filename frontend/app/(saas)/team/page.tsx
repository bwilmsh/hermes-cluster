"use client";

import { useState } from "react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: "online" | "away" | "offline";
  tasksCompleted: number;
  activeTasks: number;
  productivity: number;
}

const DEMO_TEAM: TeamMember[] = [
  { id: "tm1", name: "Benji", role: "Founder", avatar: "🧑", status: "online", tasksCompleted: 48, activeTasks: 5, productivity: 94 },
  { id: "tm2", name: "Scout", role: "Research Agent", avatar: "🔍", status: "online", tasksCompleted: 127, activeTasks: 3, productivity: 98 },
  { id: "tm3", name: "Scribe", role: "Writing Agent", avatar: "✍", status: "away", tasksCompleted: 83, activeTasks: 2, productivity: 91 },
  { id: "tm4", name: "Reach", role: "Marketing Agent", avatar: "📣", status: "away", tasksCompleted: 45, activeTasks: 4, productivity: 85 },
  { id: "tm5", name: "Dev", role: "Engineering Agent", avatar: "⚙", status: "online", tasksCompleted: 162, activeTasks: 6, productivity: 96 },
];

function statusStyle(s: string) {
  switch (s) {
    case "online": return { color: "#22C55E", label: "Online" };
    case "away": return { color: "#F59E0B", label: "Away" };
    case "offline": return { color: "var(--text-tertiary)", label: "Offline" };
    default: return { color: "var(--text-tertiary)", label: "—" };
  }
}

function avatarColor(name: string) {
  const colors = ["#4866FD", "#22C55E", "#F59E0B", "#F43F5E", "#8B5CF6", "#06B6D4"];
  return colors[name.charCodeAt(0) % colors.length];
}

export default function TeamPage() {
  const [team] = useState<TeamMember[]>(DEMO_TEAM);

  const onlineCount = team.filter((m) => m.status === "online").length;
  const avgProductivity = Math.round(team.reduce((a, m) => a + m.productivity, 0) / team.length);
  const totalTasks = team.reduce((a, m) => a + m.tasksCompleted, 0);

  const stats = [
    { label: "Members", value: team.length, color: "var(--accent)" },
    { label: "Online Now", value: onlineCount, color: "#22C55E" },
    { label: "Avg Productivity", value: `${avgProductivity}%`, color: "var(--accent-indigo)" },
    { label: "Tasks Done", value: totalTasks, color: "var(--text-primary)" },
  ];

  return (
    <div className="animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Team</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Your agents and collaborators
          </p>
        </div>
        <button className="saas-btn-primary px-4 py-2 text-sm flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Invite Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="saas-card p-3">
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{s.label}</div>
            <div className="tnum text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Member cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map((m) => {
          const ss = statusStyle(m.status);
          return (
            <div key={m.id} className="saas-card p-5 space-y-4">
              {/* Top: avatar + name + status */}
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div
                    className="saas-avatar"
                    style={{ background: avatarColor(m.name), width: 44, height: 44, fontSize: 18 }}
                  >
                    {m.avatar}
                  </div>
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full"
                    style={{
                      background: ss.color,
                      border: "2px solid var(--bg-secondary)",
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{m.name}</div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{m.role}</div>
                </div>
                <span className="saas-pill" style={{ background: `${ss.color}1A`, color: ss.color }}>
                  {ss.label}
                </span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="tnum text-lg font-bold" style={{ color: "#22C55E" }}>{m.tasksCompleted}</div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Done</div>
                </div>
                <div className="text-center">
                  <div className="tnum text-lg font-bold" style={{ color: "var(--accent)" }}>{m.activeTasks}</div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Active</div>
                </div>
                <div className="text-center">
                  <div className="tnum text-lg font-bold" style={{ color: "var(--accent-indigo)" }}>{m.productivity}%</div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Score</div>
                </div>
              </div>

              {/* Productivity bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span style={{ color: "var(--text-tertiary)" }}>Productivity</span>
                  <span className="tnum font-medium" style={{ color: ss.color }}>{m.productivity}%</span>
                </div>
                <div className="saas-progress">
                  <div
                    className="saas-progress-fill"
                    style={{ width: `${m.productivity}%`, background: ss.color }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
