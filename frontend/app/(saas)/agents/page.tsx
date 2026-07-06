"use client";

import { useState, useRef, useEffect } from "react";

interface Msg { role: "user" | "assistant"; content: string; }

const MOCK_AGENTS = [
  { id: "1", name: "Cluster AI", role: "general" },
  { id: "2", name: "Booking Agent", role: "booking" },
  { id: "3", name: "Customer Memory", role: "customer" },
];

export default function AgentsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  if (selected) return <AgentChat agentId={selected} onBack={() => setSelected(null)} />;
  return (
    <div className="animate-fade-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div className="accent-bar"><h1 className="text-2xl font-bold tracking-tight">Agents</h1></div>
        <button className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "var(--accent-indigo)" }}>+ Create Agent</button>
      </div>
      <div className="grid md:grid-cols-3 gap-4 stagger">
        {MOCK_AGENTS.map((a) => (
          <div key={a.id} onClick={() => setSelected(a.id)} className="glass p-4 card-hover cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: a.role === "booking" ? "var(--accent-teal)" : a.role === "customer" ? "var(--accent-amber)" : "var(--accent-indigo)" }}>
                {a.name[0]}
              </div>
              <div>
                <h3 className="font-medium">{a.name}</h3>
                <span className="text-xs text-text-tertiary capitalize">{a.role}</span>
              </div>
            </div>
            <p className="text-sm text-text-secondary">AI personal assistant ready to help plan your day.</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentChat({ agentId, onBack }: { agentId: string; onBack: () => void }) {
  const agent = MOCK_AGENTS.find((a) => a.id === agentId)!;
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

    // Simulate streaming response (offline mode)
    const response = "I'd help you plan your day! Here's what I see:\n\n1. You have an overdue task: Review PR #142\n2. Team standup at 09:00\n3. Client review at 12:00\n\nWant me to prioritize these for you?";
    const words = response.split(" ");
    let acc = "";
    for (const word of words) {
      await new Promise((r) => setTimeout(r, 40));
      acc += (acc ? " " : "") + word;
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant" && !last.content.includes("\n\n[")) {
          copy[copy.length - 1] = { role: "assistant", content: acc };
        } else {
          copy.push({ role: "assistant", content: acc });
        }
        return copy;
      });
    }
    setStreaming(false);
  };

  return (
    <div className="flex flex-col h-full animate-fade-slide-up">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
        <button onClick={onBack} className="text-text-tertiary hover:text-text-primary">←</button>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: agent.role === "booking" ? "var(--accent-teal)" : agent.role === "customer" ? "var(--accent-amber)" : "var(--accent-indigo)" }}>
          {agent.name[0]}
        </div>
        <div>
          <h2 className="font-medium text-sm">{agent.name}</h2>
          <span className="text-xs text-text-tertiary capitalize">{agent.role}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 && <p className="text-sm text-text-tertiary text-center py-8">Start chatting with {agent.name}...</p>}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${m.role === "user" ? "text-white" : "glass"}`}
              style={m.role === "user" ? { background: "var(--accent-indigo)" } : {}}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message ${agent.name}...`}
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
