"use client";

import { useState } from "react";

interface Notification {
  id: string;
  type: "reminder" | "overdue" | "achievement" | "system" | "mention";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: "n1", type: "overdue", title: "PR #142 review overdue", description: "Was due yesterday — high priority", timestamp: new Date(Date.now() - 1800000).toISOString(), read: false },
  { id: "n2", type: "reminder", title: "Standup in 15 minutes", description: "Daily standup at 09:00", timestamp: new Date(Date.now() - 600000).toISOString(), read: false },
  { id: "n3", type: "achievement", title: "5-day streak! 🔥", description: "You've completed all habits for 5 consecutive days", timestamp: new Date(Date.now() - 3600000).toISOString(), read: false },
  { id: "n4", type: "mention", title: "Booking Agent mentioned you", description: "\"I've booked the conference room for Thursday @benji\"", timestamp: new Date(Date.now() - 7200000).toISOString(), read: true },
  { id: "n5", type: "system", title: "GitHub integration expired", description: "Reconnect to restore PR tracking", timestamp: new Date(Date.now() - 86400000).toISOString(), read: true },
  { id: "n6", type: "reminder", title: "Client review tomorrow", description: "Prepare deck for Acme Corp review at 12:00", timestamp: new Date(Date.now() - 100000000).toISOString(), read: true },
];

function typeIcon(t: string) {
  switch (t) {
    case "overdue": return "⚠️";
    case "reminder": return "🔔";
    case "achievement": return "🏆";
    case "system": return "⚙️";
    case "mention": return "💬";
    default: return "●";
  }
}

function typeColor(t: string) {
  switch (t) {
    case "overdue": return "#F43F5E";
    case "reminder": return "var(--accent)";
    case "achievement": return "#22C55E";
    case "system": return "var(--text-tertiary)";
    case "mention": return "var(--accent-indigo)";
    default: return "var(--text-tertiary)";
  }
}

function typeLabel(t: string) {
  switch (t) {
    case "overdue": return "Overdue";
    case "reminder": return "Reminder";
    case "achievement": return "Achievement";
    case "system": return "System";
    case "mention": return "Mention";
    default: return "—";
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "read") return n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Notifications</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}` : "All caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="saas-btn px-3 py-2 text-sm"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 p-1 rounded-lg" style={{ background: "var(--bg-tertiary)", width: "fit-content" }}>
        {(["all", "unread", "read"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize"
            style={{
              background: filter === f ? "var(--bg-secondary)" : "transparent",
              color: filter === f ? "var(--text-primary)" : "var(--text-tertiary)",
              boxShadow: filter === f ? "var(--shadow-card)" : "none",
            }}
          >
            {f === "unread" ? `Unread · ${unreadCount}` : f}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-5 top-0 bottom-0 w-px"
          style={{ background: "var(--border)" }}
        />

        <div className="space-y-3">
          {filtered.map((n) => {
            const color = typeColor(n.type);
            return (
              <div
                key={n.id}
                className="relative flex items-start gap-4 cursor-pointer"
                onClick={() => markRead(n.id)}
                style={{ opacity: n.read ? 0.6 : 1 }}
              >
                {/* Icon node on the timeline */}
                <div
                  className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full shrink-0"
                  style={{
                    background: "var(--bg-secondary)",
                    border: `2px solid ${color}`,
                  }}
                >
                  <span className="text-base">{typeIcon(n.type)}</span>
                </div>

                {/* Content card */}
                <div className="saas-card p-4 flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="saas-pill" style={{ background: `${color}1A`, color }}>
                          {typeLabel(n.type)}
                        </span>
                        {!n.read && (
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: "var(--accent)" }}
                          />
                        )}
                      </div>
                      <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{n.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{n.description}</div>
                    </div>
                    <span className="tnum text-xs shrink-0" style={{ color: "var(--text-tertiary)" }}>
                      {relativeTime(n.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16" style={{ color: "var(--text-tertiary)" }}>
          <div className="text-4xl mb-3">🔔</div>
          <div className="text-sm">No notifications</div>
        </div>
      )}
    </div>
  );
}
