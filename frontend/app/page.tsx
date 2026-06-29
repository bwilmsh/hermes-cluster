"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingPage() {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="glow-blob" style={{ width: 500, height: 500, top: -100, left: -100, background: "var(--accent-teal)" }} />
      <div className="glow-blob" style={{ width: 500, height: 500, bottom: -100, right: -100, background: "var(--accent-indigo)" }} />

      <div className="relative z-10 max-w-2xl text-center px-6 stagger">
        <div className="mb-8 animate-fade-slide-up">
          <h1 className="text-5xl font-bold tracking-tighter mb-3" style={{ letterSpacing: "-0.03em" }}>
            Life runs smoother with your <span className="shimmer-text">AI planner</span>
          </h1>
          <p className="text-lg text-text-secondary mt-4">
            Plan your day, track assignments and due dates, build habits, and let AI schedule the rest — all in one place.
          </p>
        </div>

        {/* Count-up stat pills */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <StatPill label="agents deployed" value={12} />
          <StatPill label="tasks automated" value={4200} />
          <StatPill label="faster planning" value={2.1} suffix="x" />
        </div>

        {/* Dual CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-lg font-medium text-white transition-all hover:scale-1.01"
            style={{ background: "var(--accent-indigo)", boxShadow: "0 4px 20px var(--glow-indigo)" }}
          >
            Get started free
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 rounded-lg font-medium glass card-hover"
          >
            View pricing
          </Link>
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {["Plan my day", "What's overdue?", "Schedule a habit", "Create a due date"].map((chip) => (
            <button
              key={chip}
              className="px-3 py-1.5 text-sm rounded-full glass hover:border-teal-400 transition-all"
              style={{ color: "var(--text-secondary)" }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 1500;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(value * progress);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  const formatted = suffix ? display.toFixed(1) : Math.round(display).toLocaleString();
  return (
    <div className="glass px-4 py-2 flex items-center gap-2">
      <span className="tnum text-xl font-bold" style={{ color: "var(--accent-teal)" }}>
        {formatted}{suffix}
      </span>
      <span className="text-xs text-text-tertiary">{label}</span>
    </div>
  );
}
