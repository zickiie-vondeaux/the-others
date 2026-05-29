"use client";

import { useEffect, useState, useMemo } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { createClient } from "@/lib/supabase/client";
import { MemberCard, MemberListRow, type MemberRow } from "@/components/members/MemberCard";
import { MemberProfileModal } from "@/components/members/MemberProfileModal";
import { LayoutGrid, List, Search, X } from "lucide-react";
import type { Role } from "@/lib/roles";
import { ROLE_DISPLAY } from "@/lib/roles";

type ViewMode = "grid" | "list";
type RoleFilter = "all" | "wanderer" | "ascended" | "watcher";

const ROLE_FILTER_OPTIONS: { id: RoleFilter; label: string }[] = [
  { id: "all",      label: "All roles"  },
  { id: "ascended", label: ROLE_DISPLAY.ascended },
  { id: "wanderer", label: ROLE_DISPLAY.wanderer },
  { id: "watcher",  label: ROLE_DISPLAY.watcher  },
];

const MEMBER_ROLES: Role[] = ["wanderer", "ascended", "watcher", "origin"];

export default function MembersPage() {
  const [myId, setMyId]     = useState("");
  const [myRole, setMyRole] = useState<Role>("unnamed");
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode]       = useState<ViewMode>("grid");
  const [search, setSearch]           = useState("");
  const [roleFilter, setRoleFilter]   = useState<RoleFilter>("all");
  const [selected, setSelected]       = useState<MemberRow | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: me } = await supabase
        .from("profiles")
        .select("id,role")
        .eq("id", user.id)
        .single();

      const role = (me?.role ?? "unnamed") as Role;
      setMyId(user.id);
      setMyRole(role);

      if (role === "unnamed") { setLoading(false); return; }

      const { data } = await supabase
        .from("profiles")
        .select("id,display_name,username,avatar_url,bio,created_at,last_active_at,role,favorite_game,favorite_movie,favorite_food,favorite_music,favorite_color,platforms,steam_id,privacy_settings")
        .in("role", MEMBER_ROLES)
        .order("created_at", { ascending: false });

      setMembers((data ?? []) as MemberRow[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return members.filter(m => {
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!m.display_name.toLowerCase().includes(q) && !m.username.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [members, search, roleFilter]);

  // ── Unnamed: access denied ─────────────────────────────────────
  if (!loading && myRole === "unnamed") {
    return (
      <>
        <TopBar title="Members" />
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="text-center space-y-2 max-w-xs">
            <p className="text-2xl">🔒</p>
            <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Members only
            </p>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              You need to be an active member to view the directory.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Members" />

      <div className="flex-1 py-6 px-[8%] overflow-y-auto">
        <div className="space-y-5">

          {/* Page header */}
          <div>
            <h1 className="neon-heading text-4xl font-black uppercase tracking-widest">Members</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {loading ? "Loading…" : `${members.length} member${members.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div
              className="flex items-center gap-2 flex-1 min-w-[180px] px-3 py-1.5 rounded-lg border"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
              <Search size={13} style={{ color: "var(--color-text-muted)" }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-muted)]"
                style={{ color: "var(--color-text-primary)" }}
              />
              {search && (
                <button onClick={() => setSearch("")}>
                  <X size={13} style={{ color: "var(--color-text-muted)" }} />
                </button>
              )}
            </div>

            {/* Role filter */}
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as RoleFilter)}
              className="px-3 py-1.5 rounded-lg border text-sm outline-none"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
                color: roleFilter !== "all" ? "var(--color-purple-light)" : "var(--color-text-secondary)",
              }}
            >
              {ROLE_FILTER_OPTIONS.map(o => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>

            {/* View toggle */}
            <div
              className="flex rounded-lg border overflow-hidden"
              style={{ borderColor: "var(--color-border)" }}
            >
              {(["grid", "list"] as ViewMode[]).map(v => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className="px-3 py-1.5 transition-colors"
                  style={{
                    backgroundColor: viewMode === v ? "var(--color-surface-elevated)" : "transparent",
                    color: viewMode === v ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  }}
                >
                  {v === "grid" ? <LayoutGrid size={14} /> : <List size={14} />}
                </button>
              ))}
            </div>

            <span className="ml-auto text-xs" style={{ color: "var(--color-text-muted)" }}>
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Content */}
          {loading ? (
            <LoadingSkeleton viewMode={viewMode} />
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {search || roleFilter !== "all" ? "No members match your search." : "No members yet."}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(m => (
                <MemberCard key={m.id} member={m} onClick={() => setSelected(m)} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(m => (
                <MemberListRow key={m.id} member={m} onClick={() => setSelected(m)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <MemberProfileModal
          member={selected}
          myId={myId}
          myRole={myRole}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

function LoadingSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border overflow-hidden animate-pulse"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <div className="w-full" style={{ aspectRatio: "4/3", backgroundColor: "var(--color-surface-elevated)" }} />
            <div className="p-3 space-y-2">
              <div className="h-3 rounded" style={{ backgroundColor: "var(--color-surface-elevated)", width: "70%" }} />
              <div className="h-2 rounded" style={{ backgroundColor: "var(--color-surface-elevated)", width: "50%" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border animate-pulse"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <div className="w-10 h-10 rounded-xl shrink-0" style={{ backgroundColor: "var(--color-surface-elevated)" }} />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 rounded" style={{ backgroundColor: "var(--color-surface-elevated)", width: "40%" }} />
            <div className="h-2 rounded" style={{ backgroundColor: "var(--color-surface-elevated)", width: "60%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
