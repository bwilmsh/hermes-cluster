"use client";

const PROVIDERS = [
  { id: "google", name: "Google", description: "Calendar + Gmail integration", icon: "G", color: "#4285f4", connected: false },
  { id: "slack", name: "Slack", description: "Send and receive messages", icon: "S", color: "#4a154b", connected: false },
  { id: "notion", name: "Notion", description: "Sync pages and databases", icon: "N", color: "#000000", connected: false },
];

export default function IntegrationsPage() {
  return (
    <div className="animate-fade-slide-up">
      <div className="accent-bar mb-6"><h1 className="text-2xl font-bold tracking-tight">Integrations</h1></div>
      <div className="grid md:grid-cols-3 gap-4 stagger">
        {PROVIDERS.map((p) => (
          <div key={p.id} className="glass p-5 card-hover">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold text-white" style={{ background: p.color }}>
                {p.icon}
              </div>
              <div>
                <h3 className="font-medium">{p.name}</h3>
                <span className={`text-xs ${p.connected ? "" : "text-text-tertiary"}`} style={p.connected ? { color: "var(--accent-green)" } : {}}>● {p.connected ? "Connected" : "Not connected"}</span>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-4">{p.description}</p>
            <button
              className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${p.connected ? "glass" : "text-white"}`}
              style={!p.connected ? { background: "var(--accent-indigo)" } : {}}
            >
              {p.connected ? "Disconnect" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
