"""Widget sentinel: emit [WIDGET]{...json...}[/WIDGET] in agent replies,
parsed by the frontend to render dashboard widgets.

Types and their JSON shapes:
  stat:         { "label": str, "value": str|num, "trend"?: str }
  agents_grid:  { "agents": [{"name","role","color"}] }
  activity_feed:{ "items": [{"text","when"}] }
  agent_memory: { "agent_id": str, "memory": str }
  text:         { "content": str }
"""
import json
import re

SENTINEL_RE = re.compile(r"\[WIDGET\](\{.*?\})\[/WIDGET\]", re.DOTALL)

def emit_widget(widget: dict) -> str:
    """Return the sentinel string for a widget dict."""
    return f"[WIDGET]{json.dumps(widget)}[/WIDGET]"

def parse_widgets(text: str) -> list[dict]:
    """Extract all widget dicts from sentinel matches in text."""
    widgets = []
    for m in SENTINEL_RE.finditer(text):
        try:
            widgets.append(json.loads(m.group(1)))
        except json.JSONDecodeError:
            continue
    return widgets

def strip_widgets(text: str) -> str:
    """Remove widget sentinels from text, leaving clean display content."""
    return SENTINEL_RE.sub("", text).strip()

VALID_TYPES = {"stat", "agents_grid", "activity_feed", "agent_memory", "text"}

def validate_widget(w: dict) -> bool:
    return w.get("type") in VALID_TYPES
