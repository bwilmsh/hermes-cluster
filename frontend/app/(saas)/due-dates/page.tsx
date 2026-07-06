"use client";

import { useState, useEffect } from "react";

/* ── Types ── */
interface DueItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  categoryColor: string;
  categoryBg: string;
  dueAt: number; // timestamp in ms
  priority: "urgent" | "high" | "medium" | "low";
  progress: number; // 0-100
  avatar: string;
  avatarColor: string;
}

/* ── Mock data — due dates with real timestamps ── */
const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

const MOCK_DUE: DueItem[] = [
  { id: "1", title: "Math Problem Set 4", subtitle: "Chapter 7 — Linear Algebra", category: "Assignment", categoryColor: "#FF6B35", categoryBg: "#FFF1EC", dueAt: now - 2 * DAY, priority: "urgent", progress: 60, avatar: "JD", avatarColor: "#FF6B35" },
  { id: "2", title: "Biology Midterm Exam", subtitle: "Units 1-5 — cumulative", category: "Exam", categoryColor: "#F43F5E", categoryBg: "#FFEBEE", dueAt: now + 6 * HOUR, priority: "urgent", progress: 80, avatar: "MK", avatarColor: "#8B5CF6" },
  { id: "3", title: "Q3 Roadmap Document", subtitle: "Draft for leadership review", category: "Work", categoryColor: "#3B82F6", categoryBg: "#E3F2FD", dueAt: now + 1 * DAY + 4 * HOUR, priority: "high", progress: 45, avatar: "AS", avatarColor: "#3B82F6" },
  { id: "4", title: "Mobile App Redesign", subtitle: "Final mockups delivery", category: "Project", categoryColor: "#8B5CF6", categoryBg: "#F3E8FF", dueAt: now + 3 * DAY, priority: "high", progress: 72, avatar: "RB", avatarColor: "#22C55E" },
  { id: "5", title: "Client Proposal", subtitle: "Acme Corp — SOW + timeline", category: "Work", categoryColor: "#3B82F6", categoryBg: "#E3F2FD", dueAt: now + 5 * DAY, priority: "medium", progress: 30, avatar: "TL", avatarColor: "#F59E0B" },
  { id: "6", title: "Research Paper Draft", subtitle: "8 pages — MLA format", category: "Assignment", categoryColor: "#FF6B35", categoryBg: "#FFF1EC", dueAt: now + 7 * DAY, priority: "medium", progress: 15, avatar: "JD", avatarColor: "#FF6B35" },
  { id: "7", title: "Team Retrospective", subtitle: "Sprint 14 — notes prep", category: "Meeting", categoryColor: "#22C55E", categoryBg: "#E8F5E9", dueAt: now + 10 * DAY, priority: "low", progress: 0, avatar: "All", avatarColor: "#3B82F6" },
  { id: "8", title: "Security Audit Report", subtitle: "Q3 compliance review", category: "Project", categoryColor: "#8B5CF6", categoryBg: "#F3E8FF", dueAt: now + 14 * DAY, priority: "low", progress: 10, avatar: "MK", avatarColor: "#8B5CF6" },
];

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  urgent: { color: "#F43F5E", bg: "#FFEBEE", label: "Urgent" },
  high: { color: "#F59E0B", bg: "#FFF8E1", label: "High" },
  medium: { color: "#3B82F6", bg: "#E3F2FD", label: "Medium" },
  low: { color: "#9CA3AF", bg: "#F0F1F4", label: "Low" },
};

/* ── Countdown hook ── */
function useCountdown(targetMs: number) {
  const [remaining, setRemaining] = useState(() => targetMs - Date.now());
  useEffect(() => {
    const id = setInterval(() => setRemaining(targetMs - Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetMs]);
  return remaining;
}

function formatCountdown(ms: number): { text: string; isOverdue: boolean; isToday: boolean } {
  if (ms < 0) {
    const overdue = Math.abs(ms);
    const days = Math.floor(overdue / DAY);
    const hours = Math.floor((overdue % DAY) / HOUR);
    const mins = Math.floor((overdue % HOUR) / (60 * 1000));
    if (days > 0) return { text: `${days}d ${hours}h overdue`, isOverdue: true, isToday: false };
    if (hours > 0) return { text: `${hours}h ${mins}m overdue`, isOverdue: true, isToday: false };
    return { text: `${mins}m overdue`, isOverdue: true, isToday: false };
  }
  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / HOUR);
  const mins = Math.floor((ms % HOUR) / (60 * 1000));
  const secs = Math.floor((ms % (60 * 1000)) / 1000);
  if (days > 0) return { text: `${days}d ${hours}h ${mins}m left`, isOverdue: false, isToday: days === 0 };
  if (hours > 0) return { text: `${hours}h ${mins}m ${secs}s left`, isOverdue: false, isToday: true };
  return { text: `${mins}m ${secs}s left`, isOverdue: false, isToday: true };
}

/* ── Countdown display component ── */
function CountdownDisplay({ dueAt }: { dueAt: number }) {
  const remaining = useCountdown(dueAt);
  const { text, isOverdue, isToday } = formatCountdown(remaining);
  const color = isOverdue ? "#F43F5E" : isToday ? "#FF6B35" : "var(--text-tertiary)";
  return (
    <div className="flex items-center gap-1.5">
      {/* Pulsing dot for urgent/today/overdue */}
      {(isOverdue || isToday) && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
            animation: "pulseGlow 1.5s ease-in-out infinite",
            flexShrink: 0,
          }}
        />
      )}
      <span className="text-xs font-semibold tnum" style={{ color }}>
        {text}
      </span>
    </div>
  );
}

/* ── Due Date Card ── */
function DueDateCard({ item }: { item: DueItem }) {
  const pc = PRIORITY_CONFIG[item.priority];
  return (
    <div className="saas-card p-5 flex flex-col gap-3">
      {/* Top row: category + priority */}
      <div className="flex items-center justify-between">
        <span className="saas-pill" style={{ color: item.categoryColor, background: item.categoryBg }}>
          {item.category}
        </span>
        <span className="saas-pill" style={{ color: pc.color, background: pc.bg }}>
          {pc.label}
        </span>
      </div>

      {/* Title + subtitle */}
      <div>
        <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {item.title}
        </div>
        <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
          {item.subtitle}
        </div>
      </div>

      {/* Countdown timer */}
      <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: "var(--bg-tertiary)", borderRadius: "var(--radius-xs)" }}>
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: "var(--text-tertiary)" }}>
            <path d="M12 8V12L14.5 14.5M12 3C7 3 3 7 3 12C3 17 7 21 12 21C17 21 21 17 21 12C21 7 17 3 12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Due</span>
        </div>
        <CountdownDisplay dueAt={item.dueAt} />
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Progress</span>
          <span className="text-xs font-semibold tnum" style={{ color: "var(--text-primary)" }}>{item.progress}%</span>
        </div>
        <div className="saas-progress">
          <div
            className="saas-progress-fill"
            style={{
              width: `${item.progress}%`,
              background: item.progress === 100 ? "#22C55E" : item.categoryColor,
            }}
          />
        </div>
      </div>

      {/* Bottom row: due date + avatar */}
      <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid var(--border-light)" }}>
        <span className="text-xs tnum" style={{ color: "var(--text-tertiary)" }}>
          {new Date(item.dueAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
        <div className="saas-avatar" style={{ width: 24, height: 24, fontSize: 10, background: item.avatarColor }}>
          {item.avatar.slice(0, 2)}
        </div>
      </div>
    </div>
  );
}

/* ── Summary stat bar ── */
function DueSummary({ items }: { items: DueItem[] }) {
  const overdue = items.filter((i) => i.dueAt < Date.now()).length;
  const today = items.filter((i) => {
    const r = i.dueAt - Date.now();
    return r > 0 && r < DAY;
  }).length;
  const upcoming = items.filter((i) => i.dueAt - Date.now() >= DAY).length;
  const stats = [
    { label: "Overdue", value: overdue, color: "#F43F5E", bg: "#FFEBEE" },
    { label: "Due Today", value: today, color: "#FF6B35", bg: "#FFF1EC" },
    { label: "Upcoming", value: upcoming, color: "#3B82F6", bg: "#E3F2FD" },
    { label: "Total", value: items.length, color: "#8B5CF6", bg: "#F3E8FF" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <div key={i} className="saas-card p-4 flex items-center gap-3">
          <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: s.bg }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: s.color }}>
              <path d="M12 8V12L14.5 14.5M12 3C7 3 3 7 3 12C3 17 7 21 12 21C17 21 21 17 21 12C21 7 17 3 12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{s.label}</div>
            <div className="text-xl font-bold tnum" style={{ color: "var(--text-primary)" }}>{s.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main Page ── */
export default function DueDatesPage() {
  const [filter, setFilter] = useState<"all" | "overdue" | "today" | "upcoming">("all");
  const [date, setDate] = useState("");

  useEffect(() => {
    setDate(new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
  }, []);

  const filtered = MOCK_DUE.filter((i) => {
    const r = i.dueAt - Date.now();
    if (filter === "overdue") return r < 0;
    if (filter === "today") return r > 0 && r < DAY;
    if (filter === "upcoming") return r >= DAY;
    return true;
  }).sort((a, b) => a.dueAt - b.dueAt);

  const filters = [
    { id: "all" as const, label: "All" },
    { id: "overdue" as const, label: "Overdue" },
    { id: "today" as const, label: "Today" },
    { id: "upcoming" as const, label: "Upcoming" },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Due Dates
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {date} — assignments & deadlines with countdown
          </p>
        </div>
        <button className="saas-btn-primary flex items-center gap-1.5 px-4 py-2 text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add Due Date
        </button>
      </div>

      {/* Summary stats */}
      <DueSummary items={MOCK_DUE} />

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="px-4 py-1.5 text-sm font-medium transition-all"
            style={{
              borderRadius: "var(--radius-xs)",
              background: filter === f.id ? "var(--accent)" : "var(--bg-tertiary)",
              color: filter === f.id ? "#fff" : "var(--text-secondary)",
              border: "none",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Due date cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <DueDateCard key={item.id} item={item} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="saas-card-lg p-12 text-center">
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            No due dates in this category. You're all caught up!
          </p>
        </div>
      )}
    </div>
  );
}
