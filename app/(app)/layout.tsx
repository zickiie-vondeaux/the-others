import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full" style={{ backgroundColor: "var(--color-bg)" }}>
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-full overflow-auto pb-20 lg:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
