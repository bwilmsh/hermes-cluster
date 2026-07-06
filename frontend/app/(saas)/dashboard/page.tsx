"use client";

import { useState, useEffect } from "react";

/* ── Icons (line-art, 24x24) ── */
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const icons: Record<string, React.ReactNode> = {
    dashboard: <path d="M3 3H10V10H3V3ZM14 3H21V8H14V3ZM14 12H21V21H14V12ZM3 14H10V21H3V14Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />,
    projects: <path d="M4 6H20M4 12H20M4 18H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />,
    calendar: <path d="M4 5H20V21H4V5ZM4 9H20M8 3V7M16 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
    tasks: <path d="M5 5H19V19H5V5ZM8 9L10 11L14 7M8 15L10 17L14 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
    team: <path d="M9 11C11.2 11 13 9.2 13 7C13 4.8 11.2 3 9 3C6.8 3 5 4.8 5 7C5 9.2 6.8 11 9 11ZM3 21C3 17 5.5 14 9 14C12.5 14 15 17 15 21M16 7C16 8.5 17 9.5 18.5 9.5C20 9.5 21 8.5 21 7C21 5.5 20 4.5 18.5 4.5C17 4.5 16 5.5 16 7ZM16 14C18.5 14.5 21 17 21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
    analytics: <path d="M4 20V10M9 20V4M14 20V14M19 20V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />,
    settings: <path d="M12 15C13.6 15 15 13.6 15 12C15 10.4 13.6 9 12 9C10.4 9 9 10.4 9 12C9 13.6 10.4 15 12 15ZM12 1V3M12 21V23M4.2 4.2L5.6 5.6M18.4 18.4L19.8 19.8M1 12H3M21 12H23M4.2 19.8L5.6 18.4M18.4 5.6L19.8 4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />,
    help: <path d="M12 21C16.9 21 21 16.9 21 12C21 7.1 16.9 3 12 3C7.1 3 3 7.1 3 12C3 16.9 7.1 21 12 21ZM9.5 9C9.5 7.5 10.5 6.5 12 6.5C13.5 6.5 14.5 7.5 14.5 9C14.5 10.5 12 11 12 13M12 17V17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />,
    search: <path d="M11 19C15.4 19 19 15.4 19 11C19 6.6 15.4 3 11 3C6.6 3 3 6.6 3 11C3 15.4 6.6 19 11 19ZM21 21L16.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
    bell: <path d="M12 3C8.5 3 6 5.5 6 9V12L4 15H20L18 12V9C18 5.5 15.5 3 12 3ZM9 17C9 18.5 10 19.5 12 19.5C14 19.5 15 18.5 15 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
    message: <path d="M4 5H20V15H12L8 19V15H4V5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
    plus: <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
    arrowUp: <path d="M12 19V5M5 12L12 5L19 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
    arrowDown: <path d="M12 5V19M5 12L12 19L19 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
    video: <path d="M3 6H15V18H3V6ZM15 10L21 6V18L15 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
    milestone: <path d="M12 2L14 8H20L15 12L17 18L12 14L7 18L9 12L4 8H10L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {icons[name] || null}
    </svg>
  );
}

/* ── Stat cards data ── */
interface Stat {
  id: string;
  label: string;
  value: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  trend: "up" | "down";
  trendValue: string;
  trendLabel: string;
}

const STATS: Stat[] = [
  { id: "projects", label: "Active Projects", value: "12", icon: "projects", iconBg: "#FFF1EC", iconColor: "#FF6B35", trend: "up", trendValue: "+2", trendLabel: "this week" },
  { id: "tasks", label: "Completed Tasks", value: "248", icon: "tasks", iconBg: "#E8F5E9", iconColor: "#22C55E", trend: "up", trendValue: "+18%", trendLabel: "this month" },
  { id: "deadlines", label: "Upcoming Deadlines", value: "7", icon: "calendar", iconBg: "#FFF8E1", iconColor: "#F59E0B", trend: "down", trendValue: "-3", trendLabel: "vs last week" },
  { id: "team", label: "Team Performance", value: "94%", icon: "analytics", iconBg: "#E3F2FD", iconColor: "#3B82F6", trend: "up", trendValue: "+5%", trendLabel: "this sprint" },
];

function StatCard({ stat }: { stat: Stat }) {
  return (
    <div className="saas-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div
          className="flex items-center justify-center"
          style={{ width: 36, height: 36, borderRadius: 10, background: stat.iconBg }}
        >
          <span style={{ color: stat.iconColor }}>
            <Icon name={stat.icon} size={18} />
          </span>
        </div>
        <span
          className="saas-trend"
          style={{
            background: stat.trend === "up" ? "#E8F5E9" : "#FFEBEE",
            color: stat.trend === "up" ? "#22C55E" : "#F43F5E",
          }}
        >
          {stat.trend === "up" ? "↑" : "↓"} {stat.trendValue}
        </span>
      </div>
      <div>
        <div className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{stat.label}</div>
        <div className="text-2xl font-bold tnum" style={{ color: "var(--text-primary)" }}>{stat.value}</div>
      </div>
      <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{stat.trendLabel}</div>
    </div>
  );
}

/* ── Donut Chart ── */
function DonutChart() {
  const segments = [
    { label: "Completed", value: 65, color: "#22C55E" },
    { label: "In Progress", value: 20, color: "#FF6B35" },
    { label: "Pending", value: 10, color: "#F59E0B" },
    { label: "Blocked", value: 5, color: "#F43F5E" },
  ];
  const total = segments.reduce((s, x) => s + x.value, 0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="saas-card-lg p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Analytics Overview</h3>
        <button className="saas-btn px-3 py-1 text-xs">This Month</button>
      </div>
      <div className="flex items-center gap-6">
        {/* SVG Donut */}
        <div style={{ position: "relative", width: 160, height: 160 }}>
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--bg-tertiary)" strokeWidth="16" />
            {segments.map((seg, i) => {
              const len = (seg.value / total) * circumference;
              const circle = (
                <circle
                  key={i}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="16"
                  strokeDasharray={`${len} ${circumference - len}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                  transform="rotate(-90 80 80)"
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              );
              offset += len;
              return circle;
            })}
          </svg>
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
            }}
          >
            <div className="text-2xl font-bold tnum" style={{ color: "var(--text-primary)" }}>65%</div>
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Completion</div>
          </div>
        </div>
        {/* Legend */}
        <div className="flex flex-col gap-2 flex-1">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span style={{ width: 10, height: 10, borderRadius: 3, background: seg.color }} />
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{seg.label}</span>
              </div>
              <span className="text-sm font-semibold tnum" style={{ color: "var(--text-primary)" }}>{seg.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Project Status Panel ── */
interface Project {
  id: string;
  title: string;
  subtitle: string;
  status: "On Track" | "At Risk" | "Delayed" | "Completed";
  statusColor: string;
  statusBg: string;
  progress: number;
  avatar: string;
  avatarColor: string;
}

const PROJECTS: Project[] = [
  { id: "p1", title: "Mobile App Redesign", subtitle: "8 tasks · 3 members", status: "On Track", statusColor: "#22C55E", statusBg: "#E8F5E9", progress: 72, avatar: "JD", avatarColor: "#FF6B35" },
  { id: "p2", title: "API Migration", subtitle: "12 tasks · 4 members", status: "At Risk", statusColor: "#F59E0B", statusBg: "#FFF8E1", progress: 45, avatar: "MK", avatarColor: "#8B5CF6" },
  { id: "p3", title: "Marketing Website", subtitle: "5 tasks · 2 members", status: "On Track", statusColor: "#22C55E", statusBg: "#E8F5E9", progress: 88, avatar: "AS", avatarColor: "#3B82F6" },
  { id: "p4", title: "Q3 Roadmap Planning", subtitle: "3 tasks · 6 members", status: "Delayed", statusColor: "#F43F5E", statusBg: "#FFEBEE", progress: 30, avatar: "RB", avatarColor: "#22C55E" },
  { id: "p5", title: "Customer Onboarding", subtitle: "7 tasks · 3 members", status: "Completed", statusColor: "#3B82F6", statusBg: "#E3F2FD", progress: 100, avatar: "TL", avatarColor: "#F59E0B" },
];

function ProjectStatusPanel() {
  return (
    <div className="saas-card-lg p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Project Status</h3>
        <button className="saas-btn px-3 py-1 text-xs">View All</button>
      </div>
      <div className="flex flex-col gap-1">
        {PROJECTS.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-bg-hover transition-colors"
            style={{ borderRadius: "var(--radius-xs)" }}
          >
            {/* Avatar */}
            <div className="saas-avatar" style={{ background: p.avatarColor }}>{p.avatar}</div>
            {/* Title + subtitle */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{p.title}</div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{p.subtitle}</div>
            </div>
            {/* Status pill */}
            <span
              className="saas-pill"
              style={{ color: p.statusColor, background: p.statusBg }}
            >
              {p.status}
            </span>
            {/* Progress */}
            <div style={{ width: 80 }}>
              <div className="saas-progress">
                <div
                  className="saas-progress-fill"
                  style={{ width: `${p.progress}%`, background: p.statusColor }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Weekly Timeline ── */
interface TimelineTask {
  id: string;
  title: string;
  day: number; // 0-6 (Mon-Sun)
  color: string;
  bg: string;
  members: string[];
}

const TIMELINE_TASKS: TimelineTask[] = [
  { id: "t1", title: "Design Review", day: 0, color: "#FF6B35", bg: "#FFF1EC", members: ["JD", "MK"] },
  { id: "t2", title: "Sprint Planning", day: 0, color: "#8B5CF6", bg: "#F3E8FF", members: ["AS", "RB", "TL"] },
  { id: "t3", title: "API Testing", day: 1, color: "#3B82F6", bg: "#E3F2FD", members: ["MK"] },
  { id: "t4", title: "Client Demo", day: 2, color: "#22C55E", bg: "#E8F5E9", members: ["JD", "AS"] },
  { id: "t5", title: "Code Review", day: 3, color: "#F59E0B", bg: "#FFF8E1", members: ["RB", "TL"] },
  { id: "t6", title: "Deploy v2.1", day: 4, color: "#FF6B35", bg: "#FFF1EC", members: ["MK", "JD"] },
  { id: "t7", title: "Retro Meeting", day: 4, color: "#8B5CF6", bg: "#F3E8FF", members: ["AS", "RB", "TL", "JD"] },
  { id: "t8", title: "Team Lunch", day: 5, color: "#22C55E", bg: "#E8F5E9", members: ["All"] },
];

function WeeklyTimeline() {
  const [weekRef, setWeekRef] = useState(() => new Date());
  const now = new Date();

  const startOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const weekStart = startOfWeek(weekRef);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayIdx = days.findIndex((d) => d.toDateString() === now.toDateString());

  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const sameYear = weekStart.getFullYear() === weekEnd.getFullYear();
  const weekLabel = sameMonth && sameYear
    ? `${weekStart.toLocaleString("en-US", { month: "long", day: "numeric" })} – ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`
    : sameYear
      ? `${weekStart.toLocaleString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleString("en-US", { month: "short", day: "numeric" })}, ${weekEnd.getFullYear()}`
      : `${weekStart.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${weekEnd.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const goToPrevWeek = () => {
    const d = new Date(weekRef);
    d.setDate(d.getDate() - 7);
    setWeekRef(d);
  };
  const goToNextWeek = () => {
    const d = new Date(weekRef);
    d.setDate(d.getDate() + 7);
    setWeekRef(d);
  };
  const goToThisWeek = () => setWeekRef(new Date());

  return (
    <div className="saas-card-lg p-6 flex flex-col gap-4">
      {/* Header with week nav */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Weekly Timeline</h3>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{weekLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToPrevWeek} className="saas-btn px-2 py-1 text-xs">←</button>
          <button onClick={goToThisWeek} className="saas-btn px-3 py-1 text-xs">Today</button>
          <button onClick={goToNextWeek} className="saas-btn px-2 py-1 text-xs">→</button>
        </div>
      </div>

      {/* Timeline grid */}
      <div className="grid grid-cols-7" style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-xs)", overflow: "hidden" }}>
        {/* Day headers */}
        {days.map((day, i) => {
          const isToday = i === todayIdx;
          return (
            <div
              key={i}
              className={`flex flex-col items-center py-3 ${isToday ? "saas-timeline-today-header" : ""}`}
              style={{
                borderRight: i < 6 ? "1px solid var(--border)" : "none",
                background: isToday ? "var(--accent-light)" : "var(--bg-secondary)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span className="text-xs font-medium" style={{ color: isToday ? "var(--accent)" : "var(--text-tertiary)" }}>
                {dayNames[i]}
              </span>
              <span className="text-lg font-bold tnum" style={{ color: isToday ? "var(--accent)" : "var(--text-primary)" }}>
                {day.getDate()}
              </span>
            </div>
          );
        })}
        {/* Task blocks */}
        {days.map((day, i) => {
          const isToday = i === todayIdx;
          const dayTasks = TIMELINE_TASKS.filter((t) => t.day === i);
          return (
            <div
              key={i}
              className={`saas-timeline-day ${isToday ? "saas-timeline-today" : ""}`}
              style={{ padding: "8px 6px", background: isToday ? "var(--accent-light)" : "var(--bg-secondary)" }}
            >
              {dayTasks.map((task) => (
                <div
                  key={task.id}
                  className="saas-task-block"
                  style={{ background: task.bg, color: task.color, borderLeft: `3px solid ${task.color}` }}
                >
                  <div className="font-medium truncate">{task.title}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {task.members.slice(0, 3).map((m, mi) => (
                      <div
                        key={mi}
                        className="saas-avatar"
                        style={{
                          width: 18,
                          height: 18,
                          fontSize: 8,
                          background: ["#FF6B35", "#8B5CF6", "#3B82F6", "#22C55E"][mi % 4],
                          marginLeft: mi > 0 ? -6 : 0,
                        }}
                      >
                        {m.slice(0, 1)}
                      </div>
                    ))}
                    {task.members.length > 3 && (
                      <span className="text-xs ml-1" style={{ color: "var(--text-tertiary)" }}>
                        +{task.members.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {dayTasks.length === 0 && (
                <div className="text-xs text-center py-4" style={{ color: "var(--text-tertiary)" }}>—</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Meetings Panel ── */
interface Meeting {
  id: string;
  title: string;
  platform: string;
  platformColor: string;
  time: string;
  participants: string[];
  participantColors: string[];
}

const MEETINGS: Meeting[] = [
  { id: "m1", title: "Daily Standup", platform: "Zoom", platformColor: "#3B82F6", time: "09:00 AM", participants: ["JD", "MK", "AS"], participantColors: ["#FF6B35", "#8B5CF6", "#3B82F6"] },
  { id: "m2", title: "Client Review", platform: "Meet", platformColor: "#22C55E", time: "11:30 AM", participants: ["RB", "TL"], participantColors: ["#22C55E", "#F59E0B"] },
  { id: "m3", title: "Design Sync", platform: "Teams", platformColor: "#8B5CF6", time: "02:00 PM", participants: ["JD", "AS", "TL", "MK"], participantColors: ["#FF6B35", "#3B82F6", "#F59E0B", "#8B5CF6"] },
  { id: "m4", title: "Sprint Retro", platform: "Zoom", platformColor: "#3B82F6", time: "04:30 PM", participants: ["All"], participantColors: ["#FF6B35"] },
];

function MeetingsPanel() {
  return (
    <div className="saas-card-lg p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Meetings</h3>
        <button className="saas-btn px-3 py-1 text-xs">Today</button>
      </div>
      <div className="flex flex-col gap-3">
        {MEETINGS.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-hover transition-colors"
            style={{ background: "var(--bg-tertiary)", borderRadius: "var(--radius-xs)" }}
          >
            {/* Time */}
            <div className="flex flex-col items-center shrink-0" style={{ width: 56 }}>
              <span className="text-xs font-bold tnum" style={{ color: "var(--text-primary)" }}>{m.time.split(" ")[0]}</span>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{m.time.split(" ")[1]}</span>
            </div>
            {/* Divider */}
            <div style={{ width: 1, height: 32, background: "var(--border)" }} />
            {/* Meeting info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{m.title}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <span style={{ color: m.platformColor }}>
                  <Icon name="video" size={12} />
                </span>
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{m.platform}</span>
              </div>
            </div>
            {/* Participants */}
            <div className="flex items-center">
              {m.participants.slice(0, 3).map((p, i) => (
                <div
                  key={i}
                  className="saas-avatar"
                  style={{
                    width: 22,
                    height: 22,
                    fontSize: 9,
                    background: m.participantColors[i % m.participantColors.length],
                    marginLeft: i > 0 ? -6 : 0,
                  }}
                >
                  {p.slice(0, 1)}
                </div>
              ))}
              {m.participants.length > 3 && (
                <div
                  className="saas-avatar"
                  style={{
                    width: 22,
                    height: 22,
                    fontSize: 9,
                    background: "var(--bg-hover)",
                    color: "var(--text-tertiary)",
                    marginLeft: -6,
                  }}
                >
                  +{m.participants.length - 3}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Dashboard Page ── */
export default function DashboardPage() {
  const [date, setDate] = useState("");

  useEffect(() => {
    const now = new Date();
    setDate(now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
  }, []);

  return (
    <div className="flex flex-col gap-6 animate-fade-slide-up">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Dashboard
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>{date}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="saas-btn px-4 py-2 text-sm">Export</button>
          <button className="saas-btn px-4 py-2 text-sm">Filter</button>
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <StatCard key={s.id} stat={s} />
        ))}
      </div>

      {/* Main grid: timeline (2 cols) + right column (analytics + meetings) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — timeline + projects */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <WeeklyTimeline />
          <ProjectStatusPanel />
        </div>

        {/* Right — analytics + meetings */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <DonutChart />
          <MeetingsPanel />
        </div>
      </div>
    </div>
  );
}
