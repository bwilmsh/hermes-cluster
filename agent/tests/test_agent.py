"""Tests for the agent service. Pass with NO API key and NO backend running."""
import json
import pytest
from datetime import datetime, timedelta

# ─── Router (keyword classifier — offline mode) ──────────────────────────

def test_router_booking_keyword():
    from router import _keyword_classify
    result = _keyword_classify("Can you book a meeting for tomorrow?")
    assert result["route"] == "booking"

def test_router_customer_keyword():
    from router import _keyword_classify
    result = _keyword_classify("Tell me about this customer's preferences")
    assert result["route"] == "customer"

def test_router_general_keyword():
    from router import _keyword_classify
    result = _keyword_classify("Plan my day for me")
    assert result["route"] == "general"

def test_router_reschedule():
    from router import _keyword_classify
    result = _keyword_classify("I need to reschedule my appointment")
    assert result["route"] == "booking"

# ─── Widget sentinel ──────────────────────────────────────────────────────

def test_widget_emit_format():
    from widget import emit_widget
    s = emit_widget({"type": "stat", "label": "Tasks", "value": 5})
    assert s.startswith("[WIDGET]{") and s.endswith("}[/WIDGET]")

def test_widget_parse_roundtrip():
    from widget import emit_widget, parse_widgets
    text = f"Here's your summary. {emit_widget({'type': 'stat', 'label': 'Tasks done', 'value': 3, 'trend': '+2'})} Nice work!"
    widgets = parse_widgets(text)
    assert len(widgets) == 1
    assert widgets[0]["type"] == "stat"
    assert widgets[0]["value"] == 3

def test_widget_strip():
    from widget import emit_widget, strip_widgets
    text = f"Hello {emit_widget({'type': 'text', 'content': 'hi'})} World"
    stripped = strip_widgets(text)
    assert "[WIDGET]" not in stripped
    assert "Hello" in stripped and "World" in stripped

def test_widget_multi_parse():
    from widget import emit_widget, parse_widgets
    text = emit_widget({"type": "stat", "label": "A", "value": 1}) + emit_widget({"type": "agents_grid", "agents": [{"name": "Bot", "role": "general", "color": "teal"}]})
    widgets = parse_widgets(text)
    assert len(widgets) == 2

# ─── Habit scheduler ─────────────────────────────────────────────────────

def test_habit_scheduler_daily():
    from habit_scheduler import compute_occurrences
    habit = {"frequency": "DAILY", "name": "Read", "durationMinutes": 30, "timeRangeStart": "21:00"}
    from_d = datetime(2026, 6, 1)
    to_d = datetime(2026, 6, 7)
    occ = compute_occurrences(habit, from_d, to_d)
    assert len(occ) == 7  # 7 days, daily

def test_habit_scheduler_weekdays():
    from habit_scheduler import compute_occurrences
    # June 1 2026 is a Monday. June 1-7 = Mon-Sun = 5 weekdays.
    habit = {"frequency": "WEEKDAYS", "name": "Standup"}
    occ = compute_occurrences(habit, datetime(2026, 6, 1), datetime(2026, 6, 7))
    assert len(occ) == 5  # Mon-Fri

def test_habit_scheduler_weekly():
    from habit_scheduler import compute_occurrences
    # Weekly on Mon/Wed/Fri over 7 days = 3 occurrences
    habit = {"frequency": "WEEKLY", "name": "Gym", "daysOfWeek": ["MON", "WED", "FRI"]}
    occ = compute_occurrences(habit, datetime(2026, 6, 1), datetime(2026, 6, 7))
    assert len(occ) == 3

def test_habit_scheduler_custom_no_rrule():
    from habit_scheduler import compute_occurrences
    # CUSTOM with no rrule falls back to daysOfWeek
    habit = {"frequency": "CUSTOM", "name": "Custom", "daysOfWeek": ["TUE", "THU"]}
    occ = compute_occurrences(habit, datetime(2026, 6, 1), datetime(2026, 6, 7))
    assert len(occ) == 2  # Tue + Thu

def test_habit_event_payload():
    from habit_scheduler import make_event_payload
    habit = {"name": "Read", "durationMinutes": 30, "timeRangeStart": "21:00", "id": "h1", "showAsBusy": True, "priorityLevel": "HIGH"}
    payload = make_event_payload(habit, datetime(2026, 6, 1))
    assert payload["title"] == "Read"
    assert payload["itemType"] == "HABIT"
    assert payload["habitLocked"] is True
    assert "2026-06-01T21:00:00" in payload["startTime"]

# ─── Scheduler brain ─────────────────────────────────────────────────────

def test_scheduler_brain_overdue_first():
    from scheduler_brain import plan_day
    now = datetime(2026, 6, 28, 9, 0)
    overdue_task = {"title": "Old task", "status": "TODO", "startTime": "2026-06-20T09:00:00Z"}
    result = plan_day([], [overdue_task], [], [], now)
    assert "overdue" in result["summary"].lower()
    assert result["blocks"][0]["title"].startswith("⚠")

def test_scheduler_brain_habit_at_ideal_time():
    from scheduler_brain import plan_day
    now = datetime(2026, 6, 28, 6, 0)
    habit = {"name": "Meditate", "idealTime": "MORNING", "durationMinutes": 15, "active": True}
    result = plan_day([], [], [habit], [], now)
    habit_blocks = [b for b in result["blocks"] if b["type"] == "habit"]
    assert len(habit_blocks) >= 1
    assert "Meditate" in habit_blocks[0]["title"]
    assert "08:00" in habit_blocks[0]["start"]

def test_scheduler_brain_respects_existing_events():
    from scheduler_brain import plan_day
    now = datetime(2026, 6, 28, 6, 0)
    event = {"title": "Morning meeting", "startTime": "2026-06-28T08:00:00Z", "endTime": "2026-06-28T09:00:00Z", "status": "TODO"}
    habit = {"name": "Meditate", "idealTime": "MORNING", "durationMinutes": 15, "active": True}
    result = plan_day([event], [], [habit], [], now)
    # Habit at 8am conflicts with the 8-9am event, so it shouldn't be scheduled at 8am.
    habit_blocks = [b for b in result["blocks"] if b["type"] == "habit"]
    # The habit should NOT be at 08:00 since there's a conflict.
    assert all("08:00" not in b["start"] for b in habit_blocks) or len(habit_blocks) == 0

def test_scheduler_brain_urgent_due_date():
    from scheduler_brain import plan_day
    now = datetime(2026, 6, 28, 9, 0)
    due = {"title": "Final exam", "dueDate": "2026-06-30T09:00:00Z", "priority": "URGENT", "status": "PENDING"}
    result = plan_day([], [], [], [due], now)
    urgent_blocks = [b for b in result["blocks"] if b["type"] == "due_date"]
    assert len(urgent_blocks) >= 1

# ─── Tool registry ───────────────────────────────────────────────────────

def test_tools_registry_schema_valid():
    from tools import get_available_tools
    tools = get_available_tools()
    assert len(tools) >= 7
    for t in tools:
        assert t["type"] == "function"
        assert "name" in t["function"]
        assert "parameters" in t["function"]
        assert t["function"]["parameters"]["type"] == "object"

@pytest.mark.asyncio
async def test_tool_send_notification():
    from tools import execute_tool
    result = await execute_tool("send_notification", {"message": "Hello"}, "fake-token")
    data = json.loads(result)
    assert data["ok"] is True
    assert data["message"] == "Hello"

@pytest.mark.asyncio
async def test_tool_unknown():
    from tools import execute_tool
    result = await execute_tool("nonexistent_tool", {}, "fake-token")
    data = json.loads(result)
    assert "error" in data
