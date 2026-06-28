"""AI Studio Scheduler — Agent Service (FastAPI)
The AI scheduling brain: manager-router, tool registry, day-planning logic,
habit auto-scheduling, widget sentinel, SSE streaming, offline-mode fallback."""

import json
import os
from datetime import datetime
from typing import AsyncIterator
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

load_dotenv()

from client import stream_chat, get_config, is_offline
from router import route_message
from prompts import (
    build_system_prompt,
    build_cluster_system_prompt,
    build_group_system_prompt,
    QUESTION_GENERATION_PROMPT,
)
from tools import get_available_tools, execute_tool
from widget import parse_widgets, strip_widgets
from scheduler_brain import plan_day

app = FastAPI(title="AI Studio Scheduler — Agent Service", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Models ──────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    agentId: str = ""
    agentName: str = "AI Planner"
    agentRole: str = "general"
    message: str
    history: list[dict] = []
    businessContext: str = ""
    tools: list[dict] | None = None
    auth_token: str = ""  # passed by backend proxy

class GroupChatRequest(BaseModel):
    message: str
    mentionedAgents: list[dict] = []
    activeAgentId: str = ""
    activeAgentName: str = "Agent"
    groupId: str = ""
    history: list[dict] = []
    auth_token: str = ""

class ClusterRequest(BaseModel):
    message: str
    history: list[dict] = []
    businessContext: str = ""
    auth_token: str = ""

class QuestionRequest(BaseModel):
    context: str = ""

# ─── SSE helpers ────────────────────────────────────────────────────────

def sse_event(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"

# ─── Endpoints ───────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    cfg = get_config()
    from urllib.parse import urlparse
    provider = "none"
    if cfg["api_key"]:
        try:
            provider = urlparse(cfg["base_url"]).hostname or cfg["base_url"]
        except Exception:
            provider = cfg["base_url"]
    return {
        "status": "ok",
        "model": cfg["model"] if cfg["api_key"] else "none (offline mode)",
        "provider": provider,
        "offline": is_offline(),
    }

async def _chat_stream(req: ChatRequest) -> AsyncIterator[str]:
    """Core chat: route → system prompt → stream tokens → handle tools → done."""
    # 1. Manager router
    route = await route_message(req.message, req.businessContext)
    yield sse_event({"type": "route", "route": route["route"], "reason": route["reason"]})

    # 2. Build messages with system prompt
    sys_prompt = build_system_prompt(req.agentName, req.businessContext, req.agentRole)
    messages = [{"role": "system", "content": sys_prompt}] + req.history + [{"role": "user", "content": req.message}]

    # 3. Stream with tools
    tools = get_available_tools()
    full_text = ""
    async for ev in stream_chat(messages, tools):
        if ev.type == "token":
            full_text += ev.content
            yield sse_event({"type": "token", "content": ev.content})
        elif ev.type == "tool_call":
            # Execute the tool
            result = await execute_tool(ev.tool_name, ev.tool_args or {}, req.auth_token)
            # Feed the result back into the conversation
            messages.append({"role": "assistant", "content": None, "tool_calls": [{"id": "call_1", "type": "function", "function": {"name": ev.tool_name, "arguments": json.dumps(ev.tool_args or {})}}]})
            messages.append({"role": "tool", "tool_call_id": "call_1", "content": result})
            yield sse_event({"type": "tool", "name": ev.tool_name, "result": result[:200]})
        elif ev.type == "final":
            full_text = ev.content or full_text

    # 4. Extract widgets from the final text
    for w in parse_widgets(full_text):
        yield sse_event({"type": "widget", "widget": w})

    # 5. Done
    yield sse_event({"type": "done"})


@app.post("/chat")
async def chat(req: ChatRequest, request: Request):
    auth_token = request.headers.get("X-Auth-Token", "")
    req.auth_token = auth_token
    return StreamingResponse(_chat_stream(req), media_type="text/event-stream")


async def _group_stream(req: GroupChatRequest) -> AsyncIterator[str]:
    """Group chat: respond briefly or PASS (waterfall handoff)."""
    sys_prompt = build_group_system_prompt(
        req.activeAgentName,
        [a["name"] for a in req.mentionedAgents],
    )
    members_context = "Other agents in this group: " + ", ".join(a["name"] for a in req.mentionedAgents if a["id"] != req.activeAgentId)
    messages = [
        {"role": "system", "content": sys_prompt + "\n" + members_context},
    ] + req.history + [
        {"role": "user", "content": req.message},
    ]

    full_text = ""
    async for ev in stream_chat(messages, None):
        if ev.type == "token":
            full_text += ev.content
            yield sse_event({"type": "token", "content": ev.content, "agentId": req.activeAgentId, "agentName": req.activeAgentName})
        elif ev.type == "final":
            full_text = ev.content or full_text

    if full_text.strip().upper() == "PASS":
        yield sse_event({"type": "pass", "agentId": req.activeAgentId, "agentName": req.activeAgentName})
    else:
        for w in parse_widgets(full_text):
            yield sse_event({"type": "widget", "widget": w, "agentId": req.activeAgentId})
    yield sse_event({"type": "done", "agentId": req.activeAgentId})


@app.post("/group-chat")
async def group_chat(req: GroupChatRequest, request: Request):
    req.auth_token = request.headers.get("X-Auth-Token", "")
    return StreamingResponse(_group_stream(req), media_type="text/event-stream")


async def _cluster_stream(req: ClusterRequest) -> AsyncIterator[str]:
    """Cluster AI: manager-router view with route badge + widgets."""
    route = await route_message(req.message, req.businessContext)
    yield sse_event({"type": "route", "route": route["route"], "reason": route["reason"]})

    sys_prompt = build_cluster_system_prompt(req.businessContext)
    messages = [{"role": "system", "content": sys_prompt}] + req.history + [{"role": "user", "content": req.message}]

    tools = get_available_tools()
    full_text = ""
    async for ev in stream_chat(messages, tools):
        if ev.type == "token":
            full_text += ev.content
            yield sse_event({"type": "token", "content": ev.content})
        elif ev.type == "tool_call":
            result = await execute_tool(ev.tool_name, ev.tool_args or {}, req.auth_token)
            messages.append({"role": "assistant", "content": None, "tool_calls": [{"id": "call_1", "type": "function", "function": {"name": ev.tool_name, "arguments": json.dumps(ev.tool_args or {})}}]})
            messages.append({"role": "tool", "tool_call_id": "call_1", "content": result})
            yield sse_event({"type": "tool", "name": ev.tool_name, "result": result[:200]})
        elif ev.type == "final":
            full_text = ev.content or full_text

    for w in parse_widgets(full_text):
        yield sse_event({"type": "widget", "widget": w})
    yield sse_event({"type": "done"})


@app.post("/cluster")
async def cluster(req: ClusterRequest, request: Request):
    req.auth_token = request.headers.get("X-Auth-Token", "")
    return StreamingResponse(_cluster_stream(req), media_type="text/event-stream")


@app.post("/generate-questions")
async def generate_questions(req: QuestionRequest):
    """Generate setup questions for a new agent onboarding."""
    if is_offline():
        return {"questions": [
            "What is your primary role or job title?",
            "What are your top 3 recurring tasks each week?",
            "What time do you usually start and end your workday?",
            "Which tools do you already use for planning?",
            "What's one thing you always forget to do?",
        ]}

    cfg = get_config()
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=cfg["api_key"], base_url=cfg["base_url"])
        resp = await client.chat.completions.create(
            model=cfg["model"],
            messages=[
                {"role": "system", "content": QUESTION_GENERATION_PROMPT},
                {"role": "user", "content": f"Context: {req.context}"},
            ],
            temperature=0.7,
            max_tokens=300,
        )
        text = resp.choices[0].message.content or "[]"
        questions = json.loads(text)
        return {"questions": questions}
    except Exception:
        return {"questions": [
            "What is your primary role or job title?",
            "What are your top 3 recurring tasks each week?",
            "What time do you usually start and end your workday?",
        ]}


@app.get("/")
async def root():
    return {"service": "AI Studio Scheduler — Agent Service", "health": "/health"}
