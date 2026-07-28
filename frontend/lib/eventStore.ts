"use client";

/**
 * Shared event store for the cluster app.
 *
 * Two concepts that are intentionally separate:
 *
 *   - EVENT   — something on the calendar at a specific time.
 *   - TASK    — a unit of work; it LIVES INSIDE an event (event_type=TASK),
 *               or is derived from a calendar event the user wants to "check off".
 *   - DUE DATE — an explicit deadline (assignment, bill, exam) that's NOT
 *                derived from the calendar. When created, it auto-adds an
 *                EVENT to the calendar so the date is reflected there too.
 *
 * The store currently uses React state in a module-level singleton. It's
 * shaped exactly like the Supabase `events` and `due_dates` tables so it
 * can be swapped for `supabase.from('events').select(...)` later without
 * changing the page code.
 */

import { useSyncExternalStore } from "react";

export type EventType = "EVENT" | "TASK" | "APPOINTMENT" | "HABIT";
export type EventStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface CalendarEvent {
  id: string;
  title: string;
  /** ISO datetime string */
  startTime: string;
  /** ISO datetime string (optional — for tasks, defaults to start + 1h) */
  endTime?: string;
  eventType: EventType;
  status: EventStatus;
  priority: Priority;
  notes?: string;
  tags?: string[];
  /** Where this event came from. 'due-date' = auto-created from a due date. */
  source?: "manual" | "habit" | "ai" | "due-date";
  /** When source = 'due-date', the id of the originating due_date row. */
  sourceId?: string;
}

export interface DueDate {
  id: string;
  title: string;
  description?: string;
  /** ISO datetime string */
  dueAt: string;
  priority: Priority;
  category?: string;
  completed: boolean;
  /** When set, this due date auto-created a calendar event with this id */
  calendarEventId?: string;
}

/* ── Module-level singleton store ── */

type Listener = () => void;

const listeners = new Set<Listener>();

let events: CalendarEvent[] = [
  // Seed: some events that contain tasks the user can check off
  {
    id: "e-1",
    title: "Review PR #142 — API auth refactor",
    startTime: "2026-07-27T09:00:00Z",
    endTime: "2026-07-27T10:00:00Z",
    eventType: "TASK",
    status: "TODO",
    priority: "URGENT",
    tags: ["API Migration"],
    notes: "Focus on token refresh logic",
  },
  {
    id: "e-2",
    title: "Ship scheduler view",
    startTime: "2026-07-29T09:30:00Z",
    endTime: "2026-07-29T12:00:00Z",
    eventType: "TASK",
    status: "TODO",
    priority: "URGENT",
    tags: ["Mobile App"],
  },
  {
    id: "e-3",
    title: "Send invoices for May",
    startTime: "2026-07-31T10:00:00Z",
    endTime: "2026-07-31T11:00:00Z",
    eventType: "TASK",
    status: "TODO",
    priority: "MEDIUM",
    tags: ["Finance"],
  },
  {
    id: "e-4",
    title: "Plan Q3 roadmap",
    startTime: "2026-08-15T13:00:00Z",
    endTime: "2026-08-15T15:00:00Z",
    eventType: "TASK",
    status: "TODO",
    priority: "LOW",
    tags: ["Q3 Roadmap"],
  },
  {
    id: "e-5",
    title: "Design review",
    startTime: "2026-07-20T14:00:00Z",
    endTime: "2026-07-20T15:00:00Z",
    eventType: "TASK",
    status: "DONE",
    priority: "MEDIUM",
    tags: ["Marketing"],
  },
  {
    id: "e-6",
    title: "Client demo prep",
    startTime: "2026-07-28T11:00:00Z",
    endTime: "2026-07-28T12:00:00Z",
    eventType: "TASK",
    status: "TODO",
    priority: "URGENT",
    tags: ["Mobile App"],
  },
  {
    id: "e-7",
    title: "Update documentation",
    startTime: "2026-08-10T10:00:00Z",
    endTime: "2026-08-10T11:00:00Z",
    eventType: "TASK",
    status: "TODO",
    priority: "LOW",
    tags: ["API Migration"],
  },
  {
    id: "e-8",
    title: "Fix login bug",
    startTime: "2026-07-22T09:00:00Z",
    endTime: "2026-07-22T10:00:00Z",
    eventType: "TASK",
    status: "DONE",
    priority: "URGENT",
    tags: ["Mobile App"],
  },
  // Seed: a couple of regular events so the Tasks page isn't all tasks
  {
    id: "e-9",
    title: "Standup",
    startTime: "2026-07-27T09:00:00Z",
    endTime: "2026-07-27T09:15:00Z",
    eventType: "EVENT",
    status: "TODO",
    priority: "MEDIUM",
  },
  {
    id: "e-10",
    title: "Client Review",
    startTime: "2026-07-27T12:00:00Z",
    endTime: "2026-07-27T13:00:00Z",
    eventType: "APPOINTMENT",
    status: "TODO",
    priority: "HIGH",
  },
];

let dueDates: DueDate[] = [
  {
    id: "dd-1",
    title: "Math Problem Set 4",
    description: "Chapter 7 — Linear Algebra",
    dueAt: "2026-07-24T18:00:00Z",
    priority: "URGENT",
    category: "Assignment",
    completed: false,
  },
  {
    id: "dd-2",
    title: "Biology Midterm Exam",
    description: "Units 1-5 — cumulative",
    dueAt: "2026-07-26T10:00:00Z",
    priority: "URGENT",
    category: "Exam",
    completed: false,
  },
  {
    id: "dd-3",
    title: "Mobile App Redesign",
    description: "Final mockups delivery",
    dueAt: "2026-07-29T15:00:00Z",
    priority: "HIGH",
    category: "Project",
    completed: false,
  },
  {
    id: "dd-4",
    title: "Client Proposal",
    description: "Acme Corp — SOW + timeline",
    dueAt: "2026-07-31T17:00:00Z",
    priority: "MEDIUM",
    category: "Work",
    completed: false,
  },
  {
    id: "dd-5",
    title: "Research Paper Draft",
    description: "8 pages — MLA format",
    dueAt: "2026-08-02T23:59:00Z",
    priority: "MEDIUM",
    category: "Assignment",
    completed: false,
  },
  {
    id: "dd-6",
    title: "Retrospective",
    description: "Sprint 14 — notes prep",
    dueAt: "2026-08-05T16:00:00Z",
    priority: "LOW",
    category: "Meeting",
    completed: false,
  },
];

const emit = () => {
  for (const l of listeners) l();
};

const subscribe = (l: Listener) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const getSnapshot = () => events;
const getDueSnapshot = () => dueDates;

/* ── Public API ── */

export function useEvents(): CalendarEvent[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useDueDates(): DueDate[] {
  return useSyncExternalStore(subscribe, getDueSnapshot, getDueSnapshot);
}

export function useTasks(): CalendarEvent[] {
  // Tasks = events of type TASK. The Tasks page operates on these.
  return useSyncExternalStore(subscribe, () => events.filter((e) => e.eventType === "TASK"), () => events.filter((e) => e.eventType === "TASK"));
}

/* ── Mutations ── */

export function updateEvent(id: string, patch: Partial<CalendarEvent>) {
  events = events.map((e) => (e.id === id ? { ...e, ...patch } : e));
  emit();
}

export function toggleTaskDone(id: string) {
  events = events.map((e) =>
    e.id === id ? { ...e, status: e.status === "DONE" ? "TODO" : "DONE" } : e
  );
  emit();
}

export function deleteEvent(id: string) {
  events = events.filter((e) => e.id !== id);
  // Also unlink any due date that pointed at this event
  dueDates = dueDates.map((d) => (d.calendarEventId === id ? { ...d, calendarEventId: undefined } : d));
  emit();
}

export function addEvent(ev: Omit<CalendarEvent, "id">): CalendarEvent {
  const created: CalendarEvent = { ...ev, id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
  events = [created, ...events];
  emit();
  return created;
}

export function addDueDate(input: Omit<DueDate, "id" | "completed" | "calendarEventId"> & { autoAddToCalendar?: boolean }): DueDate {
  const id = `dd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  let calendarEventId: string | undefined;

  if (input.autoAddToCalendar !== false) {
    // Auto-create a calendar event so the date shows on the calendar too.
    const ev = addEvent({
      title: input.title,
      startTime: input.dueAt,
      endTime: input.dueAt,
      eventType: "APPOINTMENT",
      status: "TODO",
      priority: input.priority,
      notes: input.description,
      source: "due-date",
      sourceId: id,
    });
    calendarEventId = ev.id;
  }

  const created: DueDate = {
    id,
    title: input.title,
    description: input.description,
    dueAt: input.dueAt,
    priority: input.priority,
    category: input.category,
    completed: false,
    calendarEventId,
  };
  dueDates = [created, ...dueDates];
  emit();
  return created;
}

export function toggleDueDateDone(id: string) {
  dueDates = dueDates.map((d) =>
    d.id === id ? { ...d, completed: !d.completed } : d
  );
  // If linked to a calendar event, mark that as DONE too
  const dd = dueDates.find((d) => d.id === id);
  if (dd?.calendarEventId) {
    events = events.map((e) =>
      e.id === dd.calendarEventId ? { ...e, status: dd.completed ? "DONE" : "TODO" } : e
    );
  }
  emit();
}

export function deleteDueDate(id: string) {
  const dd = dueDates.find((d) => d.id === id);
  dueDates = dueDates.filter((d) => d.id !== id);
  // Also remove the auto-created calendar event
  if (dd?.calendarEventId) {
    events = events.filter((e) => e.id !== dd.calendarEventId);
  }
  emit();
}

/* ── Date helpers ── */

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}

/* ── Priority meta ── */

export const PRIORITY_META: Record<Priority, { label: string; color: string; bg: string; border: string; dot: string }> = {
  LOW:    { label: "Low",    color: "#6F87FC", bg: "rgba(111, 135, 252, 0.12)", border: "rgba(111, 135, 252, 0.30)", dot: "#6F87FC" },
  MEDIUM: { label: "Medium", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)",  border: "rgba(245, 158, 11, 0.30)",  dot: "#F59E0B" },
  HIGH:   { label: "High",   color: "#F43F5E", bg: "rgba(244, 63, 94, 0.12)",   border: "rgba(244, 63, 94, 0.30)",   dot: "#F43F5E" },
  URGENT: { label: "Urgent", color: "#F43F5E", bg: "rgba(244, 63, 94, 0.18)",   border: "rgba(244, 63, 94, 0.45)",   dot: "#F43F5E" },
};