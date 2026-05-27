import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { BirthdayProvider } from "@/components/birthday/BirthdayProvider";
import { AchievementProvider } from "@/components/achievements/AchievementProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AchievementProvider>
      <BirthdayProvider>
        <div className="flex h-full app-bg">
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
