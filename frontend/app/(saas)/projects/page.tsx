"use client";

export default function ProjectsPage() {
  return (
    <div className="animate-fade-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Projects</h1>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Manage and track all your projects</p>
        </div>
        <button className="saas-btn-primary px-4 py-2 text-sm">+ New Project</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {["Mobile App Redesign", "API Migration", "Marketing Website", "Q3 Roadmap", "Customer Onboarding", "Security Audit"].map((title, i) => (
          <div key={i} className="saas-card p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="saas-avatar" style={{ background: ["#FF6B35", "#8B5CF6", "#3B82F6", "#22C55E", "#F59E0B", "#F43F5E"][i] }}>
                {title.split(" ").map(w => w[0]).join("").slice(0, 2)}
              </div>
              <span className="saas-pill" style={{ color: "#22C55E", background: "#E8F5E9" }}>On Track</span>
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{8 + i * 3} tasks · {2 + i % 3} members</div>
            </div>
            <div className="saas-progress">
              <div className="saas-progress-fill" style={{ width: `${40 + i * 12}%`, background: "#FF6B35" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
