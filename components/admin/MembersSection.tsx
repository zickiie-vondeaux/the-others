"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, X, ChevronDown, Loader2, Shield, VolumeX, Volume2, UserX, UserCheck, Tag, ExternalLink } from "lucide-react";
import { RoleBadge } from "@/components/members/RoleBadge";
import type { Role } from "@/lib/roles";
import { ROLE_DISPLAY, ROLE_TIER } from "@/lib/roles";

interface AdminMember {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  role: Role;
  created_at: string;
  last_active_at: string;
  is_banned: boolean;
  muted_until: string | null;
  badges: { badge_slug: string; badge_label: string }[];
}

const PRESET_BADGES = [
  { slug: "og",        label: "OG Member"     },
  { slug: "hype",      label: "Hype Beast"    },
  { slug: "cinephile", label: "Cinephile"     },
  { slug: "gamer",     label: "Hardcore Gamer"},
  { slug: "host",      label: "Event Host"    },
  { slug: "helper",    label: "Helper"        },
  { slug: "creative",  label: "Creative"      },
  { slug: "lurker",    label: "Certified Lurker" },
];

const ROLE_OPTIONS: Role[] = ["unnamed", "wanderer", "ascended", "watcher", "chaos"];

export function MembersSection({ myRole, myId, onViewProfile }: {
  myRole: Role;
  myId: string;
  onViewProfile?: (memberId: string) => void;
}) {
  const [members, setMembers]     = useState<AdminMember[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [selected, setSelected]   = useState<AdminMember | null>(null);
  const [acting, setActing]       = useState(false);
  const [muteHours, setMuteHours] = useState("24");

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/admin/members");
    const json = await res.json();
    setMembers(json.members ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => members.filter(m => {
    if (roleFilter !== "all" && m.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return m.display_name.toLowerCase().includes(q) || m.username.toLowerCase().includes(q);
    }
    return true;
  }), [members, search, roleFilter]);

  async function doAction(action: string, extra?: Record<string, unknown>) {
    if (!selected) return;
    setActing(true);
    await fetch("/api/admin/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_id: selected.id, action, ...extra }),
    });
    await load();
    setSelected(prev => {
      const updated = members.find(m => m.id === prev?.id) ?? null;
      return updated;
    });
    setActing(false);
  }

  const canActOn = (m: AdminMember) =>
    m.id !== myId && ROLE_TIER[myRole] > ROLE_TIER[m.role];

  const assignableRoles = ROLE_OPTIONS.filter(r => {
    if (r === "chaos") return myRole === "chaos";
    if (r === "watcher") return myRole === "chaos";
    return ROLE_TIER[myRole] > ROLE_TIER[r];
  });

  const isMuted = (m: AdminMember) =>
    m.muted_until != null && new Date(m.muted_until) > new Date();

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] px-3 py-1.5 rounded-lg border"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <Search size={13} style={{ color: "var(--color-text-muted)" }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search members…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-muted)]"
            style={{ color: "var(--color-text-primary)" }}
          />
          {search && <button onClick={() => setSearch("")}><X size={13} style={{ color: "var(--color-text-muted)" }} /></button>}
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as Role | "all")}
          className="px-3 py-1.5 rounded-lg border text-sm outline-none"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
          <option value="all">All roles</option>
          {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_DISPLAY[r]}</option>)}
        </select>
        <span className="self-center text-xs ml-auto" style={{ color: "var(--color-text-muted)" }}>
          {filtered.length} member{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex gap-4" style={{ minHeight: "360px" }}>
        {/* Member list */}
        <div className="flex-1 space-y-1 overflow-y-auto pr-1" style={{ maxHeight: "480px" }}>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin" style={{ color: "var(--color-text-muted)" }} /></div>
          ) : filtered.map(m => (
            <button key={m.id} onClick={() => setSelected(m)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors hover:bg-white/5"
              style={{
                backgroundColor: selected?.id === m.id ? "var(--color-surface-elevated)" : "var(--color-surface)",
                borderColor: selected?.id === m.id ? "var(--color-purple)" : "var(--color-border)",
              }}
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-gray-700">
                {m.avatar_url && <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm truncate" style={{ color: "var(--color-text-primary)" }}>{m.display_name}</span>
                  {m.is_banned && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: "rgba(236,72,153,0.15)", color: "#ec4899" }}>Banned</span>}
                  {isMuted(m) && <VolumeX size={11} style={{ color: "#BA7517" }} />}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>@{m.username}</span>
                  <RoleBadge role={m.role} size="xs" />
                </div>
              </div>
              <ChevronDown size={13} className={selected?.id === m.id ? "-rotate-90" : ""} style={{ color: "var(--color-text-muted)", transition: "transform 0.2s" }} />
            </button>
          ))}
        </div>

        {/* Action panel */}
        {selected && (
          <div className="w-72 shrink-0 rounded-xl border p-4 space-y-4 overflow-y-auto"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", maxHeight: "480px" }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{selected.display_name}</p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>@{selected.username}</p>
              </div>
              <div className="flex gap-1.5">
                {onViewProfile && (
                  <button onClick={() => onViewProfile(selected.id)} title="View profile"
                    className="p-1.5 rounded-lg hover:bg-white/10">
                    <ExternalLink size={14} style={{ color: "var(--color-text-muted)" }} />
                  </button>
                )}
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-white/10">
                  <X size={14} style={{ color: "var(--color-text-muted)" }} />
                </button>
              </div>
            </div>

            <div className="text-xs space-y-1" style={{ color: "var(--color-text-muted)" }}>
              <p>Joined {new Date(selected.created_at).toLocaleDateString()}</p>
              <p>Last active {new Date(selected.last_active_at).toLocaleDateString()}</p>
            </div>

            {!canActOn(selected) ? (
              <p className="text-xs italic" style={{ color: "var(--color-text-muted)" }}>
                {selected.id === myId ? "This is you." : "Cannot act on members of equal or higher tier."}
              </p>
            ) : (
              <>
                {/* Role assignment */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>Role</p>
                  <select
                    value={selected.role}
                    onChange={e => doAction("set_role", { new_role: e.target.value })}
                    disabled={acting}
                    className="w-full px-3 py-1.5 rounded-lg border text-sm outline-none disabled:opacity-50"
                    style={{ backgroundColor: "var(--color-surface-elevated)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                  >
                    {assignableRoles.map(r => <option key={r} value={r}>{ROLE_DISPLAY[r]}</option>)}
                  </select>
                </div>

                {/* Moderation actions */}
                <div className="space-y-2">
                  <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>Moderation</p>
                  <div className="grid grid-cols-2 gap-2">
                    {isMuted(selected) ? (
                      <button onClick={() => doAction("unmute")} disabled={acting}
                        className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium disabled:opacity-50 transition-colors"
                        style={{ backgroundColor: "rgba(186,117,23,0.15)", color: "#BA7517" }}>
                        <Volume2 size={13} /> Unmute
                      </button>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <input type="number" value={muteHours} onChange={e => setMuteHours(e.target.value)}
                            className="w-14 px-2 py-1 rounded text-xs outline-none border"
                            style={{ backgroundColor: "var(--color-surface-elevated)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                            min="1" max="720" />
                          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>hrs</span>
                        </div>
                        <button onClick={() => {
                          const until = new Date();
                          until.setHours(until.getHours() + parseInt(muteHours || "24", 10));
                          doAction("mute", { muted_until: until.toISOString() });
                        }} disabled={acting}
                          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                          style={{ backgroundColor: "rgba(186,117,23,0.15)", color: "#BA7517" }}>
                          <VolumeX size={13} /> Mute
                        </button>
                      </div>
                    )}
                    {selected.is_banned ? (
                      <button onClick={() => doAction("unban")} disabled={acting}
                        className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium disabled:opacity-50"
                        style={{ backgroundColor: "rgba(29,158,117,0.15)", color: "#1D9E75" }}>
                        <UserCheck size={13} /> Unban
                      </button>
                    ) : (
                      <button onClick={() => { if (confirm(`Ban ${selected.display_name}?`)) doAction("ban"); }}
                        disabled={acting}
                        className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium disabled:opacity-50"
                        style={{ backgroundColor: "rgba(236,72,153,0.15)", color: "#ec4899" }}>
                        <UserX size={13} /> Ban
                      </button>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="space-y-2">
                  <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>Badges</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.badges.map(b => (
                      <span key={b.badge_slug}
                        className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-70"
                        style={{ backgroundColor: "rgba(127,119,221,0.15)", color: "#7F77DD", borderColor: "rgba(127,119,221,0.3)" }}
                        onClick={() => doAction("remove_badge", { badge_slug: b.badge_slug })}
                        title="Click to remove">
                        {b.badge_label} <X size={9} />
                      </span>
                    ))}
                    {selected.badges.length === 0 && (
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>No badges</span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <select
                      className="flex-1 px-2 py-1 rounded-lg border text-xs outline-none"
                      style={{ backgroundColor: "var(--color-surface-elevated)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                      defaultValue=""
                      onChange={e => {
                        const preset = PRESET_BADGES.find(b => b.slug === e.target.value);
                        if (preset) doAction("add_badge", { badge_slug: preset.slug, badge_label: preset.label });
                        e.target.value = "";
                      }}
                    >
                      <option value="" disabled>Add badge…</option>
                      {PRESET_BADGES.filter(b => !selected.badges.find(eb => eb.badge_slug === b.slug))
                        .map(b => <option key={b.slug} value={b.slug}>{b.label}</option>)}
                    </select>
                    <button title="Manage badges" className="p-1.5 rounded-lg hover:bg-white/10">
                      <Tag size={14} style={{ color: "var(--color-text-muted)" }} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
