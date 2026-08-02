"use client";

import Link from "next/link";
import { useState } from "react";
import {
  useProjects,
  createProject,
  deleteProject,
  projectProgress,
  PROJECT_COLORS,
  STATUS_META,
  type Project,
  type ProjectStatus,
} from "@/lib/projectStore";

export default function ProjectsPage() {
  const projects = useProjects();
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [filter, setFilter] = useState<"all" | ProjectStatus>("all");

  const filtered = filter === "all" ? projects : projects.filter((p) => p.status === filter);

  const handleCreate = () => {
    if (!title.trim()) return;
    createProject(title.trim(), description.trim(), color);
    setTitle("");
    setDescription("");
    setColor(PROJECT_COLORS[0]);
    setShowNew(false);
  };

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === "active").length,
    planning: projects.filter((p) => p.status === "planning").length,
    completed: projects.filter((p) => p.status === "completed").length,
  };

  return (
    <div className="animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Projects</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Plan, track, and visualize your work</p>
        </div>
        <button type="button" className="saas-btn-primary px-4 py-2 text-sm" onClick={() => setShowNew((v) => !v)}>
          {showNew ? "Cancel" : "+ New Project"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, color: "var(--accent-indigo, #6366f1)" },
          { label: "Active", value: stats.active, color: "#22C55E" },
          { label: "Planning", value: stats.planning, color: "#F59E0B" },
          { label: "Completed", value: stats.completed, color: "#3B82F6" },
        ].map((s) => (
          <div key={s.label} className="saas-card p-3 flex flex-col gap-1">
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{s.label}</div>
            <div className="tnum text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* New project form */}
      {showNew && (
        <div className="saas-card p-4 mb-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="saas-avatar" style={{ background: color }}>
                {title ? title.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "??"}
              </div>
              <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>New Project</span>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: "var(--text-tertiary)" }}>Project name</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="e.g. Website Redesign"
                className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: "var(--text-tertiary)" }}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this project about?"
                rows={2}
                className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border resize-none"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: "var(--text-tertiary)" }}>Color</label>
              <div className="flex items-center gap-2">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                    style={{ background: c, boxShadow: color === c ? `0 0 0 3px var(--bg-primary), 0 0 0 5px ${c}` : "none" }}
                    onClick={() => setColor(c)}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>
            <button type="button" className="saas-btn-primary px-4 py-2 text-sm w-fit" onClick={handleCreate}>
              Create project
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-4">
        {(["all", "planning", "active", "completed"] as const).map((f) => (
          <button
            key={f}
            type="button"
            className="text-xs px-3 py-1 rounded-full transition-colors"
            style={{
              background: filter === f ? "var(--accent-indigo, #6366f1)" : "var(--bg-hover)",
              color: filter === f ? "#fff" : "var(--text-secondary)",
            }}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Project grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((project) => {
          const progress = projectProgress(project);
          const sm = STATUS_META[project.status];
          const tasks = project.nodes.filter((n) => n.kind === "task");
          const doneTasks = tasks.filter((n) => n.status === "done").length;
          return (
            <div key={project.id} className="saas-card p-0 overflow-hidden group">
              {/* Color header */}
              <div className="h-2" style={{ background: project.color }} />
              <Link href={`/projects/${project.id}`} className="block p-5" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="saas-avatar" style={{ background: project.color }}>
                    {project.title.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ color: sm.color, background: sm.bg }}
                  >
                    {sm.label}
                  </span>
                </div>
                <div className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  {project.title}
                </div>
                <div className="text-xs mb-3 line-clamp-2" style={{ color: "var(--text-tertiary)" }}>
                  {project.description}
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {doneTasks}/{tasks.length} tasks
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>·</span>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {project.members.length} member{project.members.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="saas-progress mb-1">
                  <div
                    className="saas-progress-fill"
                    style={{ width: `${progress}%`, background: project.color }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="tnum text-xs" style={{ color: "var(--text-tertiary)" }}>{progress}% done</span>
                  {project.deadline && (
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      Due {new Date(project.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 opacity-60">
          <div className="text-4xl mb-3">📁</div>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {filter === "all" ? "No projects yet. Create one to get started." : `No ${filter} projects.`}
          </p>
        </div>
      )}
    </div>
  );
}
