"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { createClient } from "@/lib/supabase/client";
import { ROLE_TIER, type Role } from "@/lib/roles";
import { InvitesSection }        from "@/components/admin/InvitesSection";
import { MembersSection }        from "@/components/admin/MembersSection";
import { ContentSection }        from "@/components/admin/ContentSection";
import { ProfileOverrideSection } from "@/components/admin/ProfileOverrideSection";
import { AnalyticsSection }      from "@/components/admin/AnalyticsSection";
import { EventsSection }         from "@/components/admin/EventsSection";
import {
  Link2, Users, Shield, UserCog, BarChart2, Calendar, ChevronRight,
} from "lucide-react";

type SectionId = "invites" | "members" | "content" | "override" | "analytics" | "events";

interface SectionDef {
  id: SectionId;
  title: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  minRole: "watcher" | "chaos";
  chaosOnly?: boolean;
}

const SECTIONS: SectionDef[] = [
  { id: "invites",   title: "Invite Links",        desc: "Generate and revoke invite codes for new members.",       icon: Link2,    color: "#7F77DD", minRole: "watcher" },
  { id: "members",   title: "Members",             desc: "View all members, manage roles and badges.",              icon: Users,    color: "#1D9E75", minRole: "watcher" },
  { id: "content",   title: "Content Moderation",  desc: "Review flagged content and moderate the library.",        icon: Shield,   color: "#D4537E", minRole: "watcher" },
  { id: "analytics", title: "Analytics",           desc: "Member activity, event attendance, and usage stats.",     icon: BarChart2,color: "#BA7517", minRole: "watcher" },
  { id: "events",    title: "Event Management",    desc: "Create, edit, and delete community events.",              icon: Calendar, color: "#06b6d4", minRole: "watcher" },
  { id: "override",  title: "Profile Override",    desc: "Edit any member's profile details (chaos only).",         icon: UserCog,  color: "#ec4899", minRole: "chaos", chaosOnly: true },
];

export default function AdminPage() {
  const router = useRouter();
  const [myId, setMyId]         = useState("");
  const [myRole, setMyRole]     = useState<Role | null>(null);
  const [loading, setLoading]   = useState(true);
  const [active, setActive]     = useState<SectionId | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id,role")
        .eq("id", user.id)
        .single();

      const role = (profile?.role as Role) ?? "unnamed";
      if (ROLE_TIER[role] < ROLE_TIER.watcher) {
        router.replace("/group");
        return;
      }
      setMyId(user.id);
      setMyRole(role);
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <>
        <TopBar title="Admin Panel" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-white/10 border-t-purple-400 rounded-full" />
        </div>
      </>
    );
  }

  if (!myRole || ROLE_TIER[myRole] < ROLE_TIER.watcher) return null;

  const visibleSections = SECTIONS.filter(s =>
    !s.chaosOnly || myRole === "chaos"
  );

  const activeSection = SECTIONS.find(s => s.id === active);

  return (
    <>
      <TopBar title="Admin Panel" />
      <div className="flex-1 py-6 px-[8%] overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-0.5" style={{ color: "var(--color-amber)" }}>
              Admin Panel
            </h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Manage members, invites, and content.
            </p>
          </div>

          {/* Section navigation grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            {visibleSections.map(s => {
              const Icon = s.icon;
              const isActive = active === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(isActive ? null : s.id)}
                  className="rounded-xl p-5 border text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    backgroundColor: isActive ? `${s.color}18` : "var(--color-surface)",
                    borderColor: isActive ? s.color : "var(--color-border)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${s.color}20` }}>
                      <Icon size={18} style={{ color: s.color }} />
                    </div>
                    <ChevronRight size={16}
                      style={{
                        color: isActive ? s.color : "var(--color-text-muted)",
                        transform: isActive ? "rotate(90deg)" : "none",
                        transition: "transform 0.2s",
                        marginTop: 4,
                      }} />
                  </div>
                  <h2 className="font-semibold mt-3 mb-0.5" style={{ color: "var(--color-text-primary)" }}>
                    {s.title}
                  </h2>
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{s.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Active section content */}
          {active && activeSection && (
            <div className="rounded-2xl border p-6"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${activeSection.color}20` }}>
                  <activeSection.icon size={16} style={{ color: activeSection.color }} />
                </div>
                <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {activeSection.title}
                </h2>
              </div>

              {active === "invites"   && <InvitesSection myRole={myRole} />}
              {active === "members"   && <MembersSection myRole={myRole} myId={myId} />}
              {active === "content"   && <ContentSection />}
              {active === "analytics" && <AnalyticsSection myRole={myRole} />}
              {active === "events"    && <EventsSection />}
              {active === "override"  && myRole === "chaos" && <ProfileOverrideSection />}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
