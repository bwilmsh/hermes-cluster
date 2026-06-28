"""Tool registry — tools the agent can call to interact with the backend REST API.
Each tool calls the backend at BACKEND_URL via httpx with the user's auth token."""

import json
import httpx
from typing import Any

BACKEND_URL = "http://localhost:3001"

def get_available_tools() -> list[dict]:
    """Return OpenAI-format tool schemas."""
    return [
        {
            "type": "function",
            "function": {
                "name": "list_events",
                "description": "List calendar events/tasks in a date range. Use this to check what's already scheduled before suggesting new times.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "from": {"type": "string", "description": "ISO 8601 start date (e.g. 2026-06-28T00:00:00Z)"},
                        "to": {"type": "string", "description": "ISO 8601 end date"},
                    },
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "create_event",
                "description": "Create a new event or task on the calendar.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "startTime": {"type": "string", "description": "ISO 8601"},
                        "endTime": {"type": "string"},
                        "itemType": {"type": "string", "enum": ["EVENT", "TASK", "APPOINTMENT", "HABIT"], "default": "TASK"},
                        "priority": {"type": "string", "enum": ["LOW", "MEDIUM", "HIGH"], "default": "MEDIUM"},
                        "tags": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": ["title", "startTime"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "complete_task",
                "description": "Mark a task as done by its event ID.",
                "parameters": {"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]},
            },
        },
        {
            "type": "function",
            "function": {
                "name": "list_due_dates",
                "description": "List upcoming due dates / assignments. Use this to surface overdue items.",
                "parameters": {"type": "object", "properties": {}},
            },
        },
        {
            "type": "function",
            "function": {
                "name": "create_due_date",
                "description": "Create a new due date / assignment.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "dueDate": {"type": "string", "description": "ISO 8601 date"},
                        "dueTime": {"type": "string", "description": "e.g. 14:00"},
                        "priority": {"type": "string", "enum": ["LOW", "MEDIUM", "HIGH", "URGENT"], "default": "MEDIUM"},
                        "category": {"type": "string", "enum": ["ASSIGNMENT", "EXAM", "WORK", "PERSONAL"], "default": "PERSONAL"},
                    },
                    "required": ["title", "dueDate"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "list_habits",
                "description": "List the user's active habits (with frequency, ideal time, streak).",
                "parameters": {"type": "object", "properties": {}},
            },
        },
        {
            "type": "function",
            "function": {
                "name": "send_email",
                "description": "Schedule an email to be sent.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "to": {"type": "string"},
                        "subject": {"type": "string"},
                        "body": {"type": "string"},
                    },
                    "required": ["to", "subject", "body"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "send_notification",
                "description": "Send a notification to the user (logged, no real push in v1).",
                "parameters": {"type": "object", "properties": {"message": {"type": "string"}}, "required": ["message"]},
            },
        },
    ]


async def execute_tool(name: str, args: dict[str, Any], auth_token: str) -> str:
    """Dispatch a tool call to the backend REST API. Returns a JSON string result."""
    headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            if name == "list_events":
                params = {k: v for k, v in args.items() if v is not None}
                r = await client.get(f"{BACKEND_URL}/api/scheduler/events", params=params, headers=headers)
                return r.text
            elif name == "create_event":
                r = await client.post(f"{BACKEND_URL}/api/scheduler/events", json=args, headers=headers)
                return r.text
            elif name == "complete_task":
                r = await client.put(f"{BACKEND_URL}/api/scheduler/events/{args['id']}", json={"status": "DONE"}, headers=headers)
                return r.text
            elif name == "list_due_dates":
                r = await client.get(f"{BACKEND_URL}/api/due-dates", headers=headers)
                return r.text
            elif name == "create_due_date":
                r = await client.post(f"{BACKEND_URL}/api/due-dates", json=args, headers=headers)
                return r.text
            elif name == "list_habits":
                r = await client.get(f"{BACKEND_URL}/api/habits", headers=headers)
                return r.text
            elif name == "send_email":
                payload = {**args, "sendAt": "2026-01-01T00:00:00Z"}
                r = await client.post(f"{BACKEND_URL}/api/scheduled-emails", json=payload, headers=headers)
                return r.text
            elif name == "send_notification":
                return json.dumps({"ok": True, "message": args.get("message", ""), "logged": True})
            else:
                return json.dumps({"error": f"Unknown tool: {name}"})
    except httpx.ConnectError:
        return json.dumps({"error": "Backend service unavailable — the tool call could not complete. Inform the user."})
    except Exception as e:
        return json.dumps({"error": f"Tool execution failed: {type(e).__name__}: {e}"})
