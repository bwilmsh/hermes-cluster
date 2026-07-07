"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ── Icons (line-art, 24x24) ── */
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const icons: Record<string, React.ReactNode> = {
    dashboard: <path d="M3 3H10V10H3V3ZM14 3H21V8H14V3ZM14 12H21V21H14V12ZM3 14H10V21H3V14Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />,
    projects: <path d="M4 6H20M4 12H20M4 18H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />,
    calendar: <path d="M4 5H20V21H4V5ZM4 9H20M8 3V7M16 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
    tasks: <path d="M5 5H19V19H5V5ZM8 9L10 11L14 7M8 15L10 17L14 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
    team: <path d="M9 11C11.2 11 13 9.2 13 7C13 4.8 11.2 3 9 3C6.8 3 5 4.8 5 7C5 9.2 6.8 11 9 11ZM3 21C3 17 5.5 14 9 14C12.5 14 15 17 15 21M16 7C16 8.5 17 9.5 18.5 9.5C20 9.5 21 8.5 21 7C21 5.5 20 4.5 18.5 4.5C17 4.5 16 5.5 16 7ZM16 14C18.5 14.5 21 17 21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
    analytics: <path d="M4 20V10M9 20V4M14 20V14M19 20V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />,
    settings: <path d="M12 15C13.6 15 15 13.6 15 12C15 10.4 13.6 9 12 9C10.4 9 9 10.4 9 12C9 13.6 10.4 15 12 15ZM12 1V3M12 21V23M4.2 4.2L5.6 5.6M18.4 18.4L19.8 19.8M1 12H3M21 12H23M4.2 19.8L5.6 18.4M18.4 5.6L19.8 4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />,
    help: <path d="M12 21C16.9 21 21 16.9 21 12C21 7.1 16.9 3 12 3C7.1 3 3 7.1 3 12C3 16.9 7.1 21 12 21ZM9.5 9C9.5 7.5 10.5 6.5 12 6.5C13.5 6.5 14.5 7.5 14.5 9C14.5 10.5 12 11 12 13M12 17V17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />,
    search: <path d="M11 19C15.4 19 19 15.4 19 11C19 6.6 15.4 3 11 3C6.6 3 3 6.6 3 11C3 15.4 6.6 19 11 19ZM21 21L16.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
    bell: <path d="M12 3C8.5 3 6 5.5 6 9V12L4 15H20L18 12V9C18 5.5 15.5 3 12 3ZM9 17C9 18.5 10 19.5 12 19.5C14 19.5 15 18.5 15 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
    message: <path d="M4 5H20V15H12L8 19V15H4V5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
    plus: <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
    due: <path d="M12 8V12L14.5 14.5M12 3C7 3 3 7 3 12C3 17 7 21 12 21C17 21 21 17 21 12C21 7 17 3 12 3ZM12 1V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
    sun: <path d="M12 3V5M12 19V21M5.6 5.6L7 7M17 17L18.4 18.4M3 12H5M19 12H21M5.6 18.4L7 17M17 7L18.4 5.6M12 8C14.2 8 16 9.8 16 12C16 14.2 14.2 16 12 16C9.8 16 8 14.2 8 12C8 9.8 9.8 8 12 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
    moon: <path d="M21 12.8C20.5 17.3 16.7 21 12 21C7 21 3 17 3 12C3 7.3 6.7 3.5 11.2 3C9.3 5.4 8.2 8.5 8.2 12C8.2 15.5 9.3 18.6 11.2 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {icons[name] || null}
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/projects", label: "Projects", icon: "projects" },
  { href: "/scheduler", label: "Calendar", icon: "calendar" },
  { href: "/tasks", label: "Tasks", icon: "tasks" },
  { href: "/due-dates", label: "Due Dates", icon: "due" },
  { href: "/team", label: "Team", icon: "team" },
  { href: "/analytics", label: "Analytics", icon: "analytics" },
  { href: "/settings", label: "Settings", icon: "settings" },
  { href: "/help", label: "Help", icon: "help" },
];

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const dark = stored === "dark";
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      className="saas-nav-icon"
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Icon name={isDark ? "sun" : "moon"} size={20} />
    </button>
  );
}

export function SaasSidebar() {
  const pathname = usePathname();
  return (
    <aside
      className="flex h-full flex-col items-center shrink-0"
      style={{ width: 72, background: "var(--bg-secondary)", borderRight: "1px solid var(--border)" }}
    >
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center justify-center shrink-0" style={{ height: 64 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="10" fill="url(#logoGrad)" />
          {/* Stylized cluster/network mark */}
          <circle cx="20" cy="11" r="3.5" fill="#fff" />
          <circle cx="11" cy="26" r="3" fill="#fff" fillOpacity="0.85" />
          <circle cx="29" cy="26" r="3" fill="#fff" fillOpacity="0.85" />
          <line x1="20" y1="14.5" x2="11" y2="23" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="20" y1="14.5" x2="29" y2="23" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="13.5" y1="26" x2="26.5" y2="26" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4866FD" />
              <stop offset="1" stopColor="#486AFE" />
            </linearGradient>
          </defs>
        </svg>
      </Link>

      {/* Nav */}
      <nav className="flex-1 flex flex-col items-center gap-2 py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`saas-nav-icon ${active ? "active" : ""}`}
              title={item.label}
            >
              <Icon name={item.icon} size={20} />
            </Link>
          );
        })}
      </nav>

      {/* Profile at bottom */}
      <div className="shrink-0 pb-4">
        <div className="saas-avatar" style={{ background: "var(--accent-purple)", width: 32, height: 32 }}>
          B
        </div>
      </div>
    </aside>
  );
}

export function SaasTopNav() {
  return (
    <header
      className="flex items-center justify-between px-8 shrink-0"
      style={{ height: 64, background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}
    >
      {/* Search — centered */}
      <div className="saas-search flex items-center gap-2 px-3 py-2" style={{ width: 360 }}>
        <span style={{ color: "var(--text-tertiary)" }}>
          <Icon name="search" size={16} />
        </span>
        <input
          type="text"
          placeholder="Search projects, tasks, team..."
          className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-text-tertiary"
          style={{ color: "var(--text-primary)" }}
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="saas-nav-icon" style={{ position: "relative" }} title="Notifications">
          <Icon name="bell" size={20} />
          <span
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--accent-rose)",
              border: "2px solid var(--bg-secondary)",
            }}
          />
        </button>

        {/* Messages */}
        <button className="saas-nav-icon" title="Messages">
          <Icon name="message" size={20} />
        </button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: "var(--border)" }} />

        {/* User profile */}
        <div className="flex items-center gap-2">
          <div className="saas-avatar" style={{ background: "var(--accent-purple)" }}>B</div>
          <div className="flex flex-col">
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Benji</span>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Workspace Owner</span>
          </div>
        </div>

        {/* New Project button */}
        <Link href="/projects">
          <button className="saas-btn-primary flex items-center gap-1.5 px-4 py-2 text-sm">
            <Icon name="plus" size={16} />
            New Project
          </button>
        </Link>
      </div>
    </header>
  );
}
