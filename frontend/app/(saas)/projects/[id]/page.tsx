"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  useProject,
  updateProject,
  updateNode,
  deleteProject,
  NODE_META,
  STATUS_META,
  type ProjectStatus,
  type NodeKind,
} from "@/lib/projectStore";
import { MindBoard } from "@/components/MindBoard";

type Tab = "overview" | "mindboard" | "tasks" | "timeline" | "settings";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [id, setId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  // Unwrap params promise (Next.js 16)
  useRef(null);
  if (id === null) {
    params.then((p) => setId(p.id));
  }

  const project = useProject(id || undefined);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-slide-up">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>Project not found</p>
        <Link href="/projects" className="saas-btn-primary px-4 py-2 text-sm">← Back to Projects</Link>
      </div>
    );
  }

  const tasks = project.nodes.filter((n) => n.kind === "task");
  const doneTasks = tasks.filter((n) => n.status === "done").length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const sm = STATUS_META[project.status];

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "📋" },
    { key: "mindboard", label: "Mind Board", icon: "🧠" },
    { key: "tasks", label: "Tasks", icon: "✓" },
    { key: "timeline", label: "Timeline", icon: "📅" },
    { key: "settings", label: "Settings", icon: "⚙" },
  ];

  return (
    <div className="animate-fade-slide-up">
      {/* Breadcrumb */}
      <Link href="/projects" className="text-xs mb-3 inline-flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: "var(--text-tertiary)" }}>
        ← Projects
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
          <div className="saas-avatar text-lg shrink-0" style={{ background: project.color, width: 48, height: 48 }}>
            {project.title.split(" ").map((w) => w[0]).join("").slice(0, 2)}
          </div>
          <div>
            {editTitle ? (
              <input
                autoFocus
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={() => { updateProject(project.id, { title: titleInput }); setEditTitle(false); }}
                onKeyDown={(e) => e.key === "Enter" && (() => { updateProject(project.id, { title: titleInput }); setEditTitle(false); })()}
                className="text-2xl font-bold tracking-tight bg-transparent border-b"
                style={{ color: "var(--text-primary)", borderColor: project.color }}
              />
            ) : (
              <h1
                className="text-2xl font-bold tracking-tight cursor-text"
                style={{ color: "var(--text-primary)" }}
                onClick={() => { setTitleInput(project.title); setEditTitle(true); }}
              >
                {project.title}
              </h1>
            )}
            <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>{project.description}</p>
          </div>
        </div>

        {/* Status selector */}
        <div className="relative">
          <button
            type="button"
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
            style={{ color: sm.color, background: sm.bg }}
            onClick={() => setStatusMenuOpen((v) => !v)}
          >
            {sm.label} ▾
          </button>
          {statusMenuOpen && (
            <div className="absolute right-0 top-full mt-1 z-30 glass rounded-lg p-1 min-w-[120px]">
              {(Object.keys(STATUS_META) as ProjectStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  className="block w-full text-left px-3 py-1.5 rounded text-xs transition-colors hover:opacity-80"
                  style={{ color: STATUS_META[s].color }}
                  onClick={() => { updateProject(project.id, { status: s }); setStatusMenuOpen(false); }}
                >
                  {STATUS_META[s].label}
                </button>
              ))}
            </div>
          )}
          </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{doneTasks} of {tasks.length} tasks complete</span>
          <span className="tnum text-xs font-medium" style={{ color: project.color }}>{progress}%</span>
        </div>
        <div className="saas-progress">
          <div className="saas-progress-fill" style={{ width: `${progress}%`, background: project.color }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b" style={{ borderColor: "var(--border)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors"
            style={{
              color: tab === t.key ? "var(--text-primary)" : "var(--text-tertiary)",
              borderBottom: tab === t.key ? `2px solid ${project.color}` : "2px solid transparent",
              marginBottom: "-1px",
            }}
            onClick={() => setTab(t.key)}
          >
            <span className="text-xs">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && <OverviewTab project={project} />}
      {tab === "mindboard" && <MindBoard projectId={project.id} project={project} />}
      {tab === "tasks" && <TasksTab project={project} />}
      {tab === "timeline" && <TimelineTab project={project} />}
      {tab === "settings" && <SettingsTab project={project} />}
    </div>
  );
}

/* ── Overview Tab ── */
function OverviewTab({ project }: { project: any }) {
  const tasks = project.nodes.filter((n: any) => n.kind === "task");
  const milestones = project.nodes.filter((n: any) => n.kind === "milestone");
  const ideas = project.nodes.filter((n: any) => n.kind === "idea");
  const doneTasks = tasks.filter((n: any) => n.status === "done").length;
  const inProgress = tasks.filter((n: any) => n.status === "in-progress").length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <div className="saas-card p-4">
        <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Tasks Done</div>
        <div className="tnum text-2xl font-bold" style={{ color: "#22C55E" }}>{doneTasks}</div>
      </div>
      <div className="saas-card p-4">
        <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>In Progress</div>
        <div className="tnum text-2xl font-bold" style={{ color: "#F59E0B" }}>{inProgress}</div>
      </div>
      <div className="saas-card p-4">
        <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Milestones</div>
        <div className="tnum text-2xl font-bold" style={{ color: "#F43F5E" }}>{milestones.length}</div>
      </div>
      <div className="saas-card p-4">
        <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Ideas</div>
        <div className="tnum text-2xl font-bold" style={{ color: "#8B5CF6" }}>{ideas.length}</div>
      </div>

      <div className="col-span-2 lg:col-span-4 saas-card p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Project Breakdown</h3>
        <div className="space-y-2">
          {Object.entries(
            project.nodes.reduce((acc: Record<string, number>, n: any) => {
              acc[n.kind] = (acc[n.kind] || 0) + 1;
 return acc;
            }, {} as Record<string, number>)
          ).map(([kind, count]) => {
            const meta = NODE_META[kind as NodeKind];
            const num = count as number;
 return (
              <div key={kind} className="flex items-center gap-3">
                <span className="text-sm">{meta.icon}</span>
                <span className="text-sm flex-1" style={{ color: "var(--text-secondary)" }}>{meta.label}</span>
                <span className="tnum text-sm font-medium" style={{ color: meta.color }}>{num}</span>
              </div>
            );
          })}
        </div>
      </div>

      {project.deadline && (
        <div className="col-span-2 lg:col-span-4 saas-card p-5">
          <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Deadline</h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {new Date(project.deadline).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Tasks Tab ── */
function TasksTab({ project }: { project: any }) {
  const tasks = project.nodes.filter((n: any) => n.kind === "task" || n.kind === "milestone");
  return (
    <div className="space-y-1">
      {tasks.length === 0 && (
        <div className="text-center py-12 opacity-60">
          <div className="text-3xl mb-2">✓</div>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No tasks yet. Add some from the Mind Board.</p>
        </div>
      )}
      {tasks.map((node: any) => {
        const meta = NODE_META[node.kind as NodeKind];
 return (
          <div key={node.id} className="saas-card p-3 flex items-center gap-3">
            <button
              type="button"
              className="text-sm shrink-0 px-2 py-1 rounded transition-colors"
              style={{
                background: node.status === "done" ? "rgba(34,197,94,0.15)" : node.status === "in-progress" ? "rgba(245,158,11,0.15)" : "var(--bg-hover)",
                color: node.status === "done" ? "#22C55E" : node.status === "in-progress" ? "#F59E0B" : "var(--text-tertiary)",
              }}
              onClick={() => {
                const next = node.status === "todo" ? "in-progress" : node.status === "in-progress" ? "done" : "todo";
                updateNode(project.id, node.id, { status: next });
              }}
            >
              {node.status === "done" ? "✓" : node.status === "in-progress" ? "◐" : "○"}
            </button>
            <span className="text-sm">{meta.icon}</span>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${node.status === "done" ? "line-through opacity-50" : ""}`} style={{ color: "var(--text-primary)" }}>
                {node.title}
              </div>
              {node.description && (
                <div className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>{node.description}</div>
              )}
            </div>
            {node.priority && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  color: node.priority === "urgent" ? "#F43F5E" : node.priority === "high" ? "#F59E0B" : node.priority === "medium" ? "#3B82F6" : "var(--text-tertiary)",
                  background: node.priority === "urgent" ? "rgba(244,63,94,0.12)" : node.priority === "high" ? "rgba(245,158,11,0.12)" : "var(--bg-hover)",
                }}
              >
                {node.priority}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Timeline Tab ── */
function TimelineTab({ project }: { project: any }) {
  const nodes = [...project.nodes].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return (
    <div className="space-y-3">
      <div className="relative pl-6">
        <div className="absolute left-2 top-0 bottom-0 w-0.5" style={{ background: "var(--border)" }} />
        {nodes.map((node: any) => {
          const meta = NODE_META[node.kind as NodeKind];
 return (
            <div key={node.id} className="relative mb-3">
              <div
                className="absolute -left-4 top-1.5 w-3 h-3 rounded-full"
                style={{ background: meta.color, boxShadow: `0 0 0 3px var(--bg-primary)` }}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm">{meta.icon}</span>
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{node.title}</span>
              </div>
              {node.description && (
                <div className="text-xs ml-6 mt-0.5" style={{ color: "var(--text-tertiary)" }}>{node.description}</div>
              )}
              <div className="tnum text-xs ml-6 mt-1" style={{ color: "var(--text-tertiary)" }}>
                {new Date(node.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Settings Tab ── */
function SettingsTab({ project }: { project: any }) {
  return (
    <div className="space-y-4">
      <div className="saas-card p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Project Settings</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-tertiary)" }}>Title</label>
            <input
              defaultValue={project.title}
              onBlur={(e) => updateProject(project.id, { title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-tertiary)" }}>Description</label>
            <textarea
              defaultValue={project.description}
              onBlur={(e) => updateProject(project.id, { description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border resize-none"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: "var(--text-tertiary)" }}>Deadline</label>
            <input
              type="date"
              defaultValue={project.deadline?.split("T")[0] || ""}
              onBlur={(e) => updateProject(project.id, { deadline: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
              className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
        </div>
      </div>

      <div className="saas-card p-5" style={{ border: "1px solid rgba(244,63,94,0.2)" }}>
        <h3 className="text-sm font-semibold mb-2" style={{ color: "#F43F5E" }}>Danger Zone</h3>
        <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>Deleting a project removes all its nodes and data. This cannot be undone.</p>
        <button
          type="button"
          className="px-4 py-2 text-sm rounded-lg transition-colors"
          style={{ background: "rgba(244,63,94,0.12)", color: "#F43F5E" }}
          onClick={() => {
            if (confirm(`Delete "${project.title}"? This cannot be undone.`)) {
              deleteProject(project.id);
              window.location.href = "/projects";
            }
          }}
        >
          Delete project
        </button>
      </div>
    </div>
  );
}
