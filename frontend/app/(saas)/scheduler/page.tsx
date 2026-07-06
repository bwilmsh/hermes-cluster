"use client";

import { useState } from "react";

type ViewMode = "day" | "week" | "month";

interface SchedEvent {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  itemType: "EVENT" | "TASK" | "APPOINTMENT" | "HABIT";
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  day?: string;
  tags?: string[];
}

const MOCK: SchedEvent[] = [
  { id: "1", title: "Team Standup", startTime: "09:00", endTime: "09:15", itemType: "EVENT", status: "TODO", priority: "MEDIUM", day: "Mon", tags: ["work"] },
  { id: "2", title: "Ship scheduler", startTime: "09:30", endTime: "12:00", itemType: "TASK", status: "TODO", priority: "HIGH", day: "Mon", tags: ["dev"] },
  { id: "3", title: "Client Review", startTime: "12:00", endTime: "13:00", itemType: "APPOINTMENT", status: "TODO", priority: "HIGH", day: "Mon", tags: ["client"] },
  { id: "4", title: "Lunch w/Alex", startTime: "13:30", endTime: "14:30", itemType: "EVENT", status: "TODO", priority: "LOW", day: "Mon", tags: ["social"] },
  { id: "5", title: "Morning Run", startTime: "06:00", endTime: "06:30", itemType: "HABIT", status: "DONE", priority: "MEDIUM", day: "Mon", tags: ["health"] },
  { id: "6", title: "1:1 Manager", startTime: "10:00", endTime: "10:30", itemType: "EVENT", status: "TODO", priority: "MEDIUM", day: "Tue", tags: ["work"] },
  { id: "7", title: "Product Demo", startTime: "15:00", endTime: "16:00", itemType: "APPOINTMENT", status: "TODO", priority: "HIGH", day: "Wed", tags: ["client"] },
  { id: "8", title: "Sprint Review", startTime: "09:00", endTime: "10:00", itemType: "EVENT", status: "TODO", priority: "MEDIUM", day: "Thu", tags: ["work"] },
  { id: "9", title: "Retro", startTime: "16:00", endTime: "17:00", itemType: "EVENT", status: "TODO", priority: "LOW", day: "Fri", tags: ["team"] },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TYPE_COLORS: Record<string, string> = {
  EVENT: "var(--accent-indigo)",
  TASK: "var(--accent-teal)",
  APPOINTMENT: "var(--accent-amber)",
  HABIT: "var(--accent-green)",
};

export default function SchedulerPage() {
  const [view, setView] = useState<ViewMode>("week");
  const today = new Date().toLocaleDateString("en-US", { weekday: "short" });

  return (
    <div className="animate-fade-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div className="accent-bar">
          <h1 className="text-2xl font-bold tracking-tight">Scheduler</h1>
        </div>
        {/* View switcher */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
          {(["day", "week", "month"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${view === v ? "text-white" : "text-text-secondary hover:text-text-primary"}`}
              style={view === v ? { background: "var(--accent-indigo)" } : {}}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === "week" && <WeekView events={MOCK} />}
      {view === "day" && <DayView events={MOCK.filter((e) => e.day === today)} />}
      {view === "month" && <MonthView events={MOCK} />}
    </div>
  );
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function WeekView({ events }: { events: SchedEvent[] }) {
  const [weekRef, setWeekRef] = useState(() => new Date());
  const weekStart = startOfWeek(weekRef);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const now = new Date();

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
    <div>
      {/* Week header with date + nav */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            {weekLabel}
          </h2>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Week of {weekStart.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={goToPrevWeek} className="px-3 py-1 rounded text-sm" style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
            ← Prev
          </button>
          <button onClick={goToThisWeek} className="px-3 py-1 rounded text-sm" style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
            Today
          </button>
          <button onClick={goToNextWeek} className="px-3 py-1 rounded text-sm" style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
            Next →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((day, i) => {
          const dayDate = new Date(weekStart);
          dayDate.setDate(weekStart.getDate() + i);
          const isToday = dayDate.toDateString() === now.toDateString();
          const dayEvents = events.filter((e) => e.day === day);
          return (
            <div
              key={day}
              className={`min-h-[200px] glass p-2 ${isToday ? "ring-1" : ""}`}
              style={isToday ? { boxShadow: "0 0 0 1px var(--glow-indigo), 0 0 20px var(--glow-indigo)" } : {}}
            >
              <div className="flex items-center gap-2 mb-2">
                {isToday && <div style={{ width: 3, height: 16, background: "var(--accent-teal)", borderRadius: 2 }} />}
                <span className={`text-xs font-medium ${isToday ? "text-text-primary" : "text-text-tertiary"}`}>{day}</span>
                <span className={`text-xs tnum ${isToday ? "text-text-primary font-semibold" : "text-text-tertiary"}`}>
                  {dayDate.getDate()}
                </span>
              </div>
              <div className="space-y-1">
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="px-2 py-1.5 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      background: "var(--bg-hover)",
                      borderLeft: `2px solid ${TYPE_COLORS[ev.itemType]}`,
                    }}
                  >
                    <div className="tnum text-text-tertiary">{ev.startTime}</div>
                    <div className="font-medium truncate">{ev.title}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({ events }: { events: SchedEvent[] }) {
  return (
    <div className="glass p-4">
      <div className="space-y-1">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="flex items-center gap-4 px-3 py-3 rounded-md hover:bg-bg-hover transition-colors"
            style={{ borderLeft: `3px solid ${TYPE_COLORS[ev.itemType]}` }}
          >
            <span className="tnum text-sm w-20 shrink-0" style={{ color: "var(--text-secondary)" }}>
              {ev.startTime} — {ev.endTime ?? ""}
            </span>
            <span className="text-sm font-medium flex-1">{ev.title}</span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--bg-hover)", color: "var(--text-tertiary)" }}>
              {ev.itemType.toLowerCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthView({ events }: { events: SchedEvent[] }) {
  return (
    <div className="glass p-4">
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((d) => (
          <div key={d} className="text-xs text-text-tertiary text-center py-2 font-medium">{d}</div>
        ))}
        {Array.from({ length: 35 }).map((_, i) => {
          const dayNum = i - 0 + 1;
          const dayEvents = events.filter((e) => e.day === DAYS[i % 7]);
          return (
            <div key={i} className="min-h-[80px] p-1.5 rounded border" style={{ borderColor: "var(--border)" }}>
              <div className="text-xs text-text-tertiary mb-1">{dayNum <= 30 ? dayNum : ""}</div>
              {dayEvents.slice(0, 2).map((ev) => (
                <div key={ev.id} className="text-xs truncate px-1 py-0.5 rounded mb-0.5" style={{ background: "var(--bg-hover)", borderLeft: `2px solid ${TYPE_COLORS[ev.itemType]}` }}>
                  {ev.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}


