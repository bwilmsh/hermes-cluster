"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AskAIInput } from "@/components/AskAIInput";

/* ── Types ── */
interface Agent {
  id: string;
  name: string;
  role: string;
  status: "active" | "idle";
}

interface GroupChatMessage {
  id: string;
  senderName: string;
  senderRole: "user" | "assistant";
  content: string;
  timestamp: Date;
  agentId?: string;
}

interface GroupChat {
  id: string;
  name: string;
  members: Agent[];
  messages: GroupChatMessage[];
}

/* ── Demo data ── */
const DEMO_AGENTS: Agent[] = [
  { id: "a1", name: "Cluster AI", role: "Day Planner", status: "active" },
  { id: "a2", name: "Booking Agent", role: "Scheduling", status: "idle" },
  { id: "a3", name: "Customer Memory", role: "Context", status: "idle" },
];

const DEMO_CHATS: GroupChat[] = [
  {
    id: "gc1",
    name: "Product Launch",
    members: [DEMO_AGENTS[0], DEMO_AGENTS[1]],
    messages: [
      { id: "m1", senderName: "You", senderRole: "user", content: "Team, let's plan the v2 launch. What needs to happen?", timestamp: new Date(Date.now() - 600000) },
      { id: "m2", senderName: "Cluster AI", senderRole: "assistant", content: "I've mapped out the critical path:\n\n1. Feature freeze by Aug 1\n2. QA sprint Aug 1–7\n3. Beta release Aug 8\n4. General availability Aug 15\n\nBooking Agent can handle the launch event scheduling.", timestamp: new Date(Date.now() - 500000), agentId: "a1" },
      { id: "m3", senderName: "Booking Agent", senderRole: "assistant", content: "On it — I'll block the launch week on the team calendar and set up a rehearsal meeting for Aug 10. @Cluster AI, can you check for schedule conflicts?", timestamp: new Date(Date.now() - 400000), agentId: "a2" },
    ],
  },
  {
    id: "gc2",
    name: "Client Onboarding",
    members: [DEMO_AGENTS[0], DEMO_AGENTS[2]],
    messages: [
      { id: "m4", senderName: "You", senderRole: "user", content: "Acme Corp is signing. What do we know about them?", timestamp: new Date(Date.now() - 300000) },
      { id: "m5", senderName: "Customer Memory", senderRole: "assistant", content: "Acme Corp — enterprise tier, 500 seats. They previously requested SSO and custom integrations. Their CTO preferred Slack over email for comms. Last interaction was 3 weeks ago.", timestamp: new Date(Date.now() - 200000), agentId: "a3" },
    ],
  },
];

export default function GroupChatsPage() {
  const [chats, setChats] = useState<GroupChat[]>(DEMO_CHATS);
  const [activeChat, setActiveChat] = useState<string>(chats[0]?.id || "");
  const [newMessage, setNewMessage] = useState("");
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, activeChat]);

  const activeChatData = chats.find((c) => c.id === activeChat);

  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || streaming || !activeChatData) return;

    const userMsg: GroupChatMessage = {
      id: `m${Date.now()}`,
      senderName: "You",
      senderRole: "user",
      content: newMessage.trim(),
      timestamp: new Date(),
    };

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat
          ? { ...c, messages: [...c.messages, userMsg] }
          : c
      )
    );
    setNewMessage("");
    setStreaming(true);

    // Simulate waterfall agent handoff — agents respond sequentially
    const agents = activeChatData.members;
    let delay = 600;

    agents.forEach((agent, idx) => {
      setTimeout(() => {
        const responses: Record<string, string[]> = {
          "a1": [
            "Based on that, I've updated the timeline. Key dependency: the QA sprint must start by Aug 1.",
            "I've flagged this as high priority and adjusted the day plan accordingly.",
            "Noted. I'll factor this into tomorrow's schedule — blocking 2h for it.",
          ],
          "a2": [
            "I'll handle the scheduling side. Checking calendar availability now…",
            "Meeting room booked for the review. I'll send invites.",
            "Added to the calendar with a 15-min buffer before and after.",
          ],
          "a3": [
            "From context: the client preferred async communication. I'd suggest Slack over email.",
            "Memory updated — noting this preference for future interactions.",
            "Past context shows similar requests were handled within 48h. Setting that as our target.",
          ],
        };

        const pool = responses[agent.id] || ["Processing…"];
        const response = pool[Math.floor(Math.random() * pool.length)];

        const agentMsg: GroupChatMessage = {
          id: `m${Date.now() + idx}`,
          senderName: agent.name,
          senderRole: "assistant",
          content: response,
          timestamp: new Date(),
          agentId: agent.id,
        };

        setChats((prev) =>
          prev.map((c) =>
            c.id === activeChat
              ? { ...c, messages: [...c.messages, agentMsg] }
              : c
          )
        );

        if (idx === agents.length - 1) {
          setStreaming(false);
        }
      }, delay);
      delay += 1200; // Waterfall: each agent waits for previous
    });
  }, [newMessage, streaming, activeChat, activeChatData]);

  const createGroupChat = useCallback(() => {
    const id = `gc${Date.now()}`;
    const newChat: GroupChat = {
      id,
      name: "New Group Chat",
      members: DEMO_AGENTS,
      messages: [],
    };
    setChats((prev) => [...prev, newChat]);
    setActiveChat(id);
  }, []);

  return (
    <div className="flex h-full gap-0 animate-fade-slide-up">
      {/* ── Left: Chat list ── */}
      <div className="w-[260px] shrink-0 flex flex-col border-r" style={{ borderColor: "var(--border)" }}>
        <div className="p-4 flex items-center justify-between">
          <div className="accent-bar text-sm font-semibold">Group Chats</div>
          <button
            onClick={createGroupChat}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: "var(--accent-indigo)", color: "white" }}
          >
            + New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {chats.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveChat(c.id)}
              className="w-full text-left px-3 py-2.5 rounded-lg transition-colors"
              style={{
                background: activeChat === c.id ? "var(--bg-hover)" : "transparent",
              }}
            >
              <div className="text-sm font-medium truncate">{c.name}</div>
              <div className="flex items-center gap-1 mt-0.5">
                {c.members.map((m) => (
                  <span
                    key={m.id}
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: "var(--bg-hover)", color: "var(--text-tertiary)" }}
                  >
                    @{m.name.split(" ")[0]}
                  </span>
                ))}
                <span className="tnum text-xs" style={{ color: "var(--text-tertiary)" }}>
                  · {c.messages.length}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: Active chat ── */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeChatData ? (
          <>
            {/* Chat header */}
            <div className="px-5 py-3 flex items-center gap-3 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="text-sm font-semibold">{activeChatData.name}</div>
              <div className="flex items-center gap-1.5">
                {activeChatData.members.map((m) => (
                  <span
                    key={m.id}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: "var(--bg-hover)",
                      color: m.status === "active" ? "var(--accent-teal)" : "var(--text-tertiary)",
                    }}
                  >
                    {m.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {activeChatData.messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
                  <div className="text-3xl">💬</div>
                  <p className="text-sm text-center" style={{ color: "var(--text-tertiary)" }}>
                    Start a group conversation.<br />
                    @mention agents to trigger waterfall responses.
                  </p>
                </div>
              )}

              {activeChatData.messages.map((m) => (
                <div key={m.id} className="animate-fade-slide-up">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-medium"
                      style={{
                        color: m.senderRole === "assistant" ? "var(--accent-teal)" : "var(--accent-indigo)",
                      }}
                    >
                      {m.senderName}
                    </span>
                    <span className="tnum text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {m.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-xl text-sm whitespace-pre-wrap leading-relaxed ${
                      m.senderRole === "user" ? "ml-auto text-white" : "glass"
                    }`}
                    style={m.senderRole === "user" ? { background: "var(--accent-indigo)" } : {}}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="px-5 pb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="@mention agents for waterfall handoff…"
                  disabled={streaming}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm"
                  style={{ background: "var(--bg-hover)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={streaming || !newMessage.trim()}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
                  style={{ background: "var(--accent-indigo)", color: "white" }}
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ color: "var(--text-tertiary)" }}>
            <div className="text-center">
              <div className="text-4xl mb-3">💬</div>
              <div className="text-sm">Select or create a group chat</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
