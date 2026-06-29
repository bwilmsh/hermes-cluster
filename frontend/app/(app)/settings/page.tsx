"use client";

export default function SettingsPage() {
  return (
    <div className="animate-fade-slide-up">
      <div className="accent-bar mb-6"><h1 className="text-2xl font-bold tracking-tight">Settings</h1></div>
      <div className="space-y-4 stagger">
        {/* Profile */}
        <div className="glass p-5">
          <h2 className="text-sm font-semibold mb-3">Profile</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-text-tertiary block mb-1">Email</label>
              <input defaultValue="demo@ai-scheduler.local" className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border" style={{ borderColor: "var(--border)" }} />
            </div>
            <div>
              <label className="text-xs text-text-tertiary block mb-1">Name</label>
              <input defaultValue="Demo User" className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border" style={{ borderColor: "var(--border)" }} />
            </div>
          </div>
        </div>
        {/* Plan */}
        <div className="glass p-5">
          <h2 className="text-sm font-semibold mb-3">Plan</h2>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-sm font-medium text-white" style={{ background: "var(--accent-indigo)" }}>PRO</span>
            <span className="text-sm text-text-secondary">Unlimited agents, all workflows, integrations</span>
          </div>
        </div>
        {/* Agent API Key */}
        <div className="glass p-5">
          <h2 className="text-sm font-semibold mb-3">Agent Service</h2>
          <p className="text-sm text-text-secondary mb-3">Configure the AI provider for agent chat. Without a key, the agent service runs in offline mode.</p>
          <label className="text-xs text-text-tertiary block mb-1">API Key</label>
          <input type="password" placeholder="sk-..." className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border" style={{ borderColor: "var(--border)" }} />
        </div>
      </div>
    </div>
  );
}
