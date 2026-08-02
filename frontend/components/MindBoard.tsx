"use client";

/**
 * MindBoard — interactive draggable mind map with SVG connection lines.
 * Nodes can be dragged, edited, connected, and deleted.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import {
  NODE_META,
  type ProjectNode,
  type NodeKind,
  type Project,
  useProject,
  addNode,
  updateNode,
  deleteNode,
} from "@/lib/projectStore";

interface MindBoardProps {
  projectId: string;
  project: Project;
}

const NODE_W = 180;
const NODE_H = 80;

export function MindBoard({ projectId, project }: MindBoardProps) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState<{ parentId: string; x: number; y: number } | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const boardRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  /* ── Pan with background drag ── */
  const handleBackgroundDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains("mind-board-canvas")) {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      setSelected(null);
      setShowAddMenu(null);
    }
  };

  useEffect(() => {
    if (!isPanning) return;
    const handleMove = (e: MouseEvent) => {
      setPan({
        x: panStart.current.panX + (e.clientX - panStart.current.x),
        y: panStart.current.panY + (e.clientY - panStart.current.y),
      });
    };
    const handleUp = () => setIsPanning(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isPanning]);

  /* ── Node dragging ── */
  const handleNodeDown = useCallback((e: React.MouseEvent, node: ProjectNode) => {
    e.stopPropagation();
    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left - node.x * zoom + pan.x,
        y: e.clientY - rect.top - node.y * zoom + pan.y,
      };
    }
    setDragging(node.id);
    setSelected(node.id);
  }, [zoom, pan]);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      if (!boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - dragOffset.current.x) / zoom;
      const y = (e.clientY - rect.top - dragOffset.current.y) / zoom;
      updateNode(projectId, dragging, { x: Math.round(x), y: Math.round(y) });
    };
    const handleUp = () => setDragging(null);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, projectId, zoom]);

  /* ── Connection lines ── */
  const findChildren = (parentId: string) => project.nodes.filter((n) => n.parentId === parentId);

  const renderConnection = (parent: ProjectNode, child: ProjectNode, key: number) => {
    const x1 = parent.x + NODE_W / 2;
    const y1 = parent.y + NODE_H;
    const x2 = child.x + NODE_W / 2;
    const y2 = child.y;
    const midY = (y1 + y2) / 2;
    const path = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
    return (
      <path
        key={key}
        d={path}
        fill="none"
        stroke="var(--border, rgba(255,255,255,0.08))"
        strokeWidth={2}
        strokeDasharray="4 4"
        style={{ pointerEvents: "none" }}
      />
    );
  };

  /* ── Add child node ── */
  const addChildNode = (parentId: string, kind: NodeKind, title: string) => {
    const parent = project.nodes.find((n) => n.id === parentId);
    if (!parent) return;
    const offset = findChildren(parentId).length * 40;
    addNode(projectId, kind, title, parentId, parent.x + offset - 100, parent.y + 160, "");
    setShowAddMenu(null);
  };

  /* ── Edit node ── */
  const startEdit = (node: ProjectNode) => {
    setEditing(node.id);
    setEditTitle(node.title);
    setEditDesc(node.description || "");
  };

  const saveEdit = () => {
    if (editing) {
      updateNode(projectId, editing, { title: editTitle, description: editDesc });
    }
    setEditing(null);
  };

  /* ── Zoom ── */
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((z) => Math.max(0.3, Math.min(2, z + delta)));
    }
  };

  const selectedNode = selected ? project.nodes.find((n) => n.id === selected) : null;

  return (
    <div className="relative flex-1 flex min-h-0 rounded-xl overflow-hidden" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
      {/* Toolbar */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 glass rounded-lg px-3 py-1.5">
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          {project.nodes.length} nodes
        </span>
        <span className="mx-1" style={{ color: "var(--border)" }}>·</span>
        <button
          type="button"
          className="text-xs px-2 py-0.5 rounded transition-colors hover:opacity-80"
          style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}
          onClick={() => addNode(projectId, "idea", "New Idea", null, 400, 80)}
        >
          + Root Node
        </button>
      </div>

      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 glass rounded-lg px-2 py-1">
        <button type="button" className="text-sm px-2 py-0.5 rounded hover:opacity-80" style={{ color: "var(--text-secondary)" }} onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}>−</button>
        <span className="tnum text-xs" style={{ color: "var(--text-tertiary)" }}>{Math.round(zoom * 100)}%</span>
        <button type="button" className="text-sm px-2 py-0.5 rounded hover:opacity-80" style={{ color: "var(--text-secondary)" }} onClick={() => setZoom((z) => Math.min(2, z + 0.1))}>+</button>
        <button type="button" className="text-xs px-2 py-0.5 rounded hover:opacity-80 ml-1" style={{ color: "var(--text-tertiary)" }} onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Reset</button>
      </div>

      {/* Board */}
      <div
        ref={boardRef}
        className="mind-board-canvas flex-1 relative overflow-hidden"
        onMouseDown={handleBackgroundDown}
        onWheel={handleWheel}
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            backgroundPosition: "0 0",
          }}
        >
          {/* SVG connections */}
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            style={{ width: "100%", height: "100%", overflow: "visible" }}
          >
            {project.nodes.map((node) =>
              project.nodes
                .filter((child) => child.parentId === node.id)
                .map((child, i) => renderConnection(node, child, i))
            )}
          </svg>

          {/* Nodes */}
          {project.nodes.map((node) => {
            const meta = NODE_META[node.kind];
            const isSelected = selected === node.id;
            return (
              <div
                key={node.id}
                className={`absolute rounded-lg border-2 transition-shadow ${dragging === node.id ? "opacity-80 cursor-grabbing" : "cursor-grab"}`}
                style={{
                  left: node.x,
                  top: node.y,
                  width: NODE_W,
                  minHeight: NODE_H,
                  background: "var(--bg-elevated, var(--bg-primary))",
                  borderColor: isSelected ? meta.color : meta.border,
                  boxShadow: isSelected ? `0 0 0 2px ${meta.color}40` : "none",
                  zIndex: dragging === node.id ? 100 : isSelected ? 50 : 10,
                }}
                onMouseDown={(e) => handleNodeDown(e, node)}
                onClick={(e) => { e.stopPropagation(); setSelected(node.id); }}
              >
                {/* Node content */}
                <div className="flex items-start gap-2 p-3">
                  <span className="text-lg shrink-0">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    {editing === node.id ? (
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                        className="w-full text-sm font-semibold bg-transparent border-none outline-none"
                        style={{ color: "var(--text-primary)" }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {node.title}
                      </div>
                    )}
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {meta.label}
                    </div>
                  </div>
                  {/* Status toggle */}
                  <button
                    type="button"
                    className="text-xs shrink-0 px-1.5 py-0.5 rounded transition-colors"
                    style={{
                      background: node.status === "done" ? "rgba(34,197,94,0.15)" : node.status === "in-progress" ? "rgba(245,158,11,0.15)" : "var(--bg-hover)",
                      color: node.status === "done" ? "#22C55E" : node.status === "in-progress" ? "#F59E0B" : "var(--text-tertiary)",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = node.status === "todo" ? "in-progress" : node.status === "in-progress" ? "done" : "todo";
                      updateNode(projectId, node.id, { status: next });
                    }}
                  >
                    {node.status === "done" ? "✓" : node.status === "in-progress" ? "◐" : "○"}
                  </button>
                </div>
                {/* Node footer */}
                <div className="flex items-center gap-1 px-3 pb-2 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                  {findChildren(node.id).length > 0 && (
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {findChildren(node.id).length} child
                    </span>
                  )}
                  <div className="flex-1" />
                  <button
                    type="button"
                    className="text-xs px-1.5 py-0.5 rounded hover:opacity-80 transition-opacity"
                    style={{ background: "var(--bg-hover)", color: "var(--text-tertiary)" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddMenu(showAddMenu?.parentId === node.id ? null : { parentId: node.id, x: node.x, y: node.y });
                    }}
                    title="Add child"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="text-xs px-1.5 py-0.5 rounded hover:opacity-80 transition-opacity"
                    style={{ background: "var(--bg-hover)", color: "var(--text-tertiary)" }}
                    onClick={(e) => { e.stopPropagation(); startEdit(node); }}
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="text-xs px-1.5 py-0.5 rounded hover:opacity-80 transition-opacity"
                    style={{ background: "rgba(244,63,94,0.1)", color: "#F43F5E" }}
                    onClick={(e) => { e.stopPropagation(); deleteNode(projectId, node.id); }}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add child menu */}
      {showAddMenu && (
        <div
          className="absolute z-30 glass rounded-lg p-2"
          style={{ left: 320, top: 60 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>Add node</div>
          <div className="flex flex-col gap-1">
            {(["idea", "task", "note", "milestone", "question"] as NodeKind[]).map((kind) => {
              const meta = NODE_META[kind];
              return (
                <button
                  key={kind}
                  type="button"
                  className="flex items-center gap-2 px-3 py-1.5 rounded transition-colors hover:opacity-80 text-left"
                  style={{ background: meta.bg, color: "var(--text-primary)" }}
                  onClick={() => addChildNode(showAddMenu.parentId, kind, `New ${meta.label}`)}
                >
                  <span>{meta.icon}</span>
                  <span className="text-sm">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Side panel for editing */}
      {editing && (
        <div className="absolute bottom-3 left-3 right-3 z-30 glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Edit Node</span>
            <button type="button" className="text-sm" style={{ color: "var(--text-tertiary)" }} onClick={() => setEditing(null)}>✕</button>
          </div>
          <div className="flex flex-col gap-2">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Node title"
              className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border resize-none"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
            <div className="flex gap-2">
              <button type="button" className="saas-btn-primary px-4 py-2 text-sm" onClick={saveEdit}>Save</button>
              <button type="button" className="px-4 py-2 text-sm rounded-lg" style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }} onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
