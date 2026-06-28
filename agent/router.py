"""Manager Router: classify each incoming message and route to a specialized worker.

Workers:
- booking:  user wants to schedule/book/reschedule/cancel an appointment
- customer:  user asks about a customer, preferences, or memory/profile
- general:   everything else (day planning, task management, habit scheduling, Q&A)

Returns {"route": "booking|customer|general", "reason": "..."}.

If no API key: falls back to a keyword-based classifier so the service stays useful in dev.
"""
import re
import json
from client import is_offline, get_config

MANAGER_PROMPT = """You are the Manager Agent in a multi-agent system.
Your job is to choose the best worker based on the latest user message.

Workers:
- booking: use when the user wants to schedule/book/reschedule/cancel an appointment.
- customer: use when the user asks about a customer, their preferences, or memory/profile details.
- general: everything else.

Return ONLY compact JSON:
{"route":"booking|customer|general","reason":"short reason"}
"""

BOOKING_RE = re.compile(r"\b(book|schedule|appoint|reschedule|cancel|meeting|call|book)\b", re.I)
CUSTOMER_RE = re.compile(r"\b(customer|profile|preference|memory|who is|tell me about)\b", re.I)

def _keyword_classify(message: str) -> dict:
    if BOOKING_RE.search(message):
        return {"route": "booking", "reason": "keyword: scheduling/booking intent"}
    if CUSTOMER_RE.search(message):
        return {"route": "customer", "reason": "keyword: customer/profile lookup"}
    return {"route": "general", "reason": "keyword: default to general"}

async def route_message(message: str, business_context: str = "") -> dict:
    """Classify the message. Uses LLM if available, keyword fallback otherwise."""
    if is_offline():
        return _keyword_classify(message)

    cfg = get_config()
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=cfg["api_key"], base_url=cfg["base_url"])
        resp = await client.chat.completions.create(
            model=cfg["model"],
            messages=[
                {"role": "system", "content": MANAGER_PROMPT},
                {"role": "user", "content": f"Business context: {business_context}\nMessage: {message}"},
            ],
            temperature=0,
            max_tokens=100,
        )
        text = resp.choices[0].message.content or ""
        # Extract JSON from the response.
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(text[start:end])
        return _keyword_classify(message)
    except Exception:
        return _keyword_classify(message)
