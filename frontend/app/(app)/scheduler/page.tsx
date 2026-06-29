"use client";

import { useState } from "react";

type ViewMode = "day" | "week" | "month" | "list" | "kanban";

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
          {(["day", "week", "month", "list", "kanban"] as ViewMode[]).map((v) => (
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

      {view === "week" && <WeekView events={MOCK} today={today} />}
      {view === "day" && <DayView events={MOCK.filter((e) => e.day === today)} />}
      {view === "month" && <MonthView events={MOCK} />}
      {view === "list" && <ListView events={MOCK} />}
      {view === "kanban" && <KanbanView events={MOCK} />}
    </div>
  );
}

function WeekView({ events, today }: { events: SchedEvent[]; today: string }) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {DAYS.map((day) => {
        const isToday = day === today;
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

function ListView({ events }: { events: SchedEvent[] }) {
  return (
    <div className="glass p-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-text-tertiary border-b" style={{ borderColor: "var(--border)" }}>
            <th className="py-2 font-medium">Time</th>
            <th className="py-2 font-medium">Title</th>
            <th className="py-2 font-medium">Type</th>
            <th className="py-2 font-medium">Priority</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => (
            <tr key={ev.id} className="border-b hover:bg-bg-hover transition-colors" style={{ borderColor: "var(--border)" }}>
              <td className="py-2 tnum text-text-secondary">{ev.startTime}</td>
              <td className="py-2">{ev.title}</td>
              <td className="py-2 capitalize">{ev.itemType.toLowerCase()}</td>
              <td className="py-2 capitalize">{ev.priority.toLowerCase()}</td>
              <td className="py-2 capitalize">{ev.status.toLowerCase().replace("_", "-")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KanbanView({ events }: { events: SchedEvent[] }) {
  const columns = [
    { id: "TODO", title: "To Do", color: "var(--text-tertiary)" },
    { id: "IN_PROGRESS", title: "In Progress", color: "var(--accent-amber)" },
    { id: "DONE", title: "Done", color: "var(--accent-green)" },
  ];
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {columns.map((col) => {
        const colEvents = events.filter((e) => e.status === col.id);
        return (
          <div key={col.id} className="glass p-3">
            <div className="flex items-center gap-2 mb-3">
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />
              <h3 className="text-sm font-medium">{col.title}</h3>
              <span className="text-xs text-text-tertiary tnum">{colEvents.length}</span>
            </div>
            <div className="space-y-2">
              {colEvents.map((ev) => (
                <div key={ev.id} className="p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity" style={{ background: "var(--bg-hover)", borderLeft: `3px solid ${TYPE_COLORS[ev.itemType]}` }}>
                  <div className="text-sm font-medium mb-1">{ev.title}</div>
                  <div className="flex items-center gap-2 text-xs text-text-tertiary">
                    <span className="tnum">{ev.startTime}</span>
                    {ev.tags?.map((t) => <span key={t} className="px-1.5 py-0.5 rounded" style={{ background: "var(--bg-tertiary)" }}>{t}</span>)}
                  </div>
                </div>
              ))}
              {colEvents.length === 0 && <p className="text-xs text-text-tertiary text-center py-4">No items</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
