"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getBrowserClient, isSupabaseConfigured, type ProfileRow } from "@/lib/supabase";

interface SessionUser {
  id: string;
  email: string | null;
}

interface AuthContextValue {
  /** Supabase user (null when not configured or signed out) */
  user: SessionUser | null;
  /** Profile row from profiles table */
  profile: ProfileRow | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // No Supabase = no session. Pages render in demo mode.
      setLoading(false);
      return;
    }
    const supabase = getBrowserClient();
    let active = true;

    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (user) {
        setUser({ id: user.id, email: user.email ?? null });
        // Try to fetch profile — the trigger creates it on signup so this should succeed
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (data) setProfile(data as ProfileRow);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    }

    loadUser();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? null });
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        if (data) setProfile(data as ProfileRow);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    const supabase = getBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}