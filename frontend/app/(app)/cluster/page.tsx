"use client";

import { useState, useRef, useEffect } from "react";

interface Msg { role: "user" | "assistant"; content: string; route?: string; widget?: any; }

export default function ClusterPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || streaming) return;
    const userMsg: Msg = { role: "user", content: input };
    setMessages([...messages, userMsg]);
    setInput("");
    setStreaming(true);

    // Simulate Cluster AI streaming with route badge + widget
    const route = input.toLowerCase().includes("book") || input.toLowerCase().includes("schedule") ? "booking" : "general";
    setMessages((prev) => [...prev, { role: "assistant", content: "", route }]);

    const response = `I've analyzed your schedule. Here's your plan:\n\n1. ⚠ Review PR #142 (overdue)\n2. Team standup 09:00-09:15\n3. Ship scheduler 09:30-12:00\n4. Client review 12:00-13:00\n\nI can create calendar events for any of these. Just ask!`;

    let acc = "";
    for (const word of response.split(" ")) {
      await new Promise((r) => setTimeout(r, 30));
      acc += (acc ? " " : "") + word;
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: acc, route };
        return copy;
      });
    }

    // Emit a widget
    setMessages((prev) => [...prev, {
      role: "assistant",
      content: "",
      widget: { type: "stat", label: "Tasks remaining", value: "5", trend: "+2 today" },
    }]);

    setStreaming(false);
  };

  return (
    <div className="flex flex-col h-full animate-fade-slide-up">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--accent-indigo)" }}>✷</div>
        <div>
          <h2 className="font-medium text-sm">Cluster AI</h2>
          <span className="text-xs text-text-tertiary">Manager-router · plans your day</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 && (
          <p className="text-sm text-text-tertiary text-center py-8">
            Chat with Cluster AI — your day planner. Try: "Plan my day" or "What's overdue?"
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i}>
            {m.route && m.role === "assistant" && (
              <div className="flex items-center gap-2 mb-1 ml-1">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-hover)", color: m.route === "booking" ? "var(--accent-teal)" : "var(--text-secondary)" }}>
                  route: {m.route}
                </span>
              </div>
            )}
            {m.widget && <WidgetRenderer widget={m.widget} />}
            {m.content && (
              <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${m.role === "user" ? "text-white" : "glass"}`} style={m.role === "user" ? { background: "var(--accent-indigo)" } : {}}>
                  {m.content}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Cluster AI to plan your day..."
          className="flex-1 px-3 py-2.5 rounded-lg text-sm bg-transparent border focus:outline-none"
          style={{ borderColor: "var(--border)" }}
        />
        <button type="submit" disabled={streaming} className="px-4 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: "var(--accent-indigo)" }}>
          {streaming ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}

function WidgetRenderer({ widget }: { widget: any }) {
  if (widget.type === "stat") {
    return (
      <div className="glass p-3 inline-block">
        <div className="text-xs text-text-tertiary">{widget.label}</div>
        <div className="tnum text-2xl font-bold" style={{ color: "var(--accent-teal)" }}>{widget.value}</div>
        {widget.trend && <div className="text-xs text-text-tertiary">{widget.trend}</div>}
      </div>
    );
  }
  return null;
}
