/**
 * Supabase client wrappers — browser-safe.
 *
 * `getBrowserClient()` uses the anon key and runs in the browser. It
 * respects RLS, so users only see their own rows.
 *
 * Server-side wrappers (cookies, service role) live in supabaseServer.ts
 * to keep this file Node-free and avoid pulling Node types into the
 * client bundle.
 */

import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith("https://")
);

export function getBrowserClient() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
    );
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const SUPABASE_ENV = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
} as const;

/* ── Database row types — match the schema in supabase/migrations/ ── */

export type ReminderLead = "AT_TIME" | "5_MIN" | "15_MIN" | "30_MIN" | "1_HOUR" | "1_DAY";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type EventType = "EVENT" | "TASK" | "APPOINTMENT" | "HABIT";
export type EventStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type RecurrenceType = "NONE" | "DAILY" | "WEEKDAYS" | "WEEKLY" | "CUSTOM" | "MONTHLY";

export interface ProfileRow {
  id: string;
  display_name: string;
  avatar_color: string | null;
  default_reminder_lead: ReminderLead;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  all_day: boolean;
  event_type: EventType;
  status: EventStatus;
  priority: Priority;
  location: string | null;
  notes: string | null;
  tags: string[];
  reminder_lead: ReminderLead | null;
  reminder_sent_at: string | null;
  source: string;
  source_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitRow {
  id: string;
  user_id: string;
  title: string;
  ideal_time: string;
  wiggle_minutes: number;
  duration_minutes: number;
  recurrence: RecurrenceType;
  days: number[] | null;
  color: string;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DueDateRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_at: string;
  priority: Priority;
  category: string | null;
  completed: boolean;
  completed_at: string | null;
  reminder_lead: ReminderLead | null;
  reminder_sent_at: string | null;
  calendar_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiMessageRow {
  id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_event_ids: string[];
  created_at: string;
}

export interface AiUserFactRow {
  id: string;
  user_id: string;
  fact: string;
  category: string | null;
  confidence: number;
  source_message_id: string | null;
  created_at: string;
  updated_at: string;
}