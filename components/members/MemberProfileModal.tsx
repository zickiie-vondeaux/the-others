"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink, EyeOff, Settings, Gamepad2, Film, Utensils, Music } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { RoleBadge } from "./RoleBadge";
import type { MemberRow } from "./MemberCard";
import type { Role } from "@/lib/roles";
import { ROLE_TIER } from "@/lib/roles";
import type { PersonalityResult, PrivacySettings } from "@/lib/supabase/types";
import { ALL_QUIZZES, AUTO_CALC_META } from "@/lib/personality";
import { ACTIVITY_ICONS, ACTIVITY_LABELS, type ActivityEntry } from "@/lib/activity";

const MEMBER_ACTIVITY_TYPES = [
  "game_added", "movie_added", "game_status", "movie_watched", "poll_created", "event_created",
];

const ROLE_GRADIENT: Record<Role, string> = {
  origin:   "linear-gradient(135deg, #7F77DD, #5b54c2)",
  watcher:  "linear-gradient(135deg, #1D9E75, #14735a)",
  ascended: "linear-gradient(135deg, #D4537E, #a83d60)",
  wanderer: "linear-gradient(135deg, #BA7517, #8a5510)",
  unnamed:  "linear-gradient(135deg, #334155, #1e293b)",
};

interface Props {
  member: MemberRow;
  myId: string;
  myRole: Role;
  onClose: () => void;
}

export function MemberProfileModal({ member, myId, myRole, onClose }: Props) {
  const isOwnProfile = member.id === myId;
  const isElevated   = ROLE_TIER[myRole] >= ROLE_TIER["watcher"];

  const privacy: PrivacySettings = {
    bio:         member.privacy_settings?.bio         ?? true,
    personality: member.privacy_settings?.personality ?? true,
    favorites:   member.privacy_settings?.favorites   ?? true,
    activity:    member.privacy_settings?.activity    ?? true,
    steam:       member.privacy_settings?.steam       ?? true,
  };

  const [personalityResults, setPersonalityResults] = useState<PersonalityResult[]>([]);
  const [activity, setActivity]                     = useState<ActivityEntry[]>([]);
  const [loadingDetails, setLoadingDetails]         = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("personality_results").select("*").eq("user_id", member.id),
      supabase
        .from("activity_feed")
        .select("*")
        .eq("user_id", member.id)
        .in("type", MEMBER_ACTIVITY_TYPES)
        .order("created_at", { ascending: false })
        .limit(10),
    ]).then(([{ data: pers }, { data: act }]) => {
      setPersonalityResults((pers ?? []) as PersonalityResult[]);
      setActivity((act ?? []) as ActivityEntry[]);
      setLoadingDetails(false);
    });
  }, [member.id]);

  const hasBio         = !!member.bio;
  const hasPersonality = !loadingDetails && personalityResults.length > 0;
  const hasFavorites   = !!(member.favorite_game || member.favorite_movie || member.favorite_food || member.favorite_music || member.favorite_color);
  const hasSteam       = !!member.steam_id;

  const showBio         = hasBio         && (isOwnProfile || privacy.bio);
  const showPersonality = hasPersonality && (isOwnProfile || privacy.personality);
  const showFavorites   = hasFavorites   && (isOwnProfile || privacy.favorites);
  const showActivity    = isOwnProfile   || privacy.activity;
  const showSteam       = hasSteam       && (isOwnProfile || privacy.steam);

  function steamUrl(id: string) {
    return /^\d{17}$/.test(id)
      ? `https://steamcommunity.com/profiles/${id}`
      : `https://steamcommunity.com/id/${id}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />

      {/* Modal — max 400px, scrollable */}
      <div
        className="relative w-full max-w-[400px] max-h-[85vh] flex flex-col rounded-2xl border shadow-2xl"
        style={{ backgroundColor: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}
      >

        {/* ── Header: gradient bg, avatar left, identity right ── */}
        <div
          className="shrink-0 relative rounded-t-2xl overflow-hidden border-b"
          style={{ background: ROLE_GRADIENT[member.role], borderColor: "var(--color-border)" }}
        >
          <div className="flex items-stretch">

            {/* Avatar block — stretches to full header height */}
            <div className="shrink-0 p-3 flex" style={{ width: "130px" }}>
              <div
                className="w-full rounded-xl overflow-hidden border-2"
                style={{ borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(0,0,0,0.25)" }}
              >
                {member.avatar_url
                  ? <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl font-black" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {member.display_name[0]?.toUpperCase()}
                      </span>
                    </div>
                }
              </div>
            </div>

            {/* Identity — right of avatar */}
            <div className="flex-1 min-w-0 py-4 pr-10 flex flex-col justify-center gap-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-black text-2xl leading-tight text-white">
                  {member.display_name}
                </h2>
                <RoleBadge role={member.role} />
              </div>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                @{member.username}
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                Joined {fmtDate(member.created_at)}
              </p>
              {isElevated && !isOwnProfile && member.last_active_at && (
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Active {fmtDate(member.last_active_at)}
                </p>
              )}
              {isOwnProfile && (
                <Link
                  href="/profile/privacy"
                  onClick={onClose}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg w-fit transition-colors hover:bg-white/10"
                  style={{ backgroundColor: "rgba(0,0,0,0.25)", color: "rgba(255,255,255,0.7)" }}
                >
                  <Settings size={11} /> Privacy
                </Link>
              )}
            </div>
          </div>

          {/* X — absolute top-right */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors hover:bg-white/10"
            style={{ backgroundColor: "rgba(0,0,0,0.35)", color: "white" }}
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

          {/* Bio */}
          {showBio && (
            <Section title="Bio" hidden={isOwnProfile && !privacy.bio}>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {member.bio}
              </p>
            </Section>
          )}

          {/* Personality */}
          {showPersonality && (
            <Section title="Personality" hidden={isOwnProfile && !privacy.personality}>
              <div className="flex flex-wrap gap-2">
                {[...ALL_QUIZZES, ...Object.entries(AUTO_CALC_META).map(([slug, m]) => ({ slug, ...m }))].map(q => {
                  const r = personalityResults.find(p => p.test_slug === q.slug);
                  if (!r) return null;
                  return (
                    <div
                      key={q.slug}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl"
                      style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                    >
                      {q.slug === "zodiac"
                        ? <img src={`/${r.result_code}.svg`} alt={r.result_code} className="w-4 h-4"
                            style={{ filter: "drop-shadow(0 0 4px rgba(139,92,246,0.7))" }} />
                        : <span className="text-sm">{(q as { icon?: string }).icon}</span>
                      }
                      <div>
                        <p className="text-xs font-bold leading-none" style={{ color: "var(--color-purple)" }}>{r.result_code}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{q.shortName}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Favorites */}
          {showFavorites && hasFavorites && (
            <Section title="Likes & Favorites" hidden={isOwnProfile && !privacy.favorites}>
              <div className="grid grid-cols-2 gap-2">
                {member.favorite_game  && <FavItem icon={<Gamepad2 size={11} />} label="Game"  value={member.favorite_game} />}
                {member.favorite_movie && <FavItem icon={<Film size={11} />}     label="Movie" value={member.favorite_movie} />}
                {member.favorite_food  && <FavItem icon={<Utensils size={11} />} label="Food"  value={member.favorite_food} />}
                {member.favorite_music && <FavItem icon={<Music size={11} />}    label="Music" value={member.favorite_music} />}
                {member.favorite_color && (
                  <FavItem
                    icon={<div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: member.favorite_color }} />}
                    label="Color"
                    value={member.favorite_color}
                  />
                )}
              </div>
            </Section>
          )}

          {/* Activity */}
          {showActivity && (
            <Section title="Recent Activity" hidden={isOwnProfile && !privacy.activity}>
              {loadingDetails ? (
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Loading…</p>
              ) : activity.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>No activity yet.</p>
              ) : (
                <div className="space-y-2">
                  {activity.map(entry => (
                    <div key={entry.id} className="flex items-start gap-2">
                      <span className="text-sm leading-none mt-0.5">{ACTIVITY_ICONS[entry.type]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-snug" style={{ color: "var(--color-text-secondary)" }}>
                          {stripMd(ACTIVITY_LABELS[entry.type](entry.entity_title, entry.metadata))}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                          {fmtDate(entry.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Steam */}
          {showSteam && member.steam_id && (
            <Section title="Steam" hidden={isOwnProfile && !privacy.steam}>
              <a
                href={steamUrl(member.steam_id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors hover:bg-white/5"
                style={{ borderColor: "var(--color-border)", color: "var(--color-cyan)" }}
              >
                <ExternalLink size={12} /> View Steam Profile
              </a>
            </Section>
          )}

        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  hidden,
  children,
}: {
  title: string;
  hidden: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h3
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--color-cyan)", textShadow: "0 0 8px rgba(0,255,234,0.4)" }}
        >
          {title}
        </h3>
        {hidden && (
          <span
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(139,92,246,0.15)", color: "var(--color-purple-light)" }}
          >
            <EyeOff size={9} /> Only you can see this
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function FavItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg" style={{ backgroundColor: "var(--color-surface)" }}>
      <span className="mt-0.5 shrink-0" style={{ color: "var(--color-cyan)" }}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold" style={{ color: "var(--color-cyan)" }}>{label}</p>
        <p className="text-xs truncate" style={{ color: "var(--color-text-primary)" }}>{value}</p>
      </div>
    </div>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function stripMd(text: string) {
  return text.replace(/\*\*/g, "");
}
