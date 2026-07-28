"use client";

import Link from "next/link";
import { useState } from "react";

interface Notification {
  id: string;
  title: string;
  body: string;
  when: string;
  type: "task" | "project" | "meeting" | "team" | "system";
  read: boolean;
  href: string;
}

const INITIAL: Notification[] = [
  {
    id: "n1",
    title: "Deadline approaching",
    body: "Biology Midterm Exam is due in 6 hours",
    when: "Just now",
    type: "task",
    read: false,
    href: "/due-dates",
  },
  {
    id: "n2",
    title: "API Migration at risk",
    body: "Project progress is behind schedule (45%)",
    when: "12 min ago",
    type: "project",
    read: false,
    href: "/projects",
  },
  {
    id: "n3",
    title: "Daily Standup starting soon",
    body: "Zoom · 09:00 AM with JD, MK, AS",
    when: "1h ago",
    type: "meeting",
    read: false,
    href: "/scheduler",
  },
  {
    id: "n4",
    title: "Habit streak completed",
    body: "Morning Run — 7 day streak",
    when: "3h ago",
    type: "team",
    read: true,
    href: "/habits",
  },
  {
    id: "n5",
    title: "AI assistant finished",
    body: "Cluster AI scheduled your top 3 priorities",
    when: "Yesterday",
    type: "team",
    read: true,
    href: "/cluster",
  },
  {
    id: "n6",
    title: "Weekly report ready",
    body: "Your analytics summary for this week is available",
    when: "Yesterday",
    type: "system",
    read: true,
    href: "/analytics",
  },
];

const TYPE_COLOR: Record<Notification["type"], string> = {
  task: "#F59E0B",
  project: "#FF6B35",
  meeting: "#3B82F6",
  team: "#8B5CF6",
  system: "#22C55E",
};

export default function NotificationsPage() {
  const [items, setItems] = useState(INITIAL);

  const unread = items.filter((n) => !n.read).length;

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const clearRead = () => setItems((prev) => prev.filter((n) => !n.read));

  return (
    <div className="animate-fade-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Notifications
          </h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {unread > 0 ? `${unread} unread` : "You're all caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="saas-btn px-4 py-2 text-sm"
            onClick={markAllRead}
            disabled={unread === 0}
          >
            Mark all read
          </button>
          <button
            type="button"
            className="saas-btn px-4 py-2 text-sm"
            onClick={clearRead}
            disabled={!items.some((n) => n.read)}
          >
            Clear read
          </button>
        </div>
      </div>

      <div className="saas-card-lg p-2 flex flex-col gap-1">
        {items.length === 0 && (
          <div className="text-center py-12 text-sm" style={{ color: "var(--text-tertiary)" }}>
            No notifications
          </div>
        )}
        {items.map((n) => (
          <Link
            key={n.id}
            href={n.href}
            onClick={() => markRead(n.id)}
            className="flex items-start gap-3 px-4 py-3 rounded-lg transition-colors hover:opacity-90"
            style={{
              textDecoration: "none",
              color: "inherit",
              background: n.read ? "transparent" : "color-mix(in srgb, var(--accent, #486AFE) 8%, transparent)",
            }}
          >
            <span
              className="shrink-0 mt-1"
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: n.read ? "var(--border)" : TYPE_COLOR[n.type],
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-sm font-medium truncate"
                  style={{ color: "var(--text-primary)", fontWeight: n.read ? 500 : 600 }}
                >
                  {n.title}
                </span>
                <span className="text-xs shrink-0" style={{ color: "var(--text-tertiary)" }}>
                  {n.when}
                </span>
              </div>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {n.body}
              </p>
              <span
                className="inline-block mt-1 text-xs capitalize"
                style={{ color: TYPE_COLOR[n.type] }}
              >
                {n.type}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
