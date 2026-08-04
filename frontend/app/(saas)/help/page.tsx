"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  { q: "How does Cluster AI plan my day?", a: "Cluster AI analyzes your tasks, habits, deadlines, and calendar to create an optimized schedule. It prioritizes overdue items, respects your preferred times for habits, and leaves buffer between meetings." },
  { q: "How do group chats work?", a: "In a group chat, @mention an agent to trigger a response. Agents respond in waterfall sequence — each agent waits for the previous one to finish before replying." },
  { q: "Are my OAuth tokens safe?", a: "Yes. All tokens are encrypted at rest using AES-256-GCM. We never store plaintext credentials, and you can revoke access at any time." },
  { q: "Can I create custom automations?", a: "Absolutely. Use the workflow builder to create triggers, conditions, and actions. Start from a template or build from scratch." },
  { q: "How do habits auto-schedule?", a: "Habits with 'materialize' enabled automatically create calendar events based on your preferred time and frequency. If you skip a habit, it auto-reschedules with wiggle room." },
];

const QUICK_LINKS = [
  { icon: "📖", title: "Documentation", desc: "Full guides and API reference" },
  { icon: "💬", title: "Chat Support", desc: "Ask Cluster AI anything" },
  { icon: "🐛", title: "Report a Bug", desc: "Help us improve" },
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Help Center</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Find answers and get support
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {QUICK_LINKS.map((card) => (
          <div
            key={card.title}
            className="saas-card p-5 space-y-2 cursor-pointer card-hover"
          >
            <span className="text-2xl">{card.icon}</span>
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{card.title}</div>
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{card.desc}</div>
          </div>
        ))}
      </div>

      {/* FAQ accordion */}
      <div className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
          Frequently Asked Questions
        </div>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="saas-card overflow-hidden">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
                >
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.q}</span>
                  <span
                    className="text-xs transition-transform shrink-0"
                    style={{
                      transform: isOpen ? "rotate(180deg)" : "none",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    ▼
                  </span>
                </button>
                {isOpen && (
                  <div
                    className="px-5 pb-4 text-sm leading-relaxed animate-fade-slide-up"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
