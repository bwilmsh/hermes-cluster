"use client";

import { useEffect } from "react";
import { SaasSidebar, SaasTopNav } from "@/components/SaasNav";

export default function SaasLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Theme is controlled by ThemeToggle in the top nav.
    // Default to light mode if no preference stored.
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const isDark = stored === "dark";
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <div className="flex h-full" style={{ background: "var(--bg-primary)" }}>
      <SaasSidebar />
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0">
        <SaasTopNav />
        {/* Scrollable content */}
        <div className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-8 py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
