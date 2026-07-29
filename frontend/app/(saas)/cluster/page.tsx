"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AskAIInput } from "@/components/AskAIInput";

/* ── Types ── */
interface Msg {
  role: "user" | "assistant";
  content: string;
  route?: string;
  widget?: WidgetData;
  timestamp: Date;
}

interface WidgetData {
  type: "stat" | "schedule" | "task-list" | "agent-grid" | "activity-feed";
  [key: string]: any;
}

interface TodayTask {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  dueTime?: string;
  overdue?: boolean;
}

interface TodayEvent {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  type: "event" | "task" | "appointment" | "habit";
}

/* ── Demo data (replaced by real API when backend wired) ── */
const DEMO_OVERDUE: TodayTask[] = [
  { id: "1", title: "Review PR #142", status: "todo", priority: "urgent", overdue: true },
  { id: "2", title: "Submit expense report", status: "todo", priority: "high", overdue: true },
];

const DEMO_TASKS: TodayTask[] = [
  { id: "3", title: "Ship scheduler feature", status: "in-progress", priority: "high", dueTime: "12:00" },
  { id: "4", title: "Write integration tests", status: "todo", priority: "medium", dueTime: "14:00" },
  { id: "5", title: "Update README", status: "todo", priority: "low", dueTime: "16:00" },
];

const DEMO_EVENTS: TodayEvent[] = [
  { id: "e1", title: "Standup", startTime: "09:00", endTime: "09:15", type: "event" },
  { id: "e2", title: "Client review", startTime: "12:00", endTime: "13:00", type: "appointment" },
  { id: "e3", title: "Meditation", startTime: "07:30", endTime: "07:45", type: "habit" },
  { id: "e4", title: "1:1 with Scout", startTime: "15:00", endTime: "15:30", type: "event" },
];

/* ── Route classifier (mirrors the backend manager-router) ── */
function classifyRoute(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("book") || t.includes("schedule") || t.includes("reserve") || t.includes("calendar")) return "booking";
  if (t.includes("customer") || t.includes("client") || t.includes("memory") || t.includes("remember")) return "customer";
  return "general";
}

/* ── Simulated streaming response (demo — replaced by SSE to backend) ── */
function simulateStream(text: string): { response: string; widget: WidgetData } {
  const route = classifyRoute(text);
  const t = text.toLowerCase();

  if (t.includes("plan") || t.includes("today") || t.includes("schedule") || t.includes("day")) {
    return {
      response: `Here's your optimized day plan:\n\n1. ⚠ Review PR #142 (overdue — 15 min)\n2. 🧘 Meditation 07:30–07:45\n3. 👥 Standup 09:00–09:15\n4. 🚀 Ship scheduler feature 09:30–12:00\n5. 📞 Client review 12:00–13:00\n6. 🧪 Write integration tests 14:00–16:00\n7. ✏️ Update README 16:00–17:00\n8. 👤 1:1 with Scout 15:00–15:30\n\nI've surfaced your 2 overdue items at the top. Want me to create calendar events for any of these?`,
      widget: {
        type: "schedule",
        slots: [
          { time: "07:30", title: "Meditation", type: "habit" },
          { time: "09:00", title: "Standup", type: "event" },
          { time: "09:30", title: "Ship scheduler", type: "task" },
          { time: "12:00", title: "Client review", type: "appointment" },
          { time: "14:00", title: "Integration tests", type: "task" },
          { time: "15:00", title: "1:1 with Scout", type: "event" },
          { time: "16:00", title: "Update README", type: "task" },
        ],
      },
    };
  }

  if (t.includes("overdue") || t.includes("late") || t.includes("behind")) {
    return {
      response: `You have **2 overdue items**:\n\n1. ⚠ **Review PR #142** — urgent, was due yesterday\n2. ⚠ **Submit expense report** — high priority, due 2 days ago\n\nI'd recommend tackling PR #142 first — it's blocking the merge. Want me to reschedule the expense report to this afternoon?`,
      widget: {
        type: "task-list",
        tasks: DEMO_OVERDUE,
        label: "Overdue",
      },
    };
  }

  if (t.includes("book") || t.includes("reserve") || t.includes("meeting")) {
    return {
      response: `I can book that for you. What time works best?\n\nAvailable slots today:\n• 10:00–10:30\n• 11:00–11:30\n• 15:30–16:00\n\nJust say the time and I'll create the calendar event.`,
      widget: {
        type: "stat",
        label: "Available slots",
        value: "3",
        trend: "today",
      },
    };
  }

  return {
    response: `Got it. I'm processing that now.\n\nBased on your current schedule, I can help you:\n• Plan your day optimally\n• Check overdue tasks\n• Book meetings or appointments\n• Review your habits and goals\n\nWhat would you like to do?`,
    widget: {
      type: "agent-grid",
      agents: [
        { name: "Cluster AI", role: "Day Planner", status: "active" },
        { name: "Booking Agent", role: "Scheduling", status: "idle" },
        { name: "Customer Memory", role: "Context", status: "idle" },
      ],
    },
  };
}

/* ── Component ── */
export default function ClusterPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [tasks, setTasks] = useState<TodayTask[]>([...DEMO_OVERDUE, ...DEMO_TASKS]);
  const [events] = useState<TodayEvent[]>(DEMO_EVENTS);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "done" ? "todo" : t.status === "in-progress" ? "done" : "in-progress" as any }
          : t
      )
    );
  }, []);

  const send = useCallback(
    (text: string) => {
      if (streaming) return;
      const userMsg: Msg = { role: "user", content: text, timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);
      setStreaming(true);

      const route = classifyRoute(text);
      const { response, widget } = simulateStream(text);

      // Stream word-by-word
      setMessages((prev) => [...prev, { role: "assistant", content: "", route, timestamp: new Date() }]);

      let acc = "";
      const words = response.split(" ");
      let i = 0;
      const interval = setInterval(() => {
        if (i < words.length) {
          acc += (acc ? " " : "") + words[i];
          i++;
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: acc, route, timestamp: new Date() };
            return copy;
          });
        } else {
          clearInterval(interval);
          // Emit widget after stream completes
          setMessages((prev) => [...prev, { role: "assistant", content: "", widget, timestamp: new Date() }]);
          setStreaming(false);
        }
      }, 25);
    },
    [streaming]
  );

  const priorityColor = (p: string) => {
    switch (p) {
      case "urgent": return "var(--accent-rose, #F43F5E)";
      case "high": return "var(--accent-amber, #F59E0B)";
      case "medium": return "var(--accent-teal)";
      case "low": return "var(--text-tertiary)";
      default: return "var(--text-tertiary)";
    }
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case "done": return "✓";
      case "in-progress": return "◐";
      default: return "○";
    }
  };

  const eventTypeIcon = (t: string) => {
    switch (t) {
      case "habit": return "🧘";
      case "appointment": return "📞";
      case "task": return "✦";
      default: return "●";
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-slide-up">
      {/* Two-column layout: Today sidebar + Chat */}
      <div className="flex flex-1 min-h-0 gap-6">
        {/* ── Left: Today sidebar ── */}
        <div className="w-[340px] shrink-0 flex flex-col gap-4 overflow-y-auto pr-2">
          <div className="accent-bar text-base font-semibold">Today</div>

          {/* Overdue tasks */}
          {tasks.filter((t) => t.overdue).length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--accent-rose, #F43F5E)" }}>
                Overdue
              </div>
              {tasks
                .filter((t) => t.overdue)
                .map((t) => (
                  <div
                    key={t.id}
                    className="glass flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors"
                    style={{ borderLeft: `3px solid ${priorityColor(t.priority)}` }}
                    onClick={() => toggleTask(t.id)}
                  >
                    <span className="tnum text-sm" style={{ color: priorityColor(t.priority) }}>
                      {statusIcon(t.status)}
                    </span>
                    <span className={`text-sm flex-1 ${t.status === "done" ? "line-through opacity-50" : ""}`}>
                      {t.title}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {/* Today's tasks */}
          <div className="space-y-1">
            <div className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
              Tasks
            </div>
            {tasks
              .filter((t) => !t.overdue)
              .map((t) => (
                <div
                  key={t.id}
                  className="glass flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors"
                  style={{ borderLeft: `3px solid ${priorityColor(t.priority)}` }}
                  onClick={() => toggleTask(t.id)}
                >
                  <span className="tnum text-sm" style={{ color: priorityColor(t.priority) }}>
                    {statusIcon(t.status)}
                  </span>
                  <span className={`text-sm flex-1 ${t.status === "done" ? "line-through opacity-50" : ""}`}>
                    {t.title}
                  </span>
                  {t.dueTime && (
                    <span className="tnum text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {t.dueTime}
                    </span>
                  )}
                </div>
              ))}
          </div>

          {/* Today's events */}
          <div className="space-y-1">
            <div className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
              Schedule
            </div>
            {events
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((e) => (
                <div key={e.id} className="glass flex items-center gap-3 px-3 py-2">
                  <span className="text-sm">{eventTypeIcon(e.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{e.title}</div>
                    <div className="tnum text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {e.startTime}
                      {e.endTime ? ` – ${e.endTime}` : ""}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Week peek */}
          <div className="space-y-1">
            <div className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
              This Week
            </div>
            {["Wed", "Thu", "Fri"].map((day, i) => (
              <div key={day} className="glass flex items-center gap-3 px-3 py-2">
                <span className="tnum text-xs font-medium w-8" style={{ color: i === 0 ? "var(--accent-teal)" : "var(--text-tertiary)" }}>
                  {day}
                </span>
                <span className="text-sm flex-1">
                  {i === 0 ? "3 events" : i === 1 ? "2 events" : "1 event"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Chat area ── */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 px-1">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4 opacity-60">
                <div className="text-4xl">✦</div>
                <p className="text-sm text-center" style={{ color: "var(--text-tertiary)" }}>
                  Chat with Cluster AI — your day planner.<br />
                  Try: "Plan my day" · "What's overdue?" · "Book a meeting"
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className="animate-fade-slide-up">
                {/* Route badge */}
                {m.route && m.role === "assistant" && m.content && (
                  <div className="flex items-center gap-2 mb-1 ml-1">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: "var(--bg-hover)",
                        color: m.route === "booking"
                          ? "var(--accent-teal)"
                          : m.route === "customer"
                          ? "var(--accent-amber)"
                          : "var(--text-secondary)",
                      }}
                    >
                      route: {m.route}
                    </span>
                  </div>
                )}

                {/* Widget */}
                {m.widget && <WidgetRenderer widget={m.widget} />}

                {/* Message bubble */}
                {m.content && (
                  <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] px-4 py-3 rounded-xl text-sm whitespace-pre-wrap leading-relaxed ${
                        m.role === "user" ? "text-white" : "glass"
                      }`}
                      style={m.role === "user" ? { background: "var(--accent-indigo)" } : {}}
                    >
                      {m.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <AskAIInput
            collapsedLabel="Ask Cluster AI"
            inputPlaceholder="Plan my day, check overdue tasks, book a meeting…"
            onSubmit={send}
            disabled={streaming}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Widget renderer (mirrors backend [WIDGET]{...}[/WIDGET] sentinel) ── */
function WidgetRenderer({ widget }: { widget: WidgetData }) {
  if (widget.type === "stat") {
    return (
      <div className="glass p-4 inline-flex flex-col gap-1 animate-scale-in">
        <div className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{widget.label}</div>
        <div className="tnum text-3xl font-bold" style={{ color: "var(--accent-teal)" }}>{widget.value}</div>
        {widget.trend && <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{widget.trend}</div>}
      </div>
    );
  }

  if (widget.type === "schedule") {
    const slots = widget.slots as { time: string; title: string; type: string }[];
    return (
      <div className="glass p-4 space-y-2 animate-scale-in max-w-sm">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          Optimized Schedule
        </div>
        {slots.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="tnum text-xs font-medium w-10 shrink-0" style={{ color: "var(--accent-teal)" }}>
              {s.time}
            </span>
            <span className="text-sm">{s.title}</span>
            <span className="text-xs ml-auto px-1.5 py-0.5 rounded" style={{ background: "var(--bg-hover)", color: "var(--text-tertiary)" }}>
              {s.type}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (widget.type === "task-list") {
    const items = widget.tasks as TodayTask[];
    return (
      <div className="glass p-4 space-y-2 animate-scale-in max-w-sm">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent-rose, #F43F5E)" }}>
          {widget.label}
        </div>
        {items.map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-sm" style={{ color: "var(--accent-rose, #F43F5E)" }}>⚠</span>
            <span className="text-sm flex-1">{t.title}</span>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--bg-hover)", color: "var(--text-tertiary)" }}>
              {t.priority}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (widget.type === "agent-grid") {
    const agents = widget.agents as { name: string; role: string; status: string }[];
    return (
      <div className="glass p-4 space-y-2 animate-scale-in max-w-sm">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          Agent Cluster
        </div>
        {agents.map((a, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: a.status === "active" ? "#22C55E" : "var(--text-tertiary)" }}
            />
            <div>
              <div className="text-sm font-medium">{a.name}</div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{a.role}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (widget.type === "activity-feed") {
    const items = widget.items as { text: string; time: string }[];
    return (
      <div className="glass p-4 space-y-2 animate-scale-in max-w-sm">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          Activity
        </div>
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="tnum text-xs" style={{ color: "var(--text-tertiary)" }}>{it.time}</span>
            <span className="text-sm">{it.text}</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
