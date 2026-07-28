"use client";

import { useMemo, useState } from "react";
import {
  type Habit,
  type ScheduledOccurrence,
  type BusyBlock,
  createHabit,
  scheduleHabitsForWeek,
  startOfWeek,
  addDays,
  toISODate,
  WEEKDAY_LABELS,
  WEEKDAY_LABELS_LONG,
  formatOffset,
  habitDaysForDateRange,
  type Weekday,
} from "@/lib/habits";

const COLOR_SWATCHES = [
  "#4866FD", "#22C55E", "#F59E0B", "#F43F5E",
  "#8B5CF6", "#06B6D4", "#EC4899", "#10B981",
];

const SEED_HABITS: Habit[] = [
  {
    id: "h-1",
    title: "Lunch",
    idealTime: "12:30",
    wiggleMinutes: 30,
    recurrence: "DAILY",
    durationMinutes: 30,
    color: "#F59E0B",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "h-2",
    title: "Gym Workout",
    idealTime: "18:00",
    wiggleMinutes: 60,
    recurrence: "CUSTOM",
    days: [1, 3, 5], // Mon, Wed, Fri
    durationMinutes: 60,
    color: "#22C55E",
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "h-3",
    title: "Morning Run",
    idealTime: "06:30",
    wiggleMinutes: 15,
    recurrence: "CUSTOM",
    days: [2, 4, 6], // Tue, Thu, Sat
    durationMinutes: 30,
    color: "#06B6D4",
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>(SEED_HABITS);
  const [showForm, setShowForm] = useState(false);
  const [previewConflictMode, setPreviewConflictMode] = useState(true);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formTime, setFormTime] = useState("12:00");
  const [formWiggle, setFormWiggle] = useState(30);
  const [formDuration, setFormDuration] = useState(30);
  const [formRecurrence, setFormRecurrence] = useState<Habit["recurrence"]>("DAILY");
  const [formDays, setFormDays] = useState<Weekday[]>([1, 2, 3, 4, 5]);
  const [formColor, setFormColor] = useState(COLOR_SWATCHES[0]);
  const [formNotes, setFormNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Sample busy blocks to demo the rescheduler (in lieu of real scheduler events)
  const sampleBusyBlocks: BusyBlock[] = useMemo(() => {
    if (!previewConflictMode) return [];
    const out: BusyBlock[] = [];
    // Block 12:00-13:00 on Monday to force lunch to reschedule
    out.push({
      date: toISODate(weekDays[0]),
      startTime: "12:00",
      endTime: "13:00",
      title: "Client Review",
      source: "APPOINTMENT",
    });
    // Block 18:00-19:00 on Wednesday to push gym
    out.push({
      date: toISODate(weekDays[2]),
      startTime: "18:00",
      endTime: "19:00",
      title: "Team Retro",
      source: "EVENT",
    });
    return out;
  }, [previewConflictMode, weekDays]);

  const scheduled = useMemo(
    () => scheduleHabitsForWeek(habits, sampleBusyBlocks, weekStart),
    [habits, sampleBusyBlocks, weekStart]
  );

  const stats = useMemo(() => {
    const total = scheduled.occurrences.length;
    const onTime = scheduled.occurrences.filter((o) => o.status === "scheduled").length;
    const rescheduled = scheduled.occurrences.filter((o) => o.status === "rescheduled").length;
    const skipped = scheduled.occurrences.filter((o) => o.status === "skipped").length;
    return { total, onTime, rescheduled, skipped };
  }, [scheduled]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormTitle("");
    setFormTime("12:00");
    setFormWiggle(30);
    setFormDuration(30);
    setFormRecurrence("DAILY");
    setFormDays([1, 2, 3, 4, 5]);
    setFormColor(COLOR_SWATCHES[0]);
    setFormNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    if (editingId) {
      setHabits((prev) =>
        prev.map((h) =>
          h.id === editingId
            ? {
                ...h,
                title: formTitle.trim(),
                idealTime: formTime,
                wiggleMinutes: formWiggle,
                durationMinutes: formDuration,
                recurrence: formRecurrence,
                days: formRecurrence === "CUSTOM" ? formDays : undefined,
                color: formColor,
                notes: formNotes,
              }
            : h
        )
      );
    } else {
      const habit = createHabit({
        title: formTitle,
        idealTime: formTime,
        wiggleMinutes: formWiggle,
        durationMinutes: formDuration,
        recurrence: formRecurrence,
        days: formRecurrence === "CUSTOM" ? formDays : undefined,
        color: formColor,
        notes: formNotes,
      });
      setHabits((prev) => [habit, ...prev]);
    }
    resetForm();
  };

  const handleEdit = (habit: Habit) => {
    setShowForm(true);
    setEditingId(habit.id);
    setFormTitle(habit.title);
    setFormTime(habit.idealTime);
    setFormWiggle(habit.wiggleMinutes);
    setFormDuration(habit.durationMinutes);
    setFormRecurrence(habit.recurrence);
    setFormDays(habit.days ?? [1, 2, 3, 4, 5]);
    setFormColor(habit.color ?? COLOR_SWATCHES[0]);
    setFormNotes(habit.notes ?? "");
  };

  const handleDelete = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  const toggleActive = (id: string) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, active: !h.active } : h)));
  };

  const toggleFormDay = (day: Weekday) => {
    setFormDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  // Group occurrences by date for the weekly preview
  const byDate = useMemo(() => {
    const map: Record<string, ScheduledOccurrence[]> = {};
    for (const occ of scheduled.occurrences) {
      (map[occ.date] ??= []).push(occ);
    }
    return map;
  }, [scheduled]);

  return (
    <div className="animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div className="accent-bar">
          <h1 className="text-2xl font-bold tracking-tight">Habits</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Recurring events with wiggle room — auto-reschedules around calendar conflicts
          </p>
        </div>
        <button
          type="button"
          className="saas-btn-primary px-4 py-2 text-sm flex items-center gap-1.5"
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {showForm ? "Cancel" : "New Habit"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatChip label="This week" value={stats.total} accent="var(--accent-indigo)" />
        <StatChip label="On time" value={stats.onTime} accent="var(--accent-green)" />
        <StatChip label="Rescheduled" value={stats.rescheduled} accent="var(--accent-amber)" />
        <StatChip label="Skipped" value={stats.skipped} accent={stats.skipped > 0 ? "var(--accent-rose)" : "var(--text-tertiary)"} />
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="saas-card-lg p-5 mb-6">
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            {editingId ? "Edit habit" : "New habit"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                What is it?
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Lunch, Gym, Morning Run"
                className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Ideal time
                </label>
                <input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none"
                  style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Duration (min)
                </label>
                <input
                  type="number"
                  min={5}
                  max={480}
                  step={5}
                  value={formDuration}
                  onChange={(e) => setFormDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none tnum"
                  style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Wiggle room (min)
                </label>
                <input
                  type="number"
                  min={0}
                  max={180}
                  step={5}
                  value={formWiggle}
                  onChange={(e) => setFormWiggle(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none tnum"
                  style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
                <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                  How many minutes it can slide earlier or later if a conflict appears
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Recurring days
              </label>
              <div className="flex gap-1.5 flex-wrap items-center">
                {(["DAILY", "WEEKDAYS", "WEEKLY", "CUSTOM"] as Habit["recurrence"][]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFormRecurrence(r)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                    style={{
                      background: formRecurrence === r ? "var(--accent-light)" : "var(--bg-tertiary)",
                      color: formRecurrence === r ? "var(--accent)" : "var(--text-secondary)",
                      border: `1px solid ${formRecurrence === r ? "var(--accent)" : "var(--border)"}`,
                    }}
                  >
                    {r === "WEEKDAYS" ? "Weekdays" : r.charAt(0) + r.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              {formRecurrence === "CUSTOM" && (
                <div className="flex gap-1.5 mt-2">
                  {([0, 1, 2, 3, 4, 5, 6] as Weekday[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleFormDay(d)}
                      className="w-9 h-9 rounded-md text-xs font-medium transition-all tnum"
                      style={{
                        background: formDays.includes(d) ? "var(--accent)" : "var(--bg-tertiary)",
                        color: formDays.includes(d) ? "#fff" : "var(--text-secondary)",
                        border: `1px solid ${formDays.includes(d) ? "var(--accent)" : "var(--border)"}`,
                      }}
                      title={WEEKDAY_LABELS_LONG[d]}
                    >
                      {WEEKDAY_LABELS[d].slice(0, 1)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Color
              </label>
              <div className="flex gap-1.5">
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormColor(c)}
                    aria-label={`Color ${c}`}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      background: c,
                      border: formColor === c ? "2px solid var(--text-primary)" : "2px solid transparent",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Notes (optional)
              </label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="e.g. weights day / cardio day"
                className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border focus:outline-none"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="saas-btn px-4 py-2 text-sm" onClick={resetForm}>
                Cancel
              </button>
              <button
                type="submit"
                className="saas-btn-primary px-4 py-2 text-sm"
                disabled={!formTitle.trim()}
                style={{ opacity: formTitle.trim() ? 1 : 0.5 }}
              >
                {editingId ? "Save changes" : "Add habit"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Habits list + weekly preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Habits list */}
        <div className="saas-card-lg p-5">
          <h2 className="text-base font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            Your habits ({habits.length})
          </h2>
          {habits.length === 0 && (
            <div className="text-center py-8 text-sm" style={{ color: "var(--text-tertiary)" }}>
              No habits yet. Click <strong>New Habit</strong> to add one.
            </div>
          )}
          <ul className="flex flex-col gap-2">
            {habits.map((h) => {
              const upcomingDays = habitDaysForDateRange(h, weekStart).length;
              return (
                <li
                  key={h.id}
                  className="p-3 rounded-lg flex items-center gap-3 group transition-colors"
                  style={{
                    background: h.active ? "var(--bg-tertiary)" : "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    opacity: h.active ? 1 : 0.6,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      background: h.color ?? "var(--accent-indigo)",
                      flexShrink: 0,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-medium truncate"
                      style={{
                        color: h.active ? "var(--text-primary)" : "var(--text-tertiary)",
                        textDecoration: h.active ? "none" : "line-through",
                      }}
                    >
                      {h.title}
                    </div>
                    <div className="text-xs flex items-center gap-2 mt-0.5 tnum" style={{ color: "var(--text-tertiary)" }}>
                      <span>{h.idealTime}</span>
                      <span>·</span>
                      <span>{h.durationMinutes}m</span>
                      <span>·</span>
                      <span>±{h.wiggleMinutes}m</span>
                      <span>·</span>
                      <span>
                        {h.recurrence === "DAILY"
                          ? "Daily"
                          : h.recurrence === "WEEKDAYS"
                          ? "Weekdays"
                          : h.recurrence === "WEEKLY"
                          ? "Weekly"
                          : `${h.days?.length ?? 0} day${(h.days?.length ?? 0) === 1 ? "" : "s"}/wk`}
                      </span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {upcomingDays} occurrence{upcomingDays === 1 ? "" : "s"} this week
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => toggleActive(h.id)}
                      aria-label={h.active ? "Pause habit" : "Resume habit"}
                      className="text-xs px-2 py-1 rounded"
                      style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                    >
                      {h.active ? "Pause" : "Resume"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(h)}
                      aria-label="Edit habit"
                      className="text-xs px-2 py-1 rounded"
                      style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(h.id)}
                      aria-label="Delete habit"
                      className="text-xs px-2 py-1 rounded"
                      style={{ background: "var(--bg-secondary)", color: "var(--accent-rose)", border: "1px solid var(--border)" }}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Weekly preview */}
        <div className="saas-card-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              This week's plan
            </h2>
            <label className="flex items-center gap-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
              <input
                type="checkbox"
                checked={previewConflictMode}
                onChange={(e) => setPreviewConflictMode(e.target.checked)}
              />
              Show sample conflicts
            </label>
          </div>
          <div className="grid grid-cols-7 gap-1 text-xs">
            {weekDays.map((d) => {
              const iso = toISODate(d);
              const today = new Date().toDateString() === d.toDateString();
              const dayOccs = byDate[iso] ?? [];
              return (
                <div
                  key={iso}
                  className="rounded p-1.5"
                  style={{
                    background: today ? "var(--accent-light)" : "var(--bg-tertiary)",
                    border: today ? "1px solid var(--accent)" : "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold tnum" style={{ color: today ? "var(--accent)" : "var(--text-secondary)" }}>
                      {WEEKDAY_LABELS[d.getDay() as Weekday]}
                    </span>
                    <span className="tnum" style={{ color: "var(--text-tertiary)" }}>
                      {d.getDate()}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {dayOccs.length === 0 && (
                      <div className="text-xs" style={{ color: "var(--text-tertiary)", opacity: 0.5 }}>
                        —
                      </div>
                    )}
                    {dayOccs.map((o, i) => (
                      <div
                        key={i}
                        title={o.skipReason ?? `${o.habitTitle} · ${o.startTime}–${o.endTime} (${formatOffset(o.offsetMinutes)})`}
                        className="text-xs px-1 py-0.5 rounded flex items-center gap-1 tnum"
                        style={{
                          background: o.status === "skipped" ? "rgba(244, 63, 94, 0.15)" : "var(--bg-secondary)",
                          borderLeft: `2px solid ${
                            o.status === "skipped"
                              ? "var(--accent-rose)"
                              : o.color ?? "var(--accent-indigo)"
                          }`,
                          opacity: o.status === "skipped" ? 0.7 : 1,
                          textDecoration: o.status === "skipped" ? "line-through" : "none",
                        }}
                      >
                        {o.status === "rescheduled" && (
                          <span title="Rescheduled to fit" style={{ fontSize: 8, color: "var(--accent-amber)" }}>
                            ⟳
                          </span>
                        )}
                        <span style={{ color: "var(--text-secondary)" }}>{o.startTime}</span>
                        <span className="truncate" style={{ color: o.status === "skipped" ? "var(--text-tertiary)" : "var(--text-primary)" }}>
                          {o.habitTitle}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {scheduled.skipped.length > 0 && (
            <div className="mt-4 p-3 rounded-lg" style={{ background: "rgba(244, 63, 94, 0.08)", border: "1px solid rgba(244, 63, 94, 0.25)" }}>
              <div className="text-xs font-semibold mb-1" style={{ color: "var(--accent-rose)" }}>
                ⚠ Could not fit ({scheduled.skipped.length})
              </div>
              <ul className="text-xs space-y-0.5" style={{ color: "var(--text-secondary)" }}>
                {scheduled.skipped.map((s, i) => (
                  <li key={i}>
                    {s.habitTitle} on {s.date} — {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {stats.rescheduled > 0 && stats.skipped === 0 && (
            <div className="mt-4 text-xs flex items-center gap-1.5" style={{ color: "var(--accent-amber)" }}>
              <span>⟳</span>
              <span>{stats.rescheduled} habit{stats.rescheduled === 1 ? "" : "s"} rescheduled to fit your calendar this week.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatChip({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div
      className="p-3 rounded-lg flex flex-col gap-1"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
    >
      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </span>
      <span className="text-xl font-bold tnum" style={{ color: accent }}>
        {value}
      </span>
    </div>
  );
}