"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function aiReply(input: string, page: string): string {
  const q = input.trim().toLowerCase();

  if (/\b(event|meeting|appointment|schedule)\b/.test(q) && /\b(add|create|book|set|make|plan)\b/.test(q)) {
    return "Got it — I can add that to your calendar. Open **Scheduler**, double-click a date, and fill in the time, title, and reminder. Or tell me the exact day and time (e.g. “Friday 3pm team sync”) and I’ll guide the rest.";
  }
  if (/\b(task|todo|to-do)\b/.test(q) && /\b(add|create|make|new)\b/.test(q)) {
    return "Sure — go to **Tasks** and tap **+ New Task**, or describe it here (title + project). I’ll keep it on your list for this week.";
  }
  if (/\b(week|upcoming|this week|what.?s on|agenda|schedule)\b/.test(q)) {
    return "Here’s a quick look at your week: standup and client work early, demo mid-week, sprint review and retro later. Open **Scheduler** or **Due Dates** for the full timeline — or ask me about a specific day.";
  }
  if (/\b(deadline|due|overdue)\b/.test(q)) {
    return "Check **Due Dates** for what’s urgent. I can help prioritize — say “what’s due tomorrow” or “show high priority deadlines.”";
  }
  if (/\b(habit|goal)\b/.test(q)) {
    return "Habits and goals live under **Habits** and **Goals**. Tell me what you want to track and how often, and I’ll help you set it up.";
  }
  if (/\b(help|what can you|how do)\b/.test(q)) {
    return "I can help you **add events**, **create tasks**, and review **what’s upcoming this week**. Try: “Add a meeting Friday at 2”, “New task: ship dashboard”, or “What’s on this week?”";
  }

  const pageHint =
    page.includes("scheduler")
      ? "You’re on the calendar — double-click a day to add an event, or tell me what to schedule."
      : page.includes("task")
        ? "You’re on Tasks — ask me to create one or filter what’s open."
        : page.includes("dashboard")
          ? "From the dashboard I can jump you to calendar, tasks, or this week’s agenda."
          : "I can help add events, tasks, or summarize your week from any page.";

  return `${pageHint}\n\nYou said: “${input.trim()}”. Try something like “what’s upcoming this week” or “add an event tomorrow at 10.”`;
}

export function AiChatBar() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi — I’m your AI assistant. Ask me to **add events**, **create tasks**, or show **what’s upcoming this week**.",
    },
  ]);
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [open, messages, busy]);

  const send = (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setBusy(true);

    // Lightweight local routing for common intents
    const lower = text.toLowerCase();
    window.setTimeout(() => {
      let reply = aiReply(text, pathname || "");
      if (/\b(open|go to|show)\b.*\b(calendar|scheduler|schedule)\b/.test(lower)) {
        reply = "Opening the scheduler for you…";
        router.push("/scheduler");
      } else if (/\b(open|go to|show)\b.*\btasks?\b/.test(lower)) {
        reply = "Opening tasks…";
        router.push("/tasks");
      } else if (/\b(open|go to|show)\b.*\b(due|deadline)/.test(lower)) {
        reply = "Opening due dates…";
        router.push("/due-dates");
      } else if (/\b(open|go to|show)\b.*\bdashboard\b/.test(lower)) {
        reply = "Heading to the dashboard…";
        router.push("/dashboard");
      }

      setMessages((m) => [
        ...m,
        { id: `a-${Date.now()}`, role: "assistant", content: reply },
      ]);
      setBusy(false);
    }, 450);
  };

  return (
    <div className="ai-chat-root" aria-live="polite">
      {/* Expanded chat panel */}
      {open && (
        <div className="ai-chat-panel">
          <div className="ai-chat-panel-header">
            <div className="flex items-center gap-2 min-w-0">
              <span className="ai-chat-orb" aria-hidden />
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                  Chat with AI
                </div>
                <div className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>
                  Events · tasks · this week
                </div>
              </div>
            </div>
            <button
              type="button"
              className="ai-chat-icon-btn"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div className="ai-chat-messages" ref={listRef}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`ai-chat-bubble ${m.role === "user" ? "user" : "assistant"}`}
              >
                {m.content.split("**").map((part, i) =>
                  i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
                )}
              </div>
            ))}
            {busy && (
              <div className="ai-chat-bubble assistant ai-chat-typing">
                <span /><span /><span />
              </div>
            )}
          </div>

          <div className="ai-chat-quick">
            {[
              "What’s upcoming this week?",
              "Add an event",
              "Create a task",
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                className="ai-chat-chip"
                onClick={() => {
                  setInput(chip);
                  inputRef.current?.focus();
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          <form className="ai-chat-compose" onSubmit={send}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about events, tasks, or this week…"
              className="ai-chat-compose-input"
              disabled={busy}
            />
            <button
              type="submit"
              className="ai-chat-send"
              disabled={!input.trim() || busy}
              aria-label="Send"
            >
              ↑
            </button>
          </form>
        </div>
      )}

      {/* Pill bar — always visible on every page */}
      <button
        type="button"
        className={`ai-chat-pill ${open ? "open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close Chat with AI" : "Chat with AI"}
      >
        <span className="ai-chat-orb" aria-hidden />
        <span className="ai-chat-pill-label">Chat with AI</span>
        <span className="ai-chat-pill-hint" aria-hidden>
          {open ? "Close" : "Ask anything"}
        </span>
      </button>
    </div>
  );
}
