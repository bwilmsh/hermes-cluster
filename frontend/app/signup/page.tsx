"use client";

import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const plans = [
    {
      name: "Free",
      price: "$0",
      features: ["2 agents", "2 team members", "Core workflows"],
      cta: "Get started",
      elevated: false,
    },
    {
      name: "Pro",
      price: "$17",
      period: "/mo",
      features: ["Unlimited agents", "Up to 10 team members", "All workflows + automations", "Google, Slack, Notion integrations"],
      cta: "Start Pro",
      elevated: true,
    },
    {
      name: "Max",
      price: "Contact Sales",
      features: ["Everything in Pro", "Unlimited team members", "Priority support + SLA", "Custom integrations"],
      cta: "Talk to us",
      elevated: false,
      matte: true,
    },
  ];

  return (
    <div className="min-h-full overflow-auto dot-grid">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Pricing */}
        <h2 className="text-3xl font-bold tracking-tight text-center mb-10" style={{ letterSpacing: "-0.03em" }}>
          Simple, transparent pricing
        </h2>
        <div className="grid md:grid-cols-3 gap-4 mb-16 stagger">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`glass p-6 card-hover relative ${plan.elevated ? "ring-2" : ""}`}
              style={
                plan.elevated
                  ? { boxShadow: "0 0 0 2px var(--glow-indigo), 0 8px 30px var(--glow-indigo)" }
                  : plan.matte
                    ? { background: "var(--bg-tertiary)", borderColor: "var(--border)" }
                    : {}
              }
            >
              {plan.elevated && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-medium rounded-full text-white"
                  style={{ background: "var(--accent-indigo)" }}
                >
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
              <div className="mb-4">
                <span className="tnum text-3xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-text-tertiary">{plan.period}</span>}
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-text-secondary flex items-center gap-2">
                    <span style={{ color: "var(--accent-teal)" }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all hover:scale-1.01 ${
                  plan.elevated ? "text-white" : "glass"
                }`}
                style={plan.elevated ? { background: "var(--accent-indigo)" } : {}}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Auth form */}
        <div className="max-w-sm mx-auto glass p-6">
          <div className="flex gap-2 mb-4 p-1 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "signup" ? "text-white" : "text-text-secondary"}`}
              style={mode === "signup" ? { background: "var(--accent-indigo)" } : {}}
            >
              Sign Up
            </button>
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "login" ? "text-white" : "text-text-secondary"}`}
              style={mode === "login" ? { background: "var(--accent-indigo)" } : {}}
            >
              Log In
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // TODO: call backend /api/auth/register or /api/auth/login
              window.location.href = "/dashboard";
            }}
            className="space-y-3"
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-transparent border focus:outline-none"
              style={{ borderColor: "var(--border)" }}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-transparent border focus:outline-none"
              style={{ borderColor: "var(--border)" }}
              required
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg font-medium text-sm text-white transition-all hover:scale-1.01"
              style={{ background: "var(--accent-indigo)" }}
            >
              {mode === "signup" ? "Create account" : "Log in"}
            </button>
          </form>
          <button
            disabled
            title="Coming soon"
            className="w-full mt-3 py-2.5 rounded-lg font-medium text-sm glass cursor-not-allowed opacity-60"
          >
            Continue with Google
          </button>
          <Link href="/dashboard" className="block text-center mt-3 text-xs text-text-tertiary hover:text-text-secondary">
            Skip — explore the demo →
          </Link>
        </div>
      </div>
    </div>
  );
}
