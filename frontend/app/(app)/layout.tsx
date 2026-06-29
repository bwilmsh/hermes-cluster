import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 min-h-0 overflow-auto dot-grid">
        <div className="mx-auto max-w-6xl px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
