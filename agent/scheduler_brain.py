"""Scheduler Brain — pure day-planning logic. No LLM call.
Used as context for system prompts and as a callable tool.

Rules:
1. Overdue tasks at top.
2. Urgent due dates flagged.
3. Habits scheduled at their idealTime window if free.
4. Lunch break if >4h of meetings.
5. Buffer between meetings.
"""

from datetime import datetime, timedelta
from dataclasses import dataclass, field, asdict
from typing import Literal

@dataclass
class Block:
    title: str
    start: str
    end: str
    type: str  # "task" | "event" | "habit" | "break" | "due_date"
    reason: str = ""

@dataclass
class DayPlan:
    summary: str
    blocks: list[dict] = field(default_factory=list)

def _iso(dt: datetime) -> str:
    return dt.isoformat()

def plan_day(
    today_events: list[dict],
    tasks: list[dict],
    habits: list[dict],
    due_dates: list[dict],
    now: datetime | None = None,
) -> dict:
    """Produce a proposed day schedule. Pure logic, no side effects."""
    if now is None:
        now = datetime.now()

    blocks: list[Block] = []
    overdue: list[dict] = []
    urgent: list[dict] = []

    # 1. Surface overdue tasks
    for t in tasks:
        status = t.get("status", "TODO")
        if status == "DONE":
            continue
        # A task is overdue if it has a start_time before today and isn't done.
        start = t.get("startTime") or t.get("start_time")
        if start:
            try:
                st = datetime.fromisoformat(str(start).replace("Z", ""))
                if st < now and status != "DONE":
                    overdue.append(t)
            except Exception:
                pass

    for d in due_dates:
        if d.get("status") == "COMPLETED":
            continue
        due = d.get("dueDate") or d.get("due_date")
        if due:
            try:
                dt = datetime.fromisoformat(str(due).replace("Z", ""))
                if dt < now:
                    overdue.append({"title": d["title"], "type": "due_date", "priority": d.get("priority", "MEDIUM")})
                elif d.get("priority") == "URGENT":
                    urgent.append(d)
            except Exception:
                pass

    if overdue:
        summary_overdue = f"{len(overdue)} overdue item(s) — address these first:"
        for item in overdue[:5]:
            blocks.append(Block(
                title=f"⚠ {item['title']}",
                start="OVERDUE",
                end="",
                type="task" if item.get("type") != "due_date" else "due_date",
                reason="Overdue — high priority",
            ))
    else:
        summary_overdue = "No overdue items. "

    # 2. Existing events (fixed commitments)
    for ev in today_events:
        if ev.get("status") == "DONE":
            continue
        start = ev.get("startTime") or ev.get("start_time", "")
        end = ev.get("endTime") or ev.get("end_time", "")
        blocks.append(Block(
            title=ev.get("title", "Untitled"),
            start=str(start),
            end=str(end),
            type="event",
            reason="Already scheduled",
        ))

    # 3. Habits at ideal time
    ideal_hours = {"MORNING": 8, "AFTERNOON": 13, "EVENING": 19}
    for h in habits:
        if not h.get("active", True):
            continue
        hour = ideal_hours.get(h.get("idealTime", "MORNING"), 8)
        slot = now.replace(hour=hour, minute=0, second=0, microsecond=0)
        # Check if slot is free (no overlapping event)
        conflicting = False
        for b in blocks:
            if b.type == "event" and b.start:
                try:
                    bs = datetime.fromisoformat(b.start.replace("Z", ""))
                    be = datetime.fromisoformat(b.end.replace("Z", "")) if b.end else bs + timedelta(hours=1)
                    if bs <= slot <= be:
                        conflicting = True
                        break
                except Exception:
                    pass
        if not conflicting:
            duration = h.get("durationMinutes", 30)
            blocks.append(Block(
                title=f"🔮 {h['name']} (habit)",
                start=_iso(slot),
                end=_iso(slot + timedelta(minutes=duration)),
                type="habit",
                reason=f"Ideal {h.get('idealTime', 'MORNING')} time block, {duration}min",
            ))

    # 4. Urgent due dates
    for d in urgent[:3]:
        blocks.append(Block(
            title=f"� {d['title']} (URGENT due)",
            start="",
            end="",
            type="due_date",
            reason=f"Due {d.get('dueDate', 'soon')} — urgent priority",
        ))

    # 5. Lunch break if >4h of meetings
    event_minutes = 0
    for b in blocks:
        if b.type == "event" and b.start and b.end:
            try:
                bs = datetime.fromisoformat(b.start.replace("Z", ""))
                be = datetime.fromisoformat(b.end.replace("Z", ""))
                event_minutes += int((be - bs).total_seconds() / 60)
            except Exception:
                pass
    if event_minutes > 240:
        lunch = now.replace(hour=12, minute=30, second=0, microsecond=0)
        blocks.append(Block(title="🍽 Lunch break", start=_iso(lunch), end=_iso(lunch + timedelta(minutes=45)), type="break", reason="Auto-scheduled: >4h of meetings"))

    summary = summary_overdue + f" {len(blocks)} blocks planned. "
    if urgent:
        summary += f"{len(urgent)} urgent due date(s) flagged. "

    return {"summary": summary, "blocks": [asdict(b) for b in blocks]}
