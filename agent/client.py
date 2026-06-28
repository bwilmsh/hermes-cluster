"""Provider-agnostic OpenAI-format client. Works with OpenAI, Anthropic via base_url,
OpenRouter, Groq, etc. Reads AGENT_API_KEY, AGENT_API_BASE_URL, AGENT_MODEL from env.

CRITICAL: the service must boot and respond without an API key (offline mode)."""
import os
from typing import AsyncIterator, Literal
from dataclasses import dataclass

@dataclass
class StreamEvent:
    type: Literal["token", "tool_call", "final"]
    content: str = ""
    tool_name: str = ""
    tool_args: dict = None

def get_config():
    return {
        "api_key": os.environ.get("AGENT_API_KEY", ""),
        "base_url": os.environ.get("AGENT_API_BASE_URL", "https://api.openai.com/v1"),
        "model": os.environ.get("AGENT_MODEL", "gpt-4o-mini"),
    }

def is_offline() -> bool:
    return not get_config()["api_key"]

OFFLINE_MESSAGE = (
    "I'm running in offline mode (no AGENT_API_KEY configured). "
    "I can still help you plan your day using my built-in scheduler logic, "
    "but I won't be able to have a free-form conversation. "
    "Set AGENT_API_KEY to enable full AI chat."
)

async def stream_chat(
    messages: list[dict],
    tools: list[dict] | None = None,
) -> AsyncIterator[StreamEvent]:
    """Stream a chat completion. Yields StreamEvent objects.
    If no API key: yields a single offline-mode message."""
    cfg = get_config()
    if not cfg["api_key"]:
        yield StreamEvent(type="token", content=OFFLINE_MESSAGE)
        yield StreamEvent(type="final", content=OFFLINE_MESSAGE)
        return

    try:
        from openai import AsyncOpenAI
    except ImportError:
        yield StreamEvent(type="token", content=OFFLINE_MESSAGE)
        yield StreamEvent(type="final", content=OFFLINE_MESSAGE)
        return

    client = AsyncOpenAI(api_key=cfg["api_key"], base_url=cfg["base_url"])
    try:
        stream = await client.chat.completions.create(
            model=cfg["model"],
            messages=messages,
            tools=tools if tools else None,
            stream=True,
        )
        full_text = ""
        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                text = chunk.choices[0].delta.content
                full_text += text
                yield StreamEvent(type="token", content=text)
            if chunk.choices and chunk.choices[0].delta.tool_calls:
                for tc in chunk.choices[0].delta.tool_calls:
                    yield StreamEvent(
                        type="tool_call",
                        tool_name=tc.function.name,
                        tool_args=__import__("json").loads(tc.function.arguments or "{}"),
                    )
        yield StreamEvent(type="final", content=full_text)
    except Exception as e:
        err = f"[Agent service error: {type(e).__name__}: {e}]"
        yield StreamEvent(type="token", content=err)
        yield StreamEvent(type="final", content=err)
