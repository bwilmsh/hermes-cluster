"use client";

export default function HelpPage() {
  const faqs = [
    { q: "How do I create a new project?", a: "Click the 'New Project' button in the top navigation bar or on the Projects page." },
    { q: "How do I invite team members?", a: "Go to the Team page and click 'Invite Member' to send an email invitation." },
    { q: "Can I customize my dashboard?", a: "Yes, use the Manage button on the dashboard to toggle widgets on and off." },
    { q: "How do I change the theme?", a: "Currently the dashboard uses a light SaaS theme. Dark mode toggle is available on the dashboard AI Assistant card." },
    { q: "How do I set up integrations?", a: "Navigate to the Integrations page to connect external services." },
  ];
  return (
    <div className="animate-fade-slide-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Help & Support</h1>
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Find answers to common questions</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="saas-card-lg p-6 lg:col-span-2">
          <h3 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Frequently Asked Questions</h3>
          <div className="flex flex-col gap-3">
            {faqs.map((f, i) => (
              <div key={i} className="p-4 rounded-lg" style={{ background: "var(--bg-tertiary)", borderRadius: "var(--radius-xs)" }}>
                <div className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>{f.q}</div>
                <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{f.a}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="saas-card-lg p-6 flex flex-col gap-4">
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Contact Support</h3>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Need more help? Reach out to us.</p>
          <button className="saas-btn-primary w-full py-2.5 text-sm">Contact Us</button>
          <button className="saas-btn w-full py-2.5 text-sm">Documentation</button>
          <button className="saas-btn w-full py-2.5 text-sm">Community Forum</button>
        </div>
      </div>
    </div>
  );
}
