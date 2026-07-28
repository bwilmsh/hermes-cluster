"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ViewMode = "day" | "week" | "month";
type SlideDir = "left" | "right" | "none";

interface SchedEvent {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  /** ISO date YYYY-MM-DD */
  date: string;
  itemType: "EVENT" | "TASK" | "APPOINTMENT" | "HABIT";
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  reminder: boolean;
  tags?: string[];
  notes?: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TYPE_COLORS: Record<string, string> = {
  EVENT: "var(--accent-indigo)",
  TASK: "var(--accent-teal)",
  APPOINTMENT: "var(--accent-amber)",
  HABIT: "var(--accent-green)",
};

/* ── Date helpers ── */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function addMonths(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

function formatRangeLabel(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();
  if (sameMonth && sameYear) {
    return `${start.toLocaleString("en-US", { month: "long", day: "numeric" })} – ${end.getDate()}, ${end.getFullYear()}`;
  }
  if (sameYear) {
    return `${start.toLocaleString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleString("en-US", { month: "short", day: "numeric" })}, ${end.getFullYear()}`;
  }
  return `${start.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${end.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function seedEvents(): SchedEvent[] {
  const mon = startOfWeek(new Date());
  const iso = (offset: number) => toISODate(addDays(mon, offset));
  return [
    { id: "1", title: "Standup", startTime: "09:00", endTime: "09:15", date: iso(0), itemType: "EVENT", status: "TODO", priority: "MEDIUM", reminder: true, tags: ["work"] },
    { id: "2", title: "Ship scheduler", startTime: "09:30", endTime: "12:00", date: iso(0), itemType: "TASK", status: "TODO", priority: "HIGH", reminder: false, tags: ["dev"] },
    { id: "3", title: "Client Review", startTime: "12:00", endTime: "13:00", date: iso(0), itemType: "APPOINTMENT", status: "TODO", priority: "HIGH", reminder: true, tags: ["client"] },
    { id: "4", title: "Lunch w/Alex", startTime: "13:30", endTime: "14:30", date: iso(0), itemType: "EVENT", status: "TODO", priority: "LOW", reminder: false, tags: ["social"] },
    { id: "5", title: "Morning Run", startTime: "06:00", endTime: "06:30", date: iso(0), itemType: "HABIT", status: "DONE", priority: "MEDIUM", reminder: false, tags: ["health"] },
    { id: "6", title: "1:1 Manager", startTime: "10:00", endTime: "10:30", date: iso(1), itemType: "EVENT", status: "TODO", priority: "MEDIUM", reminder: true, tags: ["work"] },
    { id: "7", title: "Product Demo", startTime: "15:00", endTime: "16:00", date: iso(2), itemType: "APPOINTMENT", status: "TODO", priority: "HIGH", reminder: true, tags: ["client"] },
    { id: "8", title: "Sprint Review", startTime: "09:00", endTime: "10:00", date: iso(3), itemType: "EVENT", status: "TODO", priority: "MEDIUM", reminder: false, tags: ["work"] },
    { id: "9", title: "Retro", startTime: "16:00", endTime: "17:00", date: iso(4), itemType: "EVENT", status: "TODO", priority: "LOW", reminder: false, tags: ["reflect"] },
  ];
}

/* ── Add Event Modal ── */
interface AddEventForm {
  date: string;
  time: string;
  title: string;
  reminder: boolean;
}

function AddEventModal({
  initial,
  onClose,
  onSave,
}: {
  initial: AddEventForm;
  onClose: () => void;
  onSave: (form: AddEventForm) => void;
}) {
  const [form, setForm] = useState<AddEventForm>(initial);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date || !form.time) return;
    onSave({ ...form, title: form.title.trim() });
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="sched-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="sched-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-event-title"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 id="add-event-title" className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Add event
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-2 py-1 rounded"
            style={{ color: "var(--text-tertiary)", background: "transparent", border: "none", cursor: "pointer" }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-tertiary)" }} htmlFor="ev-title">
              What&apos;s the event?
            </label>
            <input
              id="ev-title"
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Design review"
              className="sched-input"
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-tertiary)" }} htmlFor="ev-date">
                Date
              </label>
              <input
                id="ev-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="sched-input"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-tertiary)" }} htmlFor="ev-time">
                Time
              </label>
              <input
                id="ev-time"
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="sched-input"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                Reminder
              </div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Get notified before this event
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.reminder}
              onClick={() => setForm((f) => ({ ...f, reminder: !f.reminder }))}
              className={`sched-switch ${form.reminder ? "on" : ""}`}
            >
              <span className="sched-switch-knob" />
            </button>
          </div>

          <div className="flex gap-2 justify-end mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="saas-btn-primary px-4 py-2 text-sm"
              disabled={!form.title.trim()}
            >
              Save event
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

/* ── Slide wrapper for prev/next ── */
function SlidePane({
  slideKey,
  direction,
  children,
}: {
  slideKey: string;
  direction: SlideDir;
  children: React.ReactNode;
}) {
  const animClass =
    direction === "left"
      ? "sched-slide-from-right"
      : direction === "right"
        ? "sched-slide-from-left"
        : "";

  return (
    <div key={slideKey} className={`sched-slide-pane ${animClass}`}>
      {children}
    </div>
  );
}

/* ── Main page ── */
export default function SchedulerPage() {
  const [view, setView] = useState<ViewMode>("week");
  const [cursor, setCursor] = useState(() => new Date());
  const [events, setEvents] = useState<SchedEvent[]>(() => seedEvents());
  const [dayNotes, setDayNotes] = useState<Record<string, string>>(() => {
    const todayIso = toISODate(new Date());
    return { [todayIso]: "Prep for the demo. Review deck slides, send agenda to attendees." };
  });
  const [slideDir, setSlideDir] = useState<SlideDir>("none");
  const [modal, setModal] = useState<AddEventForm | null>(null);

  const setDayNote = useCallback((iso: string, value: string) => {
    setDayNotes((prev) => ({ ...prev, [iso]: value }));
  }, []);

  const openAdd = useCallback((date: Date, time = "09:00") => {
    setModal({
      date: toISODate(date),
      time,
      title: "",
      reminder: false,
    });
  }, []);

  const saveEvent = (form: AddEventForm) => {
    const ev: SchedEvent = {
      id: `e-${Date.now()}`,
      title: form.title,
      startTime: form.time,
      date: form.date,
      itemType: "EVENT",
      status: "TODO",
      priority: "MEDIUM",
      reminder: form.reminder,
    };
    setEvents((prev) =>
      [...prev, ev].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      })
    );
    setModal(null);
  };

  const navigate = (dir: "prev" | "next" | "today") => {
    if (dir === "today") {
      setSlideDir("none");
      setCursor(new Date());
      return;
    }
    setSlideDir(dir === "next" ? "left" : "right");
    setCursor((prev) => {
      if (view === "day") return addDays(prev, dir === "next" ? 1 : -1);
      if (view === "week") return addDays(prev, dir === "next" ? 7 : -7);
      return addMonths(prev, dir === "next" ? 1 : -1);
    });
  };

  const rangeLabel = useMemo(() => {
    if (view === "day") {
      return cursor.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    if (view === "week") {
      const start = startOfWeek(cursor);
      const end = addDays(start, 6);
      return formatRangeLabel(start, end);
    }
    return cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [view, cursor]);

  const slideKey =
    view === "day"
      ? toISODate(cursor)
      : view === "week"
        ? toISODate(startOfWeek(cursor))
        : `${cursor.getFullYear()}-${cursor.getMonth()}`;

  return (
    <div className="animate-fade-slide-up">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="accent-bar">
          <h1 className="text-2xl font-bold tracking-tight">Scheduler</h1>
        </div>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
          {(["day", "week", "month"] as ViewMode[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setSlideDir("none");
                setView(v);
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${view === v ? "text-white" : "text-text-secondary hover:text-text-primary"}`}
              style={view === v ? { background: "var(--accent-indigo)" } : {}}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Nav header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex flex-col min-w-0">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            {rangeLabel}
          </h2>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Click a day to expand · double-click to add an event
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate("prev")}
            className="px-3 py-1.5 rounded text-sm font-medium"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={() => navigate("today")}
            className="px-3 py-1.5 rounded text-sm font-medium"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => navigate("next")}
            className="px-3 py-1.5 rounded text-sm font-medium"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
          >
            Next →
          </button>
        </div>
      </div>

      <div className="sched-slide-viewport">
        <SlidePane slideKey={slideKey} direction={slideDir}>
          {view === "week" && (
            <WeekView
              cursor={cursor}
              events={events}
              dayNotes={dayNotes}
              onAdd={openAdd}
              onSetNote={setDayNote}
            />
          )}
          {view === "day" && (
            <DayView cursor={cursor} events={events} onAdd={openAdd} />
          )}
          {view === "month" && (
            <MonthView cursor={cursor} events={events} onAdd={openAdd} />
          )}
        </SlidePane>
      </div>

      {modal && (
        <AddEventModal
          initial={modal}
          onClose={() => setModal(null)}
          onSave={saveEvent}
        />
      )}
    </div>
  );
}

/* ── Week view (click-to-expand day) ──
   Layout: 7 columns. Click a day → that cell widens (~2x) and the
   other 6 stay in the same row but shrink. A second row appears below
   with the day's full plan + notes, so nothing is hidden.              */
function WeekView({
  cursor,
  events,
  dayNotes,
  onAdd,
  onSetNote,
}: {
  cursor: Date;
  events: SchedEvent[];
  dayNotes: Record<string, string>;
  onAdd: (date: Date, time?: string) => void;
  onSetNote: (iso: string, value: string) => void;
}) {
  const weekStart = startOfWeek(cursor);
  const now = new Date();
  const [expandedIso, setExpandedIso] = useState<string | null>(null);

  const days = useMemo(
    () => DAYS.map((label, i) => {
      const date = addDays(weekStart, i);
      const iso = toISODate(date);
      const dayEvents = events
        .filter((e) => e.date === iso)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      return { label, date, iso, dayEvents };
    }),
    [weekStart, events]
  );

  const expandedDay = expandedIso ? days.find((d) => d.iso === expandedIso) ?? null : null;

  return (
    <div className="sched-week-anim">
      {/* Row 1: 7 day cells. The expanded one widens (~2x) and the others shrink. */}
      <div
        className="sched-week-row"
        style={
          expandedIso
            ? {
                gridTemplateColumns: `${getColumnWeights(DAYS.indexOf(days.find((d) => d.iso === expandedIso)!.label)).join(" ")}`,
              }
            : { gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }
        }
      >
        {days.map((d) => {
          const isToday = d.date.toDateString() === now.toDateString();
          const isExpanded = d.iso === expandedIso;
          return (
            <button
              key={d.iso}
              type="button"
              className={`sched-week-cell ${isToday ? "is-today" : ""} ${isExpanded ? "is-expanded" : ""}`}
              onClick={() => setExpandedIso(isExpanded ? null : d.iso)}
              aria-label={`${d.label} ${d.date.getDate()} — ${d.dayEvents.length} event${d.dayEvents.length === 1 ? "" : "s"}`}
              aria-expanded={isExpanded}
              onDoubleClick={(e) => {
                e.preventDefault();
                onAdd(d.date);
              }}
            >
              <div className="sched-week-cell-header">
                {isToday && <span className="sched-week-cell-today-bar" aria-hidden />}
                <span className={`sched-week-cell-day ${isToday ? "is-today" : ""}`}>{d.label}</span>
                <span className={`sched-week-cell-num ${isToday ? "is-today" : ""}`}>
                  {d.date.getDate()}
                </span>
              </div>

              <div className="sched-week-cell-events">
                {d.dayEvents.slice(0, isExpanded ? 6 : 4).map((ev) => (
                  <div
                    key={ev.id}
                    className="sched-week-cell-event"
                    style={{ borderLeftColor: TYPE_COLORS[ev.itemType] }}
                  >
                    <div className="sched-week-cell-event-row">
                      <span className="sched-week-cell-event-time tnum">{ev.startTime}</span>
                      {ev.reminder && <span className="sched-week-cell-event-bell" aria-hidden>🔔</span>}
                    </div>
                    <div className="sched-week-cell-event-title">{ev.title}</div>
                  </div>
                ))}
                {d.dayEvents.length === 0 && (
                  <div className="sched-week-cell-empty">No events</div>
                )}
                {!isExpanded && d.dayEvents.length > 4 && (
                  <div className="sched-week-cell-more">+{d.dayEvents.length - 4} more</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Row 2: only renders when a day is expanded. Sits below the 7 cells,
          takes the full row width. Shows the day's full plan + notes. */}
      <div className={`sched-week-row2 ${expandedDay ? "is-open" : ""}`} aria-hidden={!expandedDay}>
        {expandedDay && (
          <DayPlanPanel
            dayLabel={expandedDay.label}
            date={expandedDay.date}
            events={expandedDay.dayEvents}
            note={dayNotes[expandedDay.iso] || ""}
            onSetNote={(v) => onSetNote(expandedDay.iso, v)}
            onAddEvent={(time) => onAdd(expandedDay.date, time)}
            onClose={() => setExpandedIso(null)}
          />
        )}
      </div>
    </div>
  );
}

/* Returns grid-template-columns track sizes so the expanded cell is ~2x
   the width of the others. 7 tracks total. */
function getColumnWeights(expandedIndex: number): string[] {
  const SMALL = "minmax(0, 0.6fr)";
  const BIG = "minmax(0, 2.2fr)";
  return Array.from({ length: 7 }, (_, i) => (i === expandedIndex ? BIG : SMALL));
}

/* ── Day plan row (under the 7-cell row, full width) ── */
function DayPlanPanel({
  dayLabel,
  date,
  events,
  note,
  onSetNote,
  onAddEvent,
  onClose,
}: {
  dayLabel: string;
  date: Date;
  events: SchedEvent[];
  note: string;
  onSetNote: (v: string) => void;
  onAddEvent: (time: string) => void;
  onClose: () => void;
}) {
  const totalEvents = events.length;

  // Suggest the next free hour for the "Add event" button
  const nextFreeHour = useMemo(() => {
    const hours = Array.from({ length: 16 }, (_, i) => i + 6);
    const occupied = new Set(events.map((e) => parseInt(e.startTime.split(":")[0], 10)));
    for (const h of hours) if (!occupied.has(h)) return String(h).padStart(2, "0") + ":00";
    return "09:00";
  }, [events]);

  return (
    <div className="sched-day-plan">
      <div className="sched-day-plan-header">
        <div>
          <div className="sched-day-plan-day">
            {dayLabel} · {date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
          <div className="sched-day-plan-sub">
            {totalEvents === 0
              ? "Nothing scheduled"
              : `${totalEvents} event${totalEvents === 1 ? "" : "s"} scheduled`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAddEvent(nextFreeHour)}
            className="saas-btn-primary px-3 py-1.5 text-sm flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Add event
          </button>
          <button
            type="button"
            onClick={onClose}
            className="sched-day-plan-close"
            aria-label="Collapse day plan"
            title="Collapse"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="sched-day-plan-body">
        {/* Event cards (compact grid) */}
        <div className="sched-day-plan-events">
          {totalEvents === 0 ? (
            <div className="sched-day-plan-empty">
              No events for this day. Click <strong>Add event</strong> to schedule one.
            </div>
          ) : (
            events.map((ev) => (
              <div
                key={ev.id}
                className="sched-day-plan-event"
                style={{ borderLeftColor: TYPE_COLORS[ev.itemType] }}
              >
                <div className="sched-day-plan-event-row">
                  <span className="sched-day-plan-event-time tnum">
                    {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ""}
                  </span>
                  <span className="sched-day-plan-event-type">{ev.itemType.toLowerCase()}</span>
                </div>
                <div className="sched-day-plan-event-title">{ev.title}</div>
                {ev.notes && (
                  <div className="sched-day-plan-event-notes">{ev.notes}</div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Notes */}
        <div className="sched-day-plan-notes">
          <div className="sched-day-plan-notes-header">
            <div className="sched-day-plan-notes-title">Notes</div>
            <div className="sched-day-plan-notes-hint">Auto-saves</div>
          </div>
          <textarea
            className="sched-day-plan-notes-area"
            value={note}
            onChange={(e) => onSetNote(e.target.value)}
            placeholder="Goals, prep, reminders…"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Day view ── */
function DayView({
  cursor,
  events,
  onAdd,
}: {
  cursor: Date;
  events: SchedEvent[];
  onAdd: (date: Date, time?: string) => void;
}) {
  const iso = toISODate(cursor);
  const dayEvents = events
    .filter((e) => e.date === iso)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 – 20:00

  return (
    <div
      className="glass p-4 sched-day-cell"
      onDoubleClick={() => onAdd(cursor)}
      title="Double-click to add event"
    >
      <div className="space-y-1">
        {hours.map((h) => {
          const label = `${String(h).padStart(2, "0")}:00`;
          const hourEvents = dayEvents.filter((e) => {
            const hour = parseInt(e.startTime.split(":")[0], 10);
            return hour === h;
          });
          return (
            <div
              key={h}
              className="flex gap-3 min-h-[48px] border-b py-1"
              style={{ borderColor: "var(--border)" }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onAdd(cursor, label);
              }}
            >
              <span className="tnum text-xs w-12 shrink-0 pt-1" style={{ color: "var(--text-tertiary)" }}>
                {label}
              </span>
              <div className="flex-1 space-y-1">
                {hourEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-md"
                    style={{
                      background: "var(--bg-hover)",
                      borderLeft: `3px solid ${TYPE_COLORS[ev.itemType]}`,
                    }}
                    onDoubleClick={(e) => e.stopPropagation()}
                  >
                    <span className="tnum text-sm w-16 shrink-0" style={{ color: "var(--text-secondary)" }}>
                      {ev.startTime}
                      {ev.endTime ? ` – ${ev.endTime}` : ""}
                    </span>
                    <span className="text-sm font-medium flex-1">{ev.title}</span>
                    {ev.reminder && (
                      <span title="Reminder on" className="text-xs" style={{ color: "var(--accent-amber)" }}>🔔</span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--bg-primary)", color: "var(--text-tertiary)" }}>
                      {ev.itemType.toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {dayEvents.length === 0 && (
          <p className="text-sm text-center py-6" style={{ color: "var(--text-tertiary)" }}>
            No events — double-click to add one
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Month view ── */
function MonthView({
  cursor,
  events,
  onAdd,
}: {
  cursor: Date;
  events: SchedEvent[];
  onAdd: (date: Date, time?: string) => void;
}) {
  const monthStart = startOfMonth(cursor);
  const gridStart = startOfWeek(monthStart);
  const now = new Date();
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <div className="glass p-4">
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-xs text-text-tertiary text-center py-2 font-medium">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((dayDate) => {
          const iso = toISODate(dayDate);
          const inMonth = dayDate.getMonth() === cursor.getMonth();
          const isToday = dayDate.toDateString() === now.toDateString();
          const dayEvents = events
            .filter((e) => e.date === iso)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <div
              key={iso}
              className="sched-day-cell min-h-[88px] p-1.5 rounded border"
              style={{
                borderColor: isToday ? "var(--accent-indigo)" : "var(--border)",
                opacity: inMonth ? 1 : 0.4,
                background: isToday ? "color-mix(in srgb, var(--accent-indigo) 8%, transparent)" : "transparent",
              }}
              onDoubleClick={() => onAdd(dayDate)}
              title="Double-click to add event"
            >
              <div
                className={`text-xs mb-1 tnum ${isToday ? "font-bold" : ""}`}
                style={{ color: isToday ? "var(--accent-indigo)" : "var(--text-tertiary)" }}
              >
                {dayDate.getDate()}
              </div>
              {dayEvents.slice(0, 3).map((ev) => (
                <div
                  key={ev.id}
                  className="text-xs truncate px-1 py-0.5 rounded mb-0.5 flex items-center gap-0.5"
                  style={{ background: "var(--bg-hover)", borderLeft: `2px solid ${TYPE_COLORS[ev.itemType]}` }}
                  onDoubleClick={(e) => e.stopPropagation()}
                >
                  {ev.reminder && <span style={{ fontSize: 8 }}>🔔</span>}
                  <span className="truncate">{ev.title}</span>
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs px-1" style={{ color: "var(--text-tertiary)" }}>
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
