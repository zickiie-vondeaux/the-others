import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { EcgBackground } from "@/components/layout/EcgBackground";
import { BirthdayProvider } from "@/components/birthday/BirthdayProvider";
import { AchievementProvider } from "@/components/achievements/AchievementProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AchievementProvider>
      <BirthdayProvider>
        <EcgBackground />
        {/* position: relative + z-index: 1 lifts all content above the fixed ECG overlay */}
        <div className="flex h-full app-bg" style={{ position: "relative", zIndex: 1 }}>
          <Sidebar />
          <main className="flex-1 flex flex-col min-h-full overflow-auto pb-20 lg:pb-0">
            {children}
          </main>
          <MobileNav />
        </div>
      </BirthdayProvider>
    </AchievementProvider>
  );
}
