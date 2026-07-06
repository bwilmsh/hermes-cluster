"use client";

import { useEffect } from "react";
import { SaasSidebar, SaasTopNav } from "@/components/SaasNav";

export default function SaasLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply SaaS light theme globally
    document.documentElement.classList.add("saas");
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
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
