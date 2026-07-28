"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";

/**
 * Login + Signup page.
 *
 * When Supabase is configured: uses supabase.auth.signInWithPassword /
 * signUp. New users get a profile row auto-created via the
 * on_auth_user_created trigger in supabase/migrations/0001.
 *
 * When Supabase is NOT configured: shows a banner explaining how to
 * configure it. The form still works for a "demo" flow (redirects to
 * dashboard without auth) so the UI can be reviewed.
 */

type Mode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!isSupabaseConfigured) {
      // Demo mode — just navigate so the UI is reviewable.
      router.push("/dashboard");
      return;
    }

    startTransition(async () => {
      try {
        const { getBrowserClient } = await import("@/lib/supabase");
        const supabase = getBrowserClient();
        if (mode === "signup") {
          const { error: signUpErr } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { display_name: displayName.trim() || email.split("@")[0] },
            },
          });
          if (signUpErr) {
            setError(signUpErr.message);
            return;
          }
          setInfo("Account created — check your inbox to confirm, then log in.");
          setMode("login");
        } else {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (signInErr) {
            setError(signInErr.message);
            return;
          }
          router.push("/dashboard");
          router.refresh();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  };

  return (
    <div className="min-h-full overflow-auto dot-grid">
      <div className="max-w-md mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight text-center mb-2" style={{ letterSpacing: "-0.03em" }}>
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-sm text-center mb-8" style={{ color: "var(--text-tertiary)" }}>
          {mode === "signup" ? "Solo scheduling that actually works." : "Log in to keep planning your day."}
        </p>

        {!isSupabaseConfigured && (
          <div
            className="mb-6 p-3 rounded-lg text-xs"
            style={{ background: "rgba(245, 158, 11, 0.10)", border: "1px solid rgba(245, 158, 11, 0.30)", color: "var(--accent-amber)" }}
          >
            <strong>Supabase not configured.</strong> Add your URL + keys to{" "}
            <code style={{ fontFamily: "var(--font-mono)" }}>frontend/.env.local</code>{" "}
            to enable real accounts. Demo mode below will still navigate to /dashboard.
          </div>
        )}

        <div className="glass p-6">
          {/* Mode tabs */}
          <div className="flex gap-2 mb-4 p-1 rounded-lg" style={{ background: "var(--bg-tertiary)" }}>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); setInfo(null); }}
              className="flex-1 py-2 text-sm font-medium rounded-md transition-all"
              style={{
                background: mode === "signup" ? "var(--accent-indigo)" : "transparent",
                color: mode === "signup" ? "#fff" : "var(--text-secondary)",
              }}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); setInfo(null); }}
              className="flex-1 py-2 text-sm font-medium rounded-md transition-all"
              style={{
                background: mode === "login" ? "var(--accent-indigo)" : "transparent",
                color: mode === "login" ? "#fff" : "var(--text-secondary)",
              }}
            >
              Log In
            </button>
          </div>

          {error && (
            <div className="mb-3 p-2.5 rounded-md text-xs" style={{ background: "rgba(244, 63, 94, 0.10)", color: "#F43F5E", border: "1px solid rgba(244, 63, 94, 0.30)" }}>
              {error}
            </div>
          )}
          {info && (
            <div className="mb-3 p-2.5 rounded-md text-xs" style={{ background: "rgba(34, 197, 94, 0.10)", color: "#22C55E", border: "1px solid rgba(34, 197, 94, 0.30)" }}>
              {info}
            </div>
          )}

          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            {mode === "signup" && (
              <input
                type="text"
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm bg-transparent border focus:outline-none"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-transparent border focus:outline-none"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-transparent border focus:outline-none"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              required
            />
            <button
              type="submit"
              disabled={pending}
              className="w-full py-2.5 rounded-lg font-medium text-sm text-white transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--accent-indigo)" }}
            >
              {pending ? "..." : mode === "signup" ? "Create account" : "Log in"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            or
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <button
            type="button"
            disabled
            title="Coming soon"
            className="w-full py-2.5 rounded-lg font-medium text-sm glass cursor-not-allowed opacity-60"
          >
            Continue with Google
          </button>

          <Link
            href="/dashboard"
            className="block text-center mt-4 text-xs hover:text-text-secondary"
            style={{ color: "var(--text-tertiary)" }}
          >
            Skip — explore the demo →
          </Link>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--text-tertiary)" }}>
          By continuing you agree to our{" "}
          <Link href="/terms" style={{ textDecoration: "underline" }}>Terms</Link> and{" "}
          <Link href="/privacy" style={{ textDecoration: "underline" }}>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}