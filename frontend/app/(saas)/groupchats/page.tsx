"use client";

import { useState } from "react";

const MOCK_GROUPS = [
  { id: "1", name: "Planning Team", members: ["Cluster AI", "Booking Agent"] },
  { id: "2", name: "Customer Support", members: ["Cluster AI", "Customer Memory"] },
];

export default function GroupChatsPage() {
  const [selected, setSelected] = useState<string | null>(null);

  if (selected) {
    const group = MOCK_GROUPS.find((g) => g.id === selected)!;
    return <GroupChatView group={group} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="animate-fade-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div className="accent-bar"><h1 className="text-2xl font-bold tracking-tight">Group Chats</h1></div>
        <button className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "var(--accent-indigo)" }}>+ New Group</button>
      </div>
      <div className="grid md:grid-cols-2 gap-4 stagger">
        {MOCK_GROUPS.map((g) => (
          <div key={g.id} onClick={() => setSelected(g.id)} className="glass p-4 card-hover cursor-pointer">
            <h3 className="font-medium mb-2">{g.name}</h3>
            <div className="flex -space-x-2">
              {g.members.map((m, i) => (
                <div key={m} className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2" style={{ background: i === 0 ? "var(--accent-indigo)" : "var(--accent-teal)", borderColor: "var(--bg-secondary)" }}>
                  {m[0]}
                </div>
              ))}
            </div>
            <p className="text-xs text-text-tertiary mt-2">{g.members.length} agents</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GroupChatView({ group, onBack }: { group: { id: string; name: string; members: string[] }; onBack: () => void }) {
  const [messages, setMessages] = useState<{ sender: string; role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    const userMsg = { sender: "You", role: "user" as const, content: input };
    setMessages([...messages, userMsg]);
    setInput("");
    // Simulate waterfall: each agent responds in sequence
    group.members.forEach((agent, i) => {
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          sender: agent,
          role: "assistant",
          content: i === 0 ? `I can help with that! Let me check your schedule...` : `Adding to that — your next free slot is at 2pm.`,
        }]);
      }, (i + 1) * 800);
    });
  };

  return (
    <div className="flex flex-col h-full animate-fade-slide-up">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
        <button onClick={onBack} className="text-text-tertiary hover:text-text-primary">←</button>
        <h2 className="font-medium text-sm">{group.name}</h2>
        <div className="flex -space-x-1.5">
          {group.members.map((m, i) => (
            <div key={m} className="w-6 h-6 rounded-full flex items-center justify-center text-xs border-2" style={{ background: i === 0 ? "var(--accent-indigo)" : "var(--accent-teal)", borderColor: "var(--bg-secondary)" }}>
              {m[0]}
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 && <p className="text-sm text-text-tertiary text-center py-8">Mention @agent to trigger a response</p>}
        {messages.map((m, i) => (
          <div key={i}>
            {m.role === "assistant" && <div className="text-xs text-text-tertiary mb-1 ml-1">{m.sender}</div>}
            <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${m.role === "user" ? "text-white" : "glass"}`} style={m.role === "user" ? { background: "var(--accent-indigo)" } : {}}>
                {m.content}
              </div>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message ${group.name}... (@ to mention an agent)`}
          className="flex-1 px-3 py-2.5 rounded-lg text-sm bg-transparent border focus:outline-none"
          style={{ borderColor: "var(--border)" }}
        />
        <button type="submit" className="px-4 py-2.5 rounded-lg text-sm font-medium text-white" style={{ background: "var(--accent-indigo)" }}>Send</button>
      </form>
    </div>
  );
}
