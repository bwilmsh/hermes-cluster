/**
 * Habits engine — recurring events with wiggle room + auto-reschedule.
 *
 * A Habit = something that happens regularly (school, lunch, gym, work) with:
 *  - a fixed time of day
 *  - a wiggle room (minutes earlier or later it's allowed to slide)
 *  - a set of recurring days (Mon, Tue, … or DAILY)
 *  - an optional duration in minutes
 *
 * The rescheduler takes a week of calendar events (busy blocks) and a list
 * of habits, and produces a list of scheduled occurrences. Each occurrence
 * sits as close to the habit's ideal time as possible while avoiding
 * conflicts — sliding up to the wiggle-room bound.
 *
 * If the wiggle room can't absorb the conflict, the habit is reported as
 * "skipped" for that day so the user can see it needs attention.
 */

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday … 6 = Saturday

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

export const WEEKDAY_LABELS_LONG: Record<Weekday, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export interface Habit {
  id: string;
  title: string;
  /** "HH:MM" 24h */
  idealTime: string;
  /** Minutes the habit can slide earlier OR later than idealTime. 0 = fixed. */
  wiggleMinutes: number;
  /** DAILY = every day; WEEKDAYS = Mon-Fri; CUSTOM = use days[]; or a single WEEKLY day. */
  recurrence: "DAILY" | "WEEKDAYS" | "CUSTOM" | "WEEKLY";
  /** Used when recurrence = CUSTOM. Array of Weekday. */
  days?: Weekday[];
  /** Duration of the habit block in minutes. Default 30. */
  durationMinutes: number;
  /** Hex color for the calendar chip. */
  color?: string;
  active: boolean;
  notes?: string;
  /** Created timestamp. */
  createdAt: string;
}

export interface BusyBlock {
  /** ISO date YYYY-MM-DD */
  date: string;
  /** "HH:MM" */
  startTime: string;
  /** "HH:MM" (optional — defaults to +durationMinutes if absent) */
  endTime?: string;
  /** Title for the conflict tooltip */
  title: string;
  /** Source identifier so the user can see what blocked the habit */
  source: "EVENT" | "TASK" | "APPOINTMENT" | "HABIT";
}

export interface ScheduledOccurrence {
  habitId: string;
  habitTitle: string;
  date: string;
  /** "HH:MM" — actual start time (may differ from idealTime if rescheduled) */
  startTime: string;
  /** "HH:MM" */
  endTime: string;
  /** Minutes offset from idealTime. 0 = at ideal; negative = earlier; positive = later */
  offsetMinutes: number;
  status: "scheduled" | "rescheduled" | "skipped";
  /** Why it was skipped (only set when status === "skipped") */
  skipReason?: string;
  color?: string;
}

export interface HabitWeek {
  /** ISO date of the Sunday at the start of the week */
  weekStart: string;
  occurrences: ScheduledOccurrence[];
  /** Habits that couldn't be placed at all in this week */
  skipped: Array<{ habitId: string; habitTitle: string; date: string; reason: string }>;
}

/* ── Date / time helpers ── */

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Make week start on Monday (1) — same convention as the scheduler.
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Minutes since midnight for "HH:MM" */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** "HH:MM" from minutes since midnight */
function minutesToTime(min: number): string {
  // Clamp into [0, 1439] for safety
  const clamped = Math.max(0, Math.min(1439, Math.round(min)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Format an offset (minutes) as e.g. "+15m" / "-30m" / "on time" */
export function formatOffset(min: number): string {
  if (min === 0) return "on time";
  const sign = min > 0 ? "+" : "-";
  const abs = Math.abs(min);
  if (abs < 60) return `${sign}${abs}m`;
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}h${m > 0 ? ` ${m}m` : ""}`;
}

/* ── Recurrence → day list ── */

export function habitDaysForDateRange(habit: Habit, weekStart: Date): Date[] {
  const out: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    const dow = d.getDay() as Weekday;
    let include = false;
    if (!habit.active) continue;
    switch (habit.recurrence) {
      case "DAILY":
        include = true;
        break;
      case "WEEKDAYS":
        include = dow >= 1 && dow <= 5;
        break;
      case "WEEKLY":
        // Weekly = once per week on the day-of-week of the idealTime's first occurrence
        // We treat "WEEKLY" as: same weekday as the day the habit was created on (or today).
        // For simplicity, anchor on day 1 (Monday) when createdAt's weekday matches weekStart's Monday.
        const createdDow = (parseISODate(habit.createdAt.slice(0, 10)).getDay()) as Weekday;
        include = dow === createdDow;
        break;
      case "CUSTOM":
        include = (habit.days ?? []).includes(dow);
        break;
    }
    if (include) out.push(d);
  }
  return out;
}

/* ── Conflict check ── */

interface Interval {
  start: number; // minutes since midnight
  end: number;
}

function buildBusyIntervals(blocks: BusyBlock[], date: string): Interval[] {
  return blocks
    .filter((b) => b.date === date)
    .map((b) => {
      const start = timeToMinutes(b.startTime);
      const rawEnd = b.endTime ? timeToMinutes(b.endTime) : start + 60;
      return { start, end: Math.max(start, rawEnd) };
    })
    .sort((a, b) => a.start - b.start);
}

function overlapsAny(interval: Interval, busy: Interval[]): boolean {
  for (const b of busy) {
    if (interval.start < b.end && interval.end > b.start) return true;
  }
  return false;
}

/* ── Reschedule a single habit on a single day ──
   Try the ideal slot first. If it conflicts, search outward in 15-min
   steps up to the wiggle-room bound. Prefer earlier offsets (habits
   usually feel better earlier than later). When nothing fits, mark
   as "skipped". */

function rescheduleOne(
  habit: Habit,
  date: string,
  busy: BusyBlock[]
): ScheduledOccurrence {
  const ideal = timeToMinutes(habit.idealTime);
  const duration = habit.durationMinutes;
  const wiggle = habit.wiggleMinutes;
  const STEP = 15; // minutes per search step
  const intervals = buildBusyIntervals(busy, date);

  // Try offsets from -wiggle to +wiggle, every STEP, centered on 0.
  // We'll iterate in the order: 0, -STEP, +STEP, -2*STEP, +2*STEP, …
  const offsets: number[] = [0];
  for (let off = STEP; off <= wiggle; off += STEP) {
    offsets.push(-off);
    offsets.push(off);
  }

  for (const off of offsets) {
    const start = ideal + off;
    const end = start + duration;
    if (start < 0 || end > 24 * 60) continue; // outside the day
    const candidate: Interval = { start, end };
    if (!overlapsAny(candidate, intervals)) {
      const status: ScheduledOccurrence["status"] =
        off === 0 ? "scheduled" : "rescheduled";
      return {
        habitId: habit.id,
        habitTitle: habit.title,
        date,
        startTime: minutesToTime(start),
        endTime: minutesToTime(end),
        offsetMinutes: off,
        status,
        color: habit.color,
      };
    }
  }

  // Nothing fit — skipped.
  return {
    habitId: habit.id,
    habitTitle: habit.title,
    date,
    startTime: habit.idealTime,
    endTime: minutesToTime(ideal + duration),
    offsetMinutes: 0,
    status: "skipped",
    skipReason: `Could not fit within ${wiggle}m wiggle room (${habit.idealTime} ± ${formatOffset(wiggle)})`,
    color: habit.color,
  };
}

/* ── Public API: schedule all habits for a given week ── */

export function scheduleHabitsForWeek(
  habits: Habit[],
  busyBlocks: BusyBlock[],
  weekStart: Date
): HabitWeek {
  // First pass: schedule each habit independently.
  const occurrences: ScheduledOccurrence[] = [];
  for (const habit of habits) {
    const dates = habitDaysForDateRange(habit, weekStart);
    for (const d of dates) {
      occurrences.push(rescheduleOne(habit, toISODate(d), busyBlocks));
    }
  }

  // Second pass: once habits are placed, treat them as busy too, so two
  // habits on the same day don't double-book. Re-reschedule any conflicts
  // that emerged between habits.
  const habitAsBusy: BusyBlock[] = occurrences
    .filter((o) => o.status !== "skipped")
    .map((o) => ({
      date: o.date,
      startTime: o.startTime,
      endTime: o.endTime,
      title: o.habitTitle,
      source: "HABIT" as const,
    }));

  // Re-run rescheduler with the original busy blocks + now-busy habits.
  // Order habits so the most-fixed (lowest wiggle) get first pick.
  const orderedHabits = [...habits].sort((a, b) => a.wiggleMinutes - b.wiggleMinutes);
  const refined: ScheduledOccurrence[] = [];
  for (const habit of orderedHabits) {
    const dates = habitDaysForDateRange(habit, weekStart);
    for (const d of dates) {
      refined.push(rescheduleOne(habit, toISODate(d), [...busyBlocks, ...habitAsBusy]));
    }
  }

  const skipped = refined
    .filter((o) => o.status === "skipped")
    .map((o) => ({
      habitId: o.habitId,
      habitTitle: o.habitTitle,
      date: o.date,
      reason: o.skipReason ?? "Could not schedule",
    }));

  return {
    weekStart: toISODate(weekStart),
    occurrences: refined.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    }),
    skipped,
  };
}

/* ── Convenience: build a Habit from a simple form payload ── */

export function createHabit(input: {
  title: string;
  idealTime: string;
  wiggleMinutes: number;
  recurrence: Habit["recurrence"];
  days?: Weekday[];
  durationMinutes: number;
  color?: string;
  notes?: string;
}): Habit {
  return {
    id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: input.title.trim(),
    idealTime: input.idealTime,
    wiggleMinutes: Math.max(0, Math.min(180, Math.round(input.wiggleMinutes))),
    recurrence: input.recurrence,
    days: input.days,
    durationMinutes: Math.max(5, Math.min(480, Math.round(input.durationMinutes))),
    color: input.color,
    active: true,
    notes: input.notes,
    createdAt: new Date().toISOString(),
  };
}