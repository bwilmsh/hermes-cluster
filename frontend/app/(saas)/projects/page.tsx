"use client";

import Link from "next/link";
import { useState } from "react";

const SEED = [
  "Mobile App Redesign",
  "API Migration",
  "Marketing Website",
  "Q3 Roadmap",
  "Customer Onboarding",
  "Security Audit",
];

const COLORS = ["#FF6B35", "#8B5CF6", "#3B82F6", "#22C55E", "#F59E0B", "#F43F5E"];

export default function ProjectsPage() {
  const [projects, setProjects] = useState(SEED);
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");

  const addProject = () => {
    if (!title.trim()) return;
    setProjects((prev) => [title.trim(), ...prev]);
    setTitle("");
    setShowNew(false);
  };

  return (
    <div className="animate-fade-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Projects</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Manage and track all your projects</p>
        </div>
        <button type="button" className="saas-btn-primary px-4 py-2 text-sm" onClick={() => setShowNew((v) => !v)}>
          {showNew ? "Cancel" : "+ New Project"}
        </button>
      </div>

      {showNew && (
        <div className="saas-card p-4 mb-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex-1">
            <label className="text-xs block mb-1" style={{ color: "var(--text-tertiary)" }}>Project name</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addProject()}
              placeholder="e.g. Website Redesign"
              className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              autoFocus
            />
          </div>
          <button type="button" className="saas-btn-primary px-4 py-2 text-sm" onClick={addProject}>
            Create project
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((projectTitle, i) => (
          <Link
            key={`${projectTitle}-${i}`}
            href="/tasks"
            className="saas-card p-5 flex flex-col gap-3"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className="flex items-center justify-between">
              <div className="saas-avatar" style={{ background: COLORS[i % COLORS.length] }}>
                {projectTitle.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </div>
              <span className="saas-pill" style={{ color: "#22C55E", background: "#E8F5E9" }}>On Track</span>
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{projectTitle}</div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{8 + i * 3} tasks · {2 + (i % 3)} members</div>
            </div>
            <div className="saas-progress">
              <div className="saas-progress-fill" style={{ width: `${Math.min(40 + i * 12, 100)}%`, background: "#FF6B35" }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
