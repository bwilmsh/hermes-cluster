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
  { id: "tm1", name: "Benji", role: "Founder", avatar: "🧑‍💻", status: "online", tasksCompleted: 48, activeTasks: 5, productivity: 94 },
  { id: "tm2", name: "Scout", role: "Research Agent", avatar: "🔍", status: "online", tasksCompleted: 127, activeTasks: 3, productivity: 98 },
  { id: "tm3", name: "Scribe", role: "Writing Agent", avatar: "✍️", status: "away", tasksCompleted: 83, activeTasks: 2, productivity: 91 },
  { id: "tm4", name: "Reach", role: "Marketing Agent", avatar: "📣", status: "away", tasksCompleted: 45, activeTasks: 4, productivity: 85 },
  { id: "tm5", name: "Dev", role: "Engineering Agent", avatar: "⚙️", status: "online", tasksCompleted: 162, activeTasks: 6, productivity: 96 },
];

function statusStyle(s: string) {
  switch (s) {
    case "online": return { color: "#22C55E", label: "Online" };
    case "away": return { color: "#F59E0B", label: "Away" };
    case "offline": return { color: "var(--text-tertiary)", label: "Offline" };
    default: return { color: "var(--text-tertiary)", label: "—" };
  }
}

export default function TeamPage() {
  const [team] = useState<TeamMember[]>(DEMO_TEAM);

  const onlineCount = team.filter((m) => m.status === "online").length;
  const avgProductivity = Math.round(team.reduce((a, m) => a + m.productivity, 0) / team.length);

  return (
    <div className="flex flex-col gap-6 animate-fade-slide-up">
      <div className="flex items-center justify-between">
        <div className="accent-bar text-xl font-semibold">Team</div>
        <span className="tnum text-xs px-3 py-1 rounded-full" style={{ background: "var(--bg-hover)", color: "#22C55E" }}>
          {onlineCount} online
        </span>
      </div>

      {/* Team stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass p-4 text-center">
          <div className="tnum text-2xl font-bold" style={{ color: "var(--accent-teal)" }}>{team.length}</div>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Members</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="tnum text-2xl font-bold" style={{ color: "#22C55E" }}>{avgProductivity}%</div>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Avg Productivity</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="tnum text-2xl font-bold" style={{ color: "var(--accent-indigo)" }}>
            {team.reduce((a, m) => a + m.tasksCompleted, 0)}
          </div>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Tasks Done</div>
        </div>
      </div>

      {/* Member cards */}
      <div className="grid grid-cols-2 gap-4">
        {team.map((m) => {
          const ss = statusStyle(m.status);
          return (
            <div key={m.id} className="glass p-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{m.avatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{m.name}</div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{m.role}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: ss.color }} />
                  <span className="text-xs" style={{ color: ss.color }}>{ss.label}</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span style={{ color: "var(--text-tertiary)" }}>Done:</span>
                  <span className="tnum font-medium" style={{ color: "#22C55E" }}>{m.tasksCompleted}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: "var(--text-tertiary)" }}>Active:</span>
                  <span className="tnum font-medium" style={{ color: "var(--accent-teal)" }}>{m.activeTasks}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span style={{ color: "var(--text-tertiary)" }}>Score:</span>
                  <span className="tnum font-medium" style={{ color: "var(--accent-indigo)" }}>{m.productivity}%</span>
                </div>
              </div>

              {/* Productivity bar */}
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${m.productivity}%`, background: ss.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
