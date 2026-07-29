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
    case "reminder": return "var(--accent-teal)";
    case "achievement": return "#22C55E";
    case "system": return "var(--text-tertiary)";
    case "mention": return "var(--accent-indigo)";
    default: return "var(--text-tertiary)";
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
    <div className="flex flex-col gap-6 animate-fade-slide-up">
      <div className="flex items-center justify-between">
        <div className="accent-bar text-xl font-semibold">Notifications</div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs px-3 py-1.5 rounded-full"
              style={{ background: "var(--bg-hover)", color: "var(--text-tertiary)" }}
            >
              Mark all read
            </button>
          )}
          <span className="tnum text-xs px-2.5 py-1 rounded-full" style={{ background: unreadCount > 0 ? "var(--accent-indigo)" : "var(--bg-hover)", color: unreadCount > 0 ? "white" : "var(--text-tertiary)" }}>
            {unreadCount} unread
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {(["all", "unread", "read"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="text-xs px-3 py-1.5 rounded-full capitalize transition-colors"
            style={{
              background: filter === f ? "var(--accent-indigo)" : "var(--bg-hover)",
              color: filter === f ? "white" : "var(--text-secondary)",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {filtered.map((n) => (
          <div
            key={n.id}
            className={`glass flex items-start gap-4 px-5 py-3 cursor-pointer transition-colors ${n.read ? "opacity-60" : ""}`}
            style={{ borderLeft: `3px solid ${typeColor(n.type)}` }}
            onClick={() => markRead(n.id)}
          >
            <span className="text-lg mt-0.5">{typeIcon(n.type)}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{n.title}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{n.description}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!n.read && (
                <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent-indigo)" }} />
              )}
              <span className="tnum text-xs" style={{ color: "var(--text-tertiary)" }}>
                {relativeTime(n.timestamp)}
              </span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: "var(--text-tertiary)" }}>
            <div className="text-4xl mb-3">🔔</div>
            <div className="text-sm">No notifications</div>
          </div>
        )}
      </div>
    </div>
  );
}
