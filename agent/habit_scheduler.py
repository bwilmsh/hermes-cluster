"""Habit Scheduler — auto-schedule habits into Event + HabitEntry rows.
Computes occurrences for a date range based on habit frequency."""

from datetime import datetime, timedelta, date
from typing import Literal

def compute_occurrences(habit: dict, from_date: datetime, to_date: datetime) -> list[datetime]:
    """Compute scheduled dates for a habit in a date range.

    DAILY: every day
    WEEKDAYS: Mon-Fri
    WEEKLY: daysOfWeek (e.g. ["MON", "WED", "FRI"])
    CUSTOM: rrule if present, else daysOfWeek
    """
    freq = habit.get("frequency", "DAILY")
    days = habit.get("daysOfWeek", [])
    occurrences: list[datetime] = []
    cur = from_date
    day_map = {"SUN": 6, "MON": 0, "TUE": 1, "WED": 2, "THU": 3, "FRI": 4, "SAT": 5}

    while cur <= to_date:
        weekday = cur.weekday()  # 0=Mon .. 6=Sun
        applies = False
        if freq == "DAILY":
            applies = True
        elif freq == "WEEKDAYS":
            applies = weekday <= 4
        elif freq in ("WEEKLY", "CUSTOM"):
            applies = any(day_map.get(d) == weekday for d in days)
        if applies:
            occurrences.append(cur)
        cur += timedelta(days=1)
    return occurrences

def make_event_payload(habit: dict, occurrence: datetime) -> dict:
    """Build the Event creation payload for a habit occurrence."""
    duration = habit.get("durationMinutes", 30)
    time_str = habit.get("timeRangeStart") or habit.get("timeOfDay") or "09:00"
    hour, minute = (int(x) for x in time_str.split(":")[:2])
    start = occurrence.replace(hour=hour, minute=minute, second=0, microsecond=0)
    end = start + timedelta(minutes=duration)
    return {
        "title": habit.get("name", "Habit"),
        "startTime": start.isoformat() + "Z",
        "endTime": end.isoformat() + "Z",
        "itemType": "HABIT",
        "status": "TODO",
        "priority": "HIGH" if habit.get("priorityLevel") == "HIGH" else "MEDIUM",
        "habitId": habit.get("id"),
        "habitOccurrenceAt": occurrence.isoformat() + "Z",
        "habitLocked": True,
        "showAsBusy": habit.get("showAsBusy", True),
    }

def make_entry_payload(habit: dict, occurrence: datetime, event_id: str) -> dict:
    """Build the HabitEntry creation payload."""
    duration = habit.get("durationMinutes", 30)
    time_str = habit.get("timeRangeStart") or "09:00"
    hour, minute = (int(x) for x in time_str.split(":")[:2])
    start = occurrence.replace(hour=hour, minute=minute, second=0, microsecond=0)
    end = start + timedelta(minutes=duration)
    return {
        "habitId": habit["id"],
        "scheduledDate": occurrence.isoformat() + "Z",
        "scheduledStart": start.isoformat() + "Z",
        "scheduledEnd": end.isoformat() + "Z",
        "status": "SCHEDULED",
        "eventId": event_id,
    }
