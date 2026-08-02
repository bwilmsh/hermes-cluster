"use client";

/**
 * Project store — manages projects and their mind-board nodes.
 * Uses a module-level singleton (same pattern as eventStore).
 */

import { useSyncExternalStore } from "react";

/* ── Types ── */

export type NodeKind = "idea" | "task" | "note" | "milestone" | "question";
export type ProjectStatus = "planning" | "active" | "on-hold" | "completed";

export interface ProjectNode {
  id: string;
  kind: NodeKind;
  title: string;
  description?: string;
  x: number;
  y: number;
  parentId: string | null;
  status: "todo" | "in-progress" | "done";
  priority?: "low" | "medium" | "high" | "urgent";
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  color: string;
  status: ProjectStatus;
  members: string[];
  deadline?: string;
  createdAt: string;
  nodes: ProjectNode[];
}

/* ── Colors palette for new projects ── */
export const PROJECT_COLORS = [
  "#FF6B35", "#8B5CF6", "#3B82F6", "#22C55E",
  "#F59E0B", "#F43F5E", "#06B6D4", "#EC4899",
];

/* ── Node type meta ── */
export const NODE_META: Record<NodeKind, { label: string; icon: string; color: string; bg: string; border: string }> = {
  idea:      { label: "Idea",      icon: "💡", color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.35)" },
  task:      { label: "Task",      icon: "✓",  color: "#3B82F6", bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.35)" },
  note:      { label: "Note",      icon: "📝", color: "#8B5CF6", bg: "rgba(139,92,246,0.08)",  border: "rgba(139,92,246,0.35)" },
  milestone: { label: "Milestone", icon: "🚩", color: "#F43F5E", bg: "rgba(244,63,94,0.08)",   border: "rgba(244,63,94,0.35)" },
  question:  { label: "Question",  icon: "?",  color: "#06B6D4", bg: "rgba(6,182,212,0.08)",   border: "rgba(6,182,212,0.35)" },
};

export const STATUS_META: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  planning:  { label: "Planning", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  active:    { label: "Active",   color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  "on-hold": { label: "On Hold",  color: "#6B7280", bg: "rgba(107,114,128,0.12)" },
  completed: { label: "Completed", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
};

/* ── Seed data ── */

function seedNodes(): ProjectNode[] {
  return [
    { id: "n-1", kind: "milestone", title: "Project Vision", description: "What we're building and why", x: 400, y: 60, parentId: null, status: "done", createdAt: new Date().toISOString() },
    { id: "n-2", kind: "idea", title: "Core Features", description: "The main pillars of the product", x: 150, y: 200, parentId: "n-1", status: "done", createdAt: new Date().toISOString() },
    { id: "n-3", kind: "task", title: "Research & Discovery", description: "User interviews, competitive analysis", x: 650, y: 200, parentId: "n-1", status: "in-progress", priority: "high", createdAt: new Date().toISOString() },
    { id: "n-4", kind: "task", title: "Wireframe MVP", description: "Low-fidelity sketches of key flows", x: 80, y: 360, parentId: "n-2", status: "todo", priority: "medium", createdAt: new Date().toISOString() },
    { id: "n-5", kind: "task", title: "Tech Stack Decision", description: "Finalize framework, database, hosting", x: 300, y: 360, parentId: "n-2", status: "todo", priority: "urgent", createdAt: new Date().toISOString() },
    { id: "n-6", kind: "question", title: "Target Audience?", description: "Who are we building this for?", x: 650, y: 360, parentId: "n-3", status: "todo", createdAt: new Date().toISOString() },
    { id: "n-7", kind: "milestone", title: "MVP Launch", description: "First version ready for users", x: 900, y: 200, parentId: "n-3", status: "todo", createdAt: new Date().toISOString() },
    { id: "n-8", kind: "note", title: "Design Inspiration", description: "Links to reference designs and moodboards", x: 500, y: 500, parentId: "n-4", status: "todo", createdAt: new Date().toISOString() },
  ];
}

const SEED_PROJECTS: Project[] = [
  {
    id: "p-1",
    title: "Mobile App Redesign",
    description: "Complete overhaul of the mobile app UI/UX with a focus on accessibility and onboarding flow.",
    color: "#FF6B35",
    status: "active",
    members: ["Benji", "Sarah", "Tom"],
    deadline: "2026-08-30",
    createdAt: "2026-07-01T10:00:00Z",
    nodes: seedNodes(),
  },
  {
    id: "p-2",
    title: "API Migration",
    description: "Migrate from REST to GraphQL with zero downtime. Includes schema design and client SDK updates.",
    color: "#8B5CF6",
    status: "active",
    members: ["Benji", "Mike"],
    deadline: "2026-09-15",
    createdAt: "2026-06-15T10:00:00Z",
    nodes: [
      { id: "na1", kind: "milestone", title: "Migration Plan", description: "Phased rollout strategy", x: 400, y: 60, parentId: null, status: "done", createdAt: new Date().toISOString() },
      { id: "na2", kind: "task", title: "Schema Design", description: "Define all GraphQL types and resolvers", x: 150, y: 200, parentId: "na1", status: "in-progress", priority: "urgent", createdAt: new Date().toISOString() },
      { id: "na3", kind: "task", title: "Resolver Implementation", description: "Write and test all resolvers", x: 650, y: 200, parentId: "na1", status: "todo", priority: "high", createdAt: new Date().toISOString() },
      { id: "na4", kind: "idea", title: "Code Generation", description: "Auto-generate TypeScript types from schema", x: 400, y: 360, parentId: "na2", status: "todo", createdAt: new Date().toISOString() },
    ],
  },
  {
    id: "p-3",
    title: "Marketing Website",
    description: "New marketing site with blog, CMS integration, and SEO optimization.",
    color: "#3B82F6",
    status: "planning",
    members: ["Benji", "Lisa"],
    createdAt: "2026-07-20T10:00:00Z",
    nodes: [
      { id: "nb1", kind: "milestone", title: "Content Strategy", description: "Define messaging and content pillars", x: 400, y: 80, parentId: null, status: "todo", createdAt: new Date().toISOString() },
      { id: "nb2", kind: "idea", title: "Design System", description: "Typography, colors, components", x: 150, y: 220, parentId: "nb1", status: "todo", createdAt: new Date().toISOString() },
      { id: "nb3", kind: "task", title: "SEO Research", description: "Keyword analysis and competitor audit", x: 650, y: 220, parentId: "nb1", status: "todo", priority: "medium", createdAt: new Date().toISOString() },
    ],
  },
  {
    id: "p-4",
    title: "Security Audit",
    description: "Comprehensive security review including penetration testing and compliance check.",
    color: "#F43F5E",
    status: "completed",
    members: ["Benji"],
    createdAt: "2026-05-01T10:00:00Z",
    nodes: [
      { id: "nc1", kind: "milestone", title: "Audit Complete", description: "All checks passed, report delivered", x: 400, y: 80, parentId: null, status: "done", createdAt: new Date().toISOString() },
    ],
  },
];

/* ── Module-level store ── */

let projects: Project[] = SEED_PROJECTS;
let cachedSnapshot: Project[] = projects;
let currentProjectId: string | null = null;
let cachedDetail: Project | null = null;

type Listener = () => void;
const listeners = new Set<Listener>();

const emit = () => {
  cachedSnapshot = [...projects];
  cachedDetail = currentProjectId ? projects.find((p) => p.id === currentProjectId) || null : null;
  for (const l of listeners) l();
};

const subscribe = (l: Listener) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/* ── Selectors (cached snapshots) ── */

const getProjectsSnapshot = () => cachedSnapshot;
const getProjectDetailSnapshot = () => cachedDetail;

export function useProjects(): Project[] {
  return useSyncExternalStore(subscribe, getProjectsSnapshot, getProjectsSnapshot);
}

export function useProject(id: string | undefined): Project | null {
  if (id && currentProjectId !== id) {
    currentProjectId = id;
    cachedDetail = projects.find((p) => p.id === id) || null;
  }
  return useSyncExternalStore(subscribe, getProjectDetailSnapshot, getProjectDetailSnapshot);
}

/* ── Mutations ── */

export function createProject(title: string, description: string, color: string): Project {
  const id = `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const project: Project = {
    id,
    title,
    description: description || "No description yet.",
    color,
    status: "planning",
    members: ["You"],
    createdAt: new Date().toISOString(),
    nodes: [
      { id: `n-${Date.now()}`, kind: "milestone", title: title, description: "Project root", x: 400, y: 80, parentId: null, status: "todo", createdAt: new Date().toISOString() },
    ],
  };
  projects = [project, ...projects];
  emit();
  return project;
}

export function updateProject(id: string, patch: Partial<Project>) {
  projects = projects.map((p) => (p.id === id ? { ...p, ...patch } : p));
  emit();
}

export function deleteProject(id: string) {
  projects = projects.filter((p) => p.id !== id);
  emit();
}

/* ── Node mutations ── */

export function addNode(
  projectId: string,
  kind: NodeKind,
  title: string,
  parentId: string | null,
  x: number,
  y: number,
  description?: string
): ProjectNode | null {
  const node: ProjectNode = {
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    kind,
    title,
    description,
    x,
    y,
    parentId,
    status: "todo",
    createdAt: new Date().toISOString(),
  };
  projects = projects.map((p) =>
    p.id === projectId ? { ...p, nodes: [...p.nodes, node] } : p
  );
  emit();
  return node;
}

export function updateNode(projectId: string, nodeId: string, patch: Partial<ProjectNode>) {
  projects = projects.map((p) =>
    p.id === projectId
      ? { ...p, nodes: p.nodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)) }
      : p
  );
  emit();
}

export function deleteNode(projectId: string, nodeId: string) {
  // Also delete children that reference this node as parent
  projects = projects.map((p) => {
    if (p.id !== projectId) return p;
    const toDelete = new Set<string>([nodeId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const n of p.nodes) {
        if (n.parentId && toDelete.has(n.parentId) && !toDelete.has(n.id)) {
          toDelete.add(n.id);
          changed = true;
        }
      }
    }
    return { ...p, nodes: p.nodes.filter((n) => !toDelete.has(n.id)) };
  });
  emit();
}

/* ── Helpers ── */

export function projectProgress(project: Project): number {
  const tasks = project.nodes.filter((n) => n.kind === "task" || n.kind === "milestone");
  if (tasks.length === 0) return 0;
  const done = tasks.filter((n) => n.status === "done").length;
  return Math.round((done / tasks.length) * 100);
}
