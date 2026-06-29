"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV = [
  { href: "/dashboard", label: "Today", icon: "☀" },
  { href: "/scheduler", label: "Scheduler", icon: "▦" },
  { href: "/agents", label: "Agents", icon: "✦" },
  { href: "/groupchats", label: "Group Chats", icon: "✉" },
  { href: "/cluster", label: "Cluster AI", icon: "✷" },
  { href: "/habits", label: "Habits", icon: "↻" },
  { href: "/due-dates", label: "Due Dates", icon: "⏱" },
  { href: "/goals", label: "Goals", icon: "◎" },
  { href: "/workflows", label: "Workflows", icon: "⚡" },
  { href: "/integrations", label: "Integrations", icon: "⧉" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    setIsDark(!isDark);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  };

  return (
    <aside
      className="flex h-full w-56 flex-col border-r shrink-0"
      style={{ borderColor: "var(--border)", background: "var(--bg-tertiary)" }}
    >
      <Link href="/dashboard" className="px-5 py-4 text-lg font-bold tracking-tight hover:opacity-80 transition-opacity">
        <span className="shimmer-text">AI Scheduler</span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                active ? "sidebar-active text-text-primary font-medium" : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
              }`}
              style={{
                background: active ? "var(--bg-hover)" : "transparent",
                color: active ? "var(--text-primary)" : "var(--text-secondary)",
              }}
            >
              <span className="text-base w-5 text-center" style={{ color: active ? "var(--accent-teal)" : "inherit" }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-3 border-t" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-2 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors w-full"
        >
          <span className="text-base w-5 text-center">{isDark ? "☀" : "🌙"}</span>
          {isDark ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </aside>
  );
}
