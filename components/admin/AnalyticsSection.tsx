"use client";

import { useEffect, useState } from "react";
import { Loader2, Users, Calendar, Ticket, TrendingUp, Film, Gamepad2 } from "lucide-react";
import type { Role } from "@/lib/roles";

interface Stats {
  activeMembers: number;
  totalMembers: number;
  upcomingEvents: { id: string; title: string; start_at: string }[];
  pastEvents: { id: string; title: string; start_at: string }[];
  // chaos-only
  gamesAdded?: number;
  moviesAdded?: number;
  invitesActive?: number;
  invitesUsed?: number;
  invitesRevoked?: number;
  signupsThisMonth?: number;
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number | string; color?: string;
}) {
  return (
    <div className="rounded-xl border p-4 flex items-center gap-4"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color ?? "#7F77DD"}20` }}>
        <Icon size={18} style={{ color: color ?? "#7F77DD" }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{value}</p>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</p>
      </div>
    </div>
  );
}

export function AnalyticsSection({ myRole }: { myRole: Role }) {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin" style={{ color: "var(--color-text-muted)" }} /></div>
  );

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Core stats */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--color-text-muted)" }}>Members</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard icon={Users} label="Active (30 days)" value={stats.activeMembers} color="#1D9E75" />
          <StatCard icon={Users} label="Total members" value={stats.totalMembers} color="#7F77DD" />
          {myRole === "chaos" && typeof stats.signupsThisMonth === "number" && (
            <StatCard icon={TrendingUp} label="New this month" value={stats.signupsThisMonth} color="#D4537E" />
          )}
        </div>
      </div>

      {myRole === "chaos" && (
        <>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--color-text-muted)" }}>Library</p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Gamepad2} label="Games in library" value={stats.gamesAdded ?? 0} color="#BA7517" />
              <StatCard icon={Film} label="Movies in library" value={stats.moviesAdded ?? 0} color="#D4537E" />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--color-text-muted)" }}>Invites</p>
            <div className="grid grid-cols-3 gap-3">
              <StatCard icon={Ticket} label="Active codes" value={stats.invitesActive ?? 0} color="#1D9E75" />
              <StatCard icon={Ticket} label="Codes used" value={stats.invitesUsed ?? 0} color="#7F77DD" />
              <StatCard icon={Ticket} label="Revoked" value={stats.invitesRevoked ?? 0} color="#888780" />
            </div>
          </div>
        </>
      )}

      {/* Events */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--color-text-muted)" }}>
            Upcoming Events ({stats.upcomingEvents.length})
          </p>
          {stats.upcomingEvents.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>None scheduled.</p>
          ) : (
            <div className="space-y-1.5">
              {stats.upcomingEvents.map(e => (
                <div key={e.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border"
                  style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                  <Calendar size={13} style={{ color: "#1D9E75", flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: "var(--color-text-primary)" }}>{e.title}</p>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(e.start_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--color-text-muted)" }}>
            Past Events ({stats.pastEvents.length})
          </p>
          {stats.pastEvents.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No past events.</p>
          ) : (
            <div className="space-y-1.5">
              {stats.pastEvents.map(e => (
                <div key={e.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border"
                  style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", opacity: 0.7 }}>
                  <Calendar size={13} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: "var(--color-text-primary)" }}>{e.title}</p>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(e.start_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
