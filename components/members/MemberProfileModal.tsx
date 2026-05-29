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

interface Props {
  member: MemberRow;
  myId: string;
  myRole: Role;
  onClose: () => void;
}

export function MemberProfileModal({ member, myId, myRole, onClose }: Props) {
  const isOwnProfile = member.id === myId;
  const isElevated = ROLE_TIER[myRole] >= ROLE_TIER["watcher"];

  const privacy: PrivacySettings = {
    bio:         member.privacy_settings?.bio         ?? true,
    personality: member.privacy_settings?.personality ?? true,
    favorites:   member.privacy_settings?.favorites   ?? true,
    activity:    member.privacy_settings?.activity    ?? true,
    steam:       member.privacy_settings?.steam       ?? true,
  };

  const [personalityResults, setPersonalityResults] = useState<PersonalityResult[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);

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

  const hasBio        = !!member.bio;
  const hasPersonality = !loadingDetails && personalityResults.length > 0;
  const hasFavorites  = !!(member.favorite_game || member.favorite_movie || member.favorite_food || member.favorite_music || member.favorite_color);
  const hasSteam      = !!member.steam_id;

  // Visibility: own profile always shows; others respect privacy
  const showBio        = hasBio && (isOwnProfile || privacy.bio);
  const showPersonality= hasPersonality && (isOwnProfile || privacy.personality);
  const showFavorites  = hasFavorites && (isOwnProfile || privacy.favorites);
  const showActivity   = isOwnProfile || privacy.activity;
  const showSteam      = hasSteam && (isOwnProfile || privacy.steam);

  const bgGradient = member.favorite_color
    ? `linear-gradient(135deg, ${member.favorite_color}99, #8b5cf6)`
    : "linear-gradient(135deg, #8b5cf6, #00ffea)";

  function steamUrl(id: string) {
    return /^\d{17}$/.test(id)
      ? `https://steamcommunity.com/profiles/${id}`
      : `https://steamcommunity.com/id/${id}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full sm:max-w-lg max-h-screen sm:max-h-[88vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border"
        style={{ backgroundColor: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}
      >
        {/* Banner + avatar */}
        <div className="relative">
          <div className="w-full h-32 rounded-t-2xl overflow-hidden" style={{ background: bgGradient }}>
            {member.avatar_url && (
              <img src={member.avatar_url} alt="" className="w-full h-full object-cover opacity-50" />
            )}
          </div>

          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg"
            style={{ backgroundColor: "rgba(0,0,0,0.45)", color: "white" }}
          >
            <X size={16} />
          </button>

          {/* Avatar circle */}
          <div className="absolute left-5" style={{ bottom: "-2.25rem" }}>
            <div
              className="w-[72px] h-[72px] rounded-2xl border-4 overflow-hidden"
              style={{ borderColor: "var(--color-surface-elevated)", background: bgGradient }}
            >
              {member.avatar_url
                ? <img src={member.avatar_url} alt={member.display_name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white/70">
                    {member.display_name[0]?.toUpperCase()}
                  </div>
              }
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-12 pb-8 px-5 space-y-5">

          {/* Identity row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black truncate" style={{ color: "var(--color-text-primary)" }}>
                  {member.display_name}
                </h2>
                <RoleBadge role={member.role} />
              </div>
              <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                @{member.username}
              </p>
              <div className="flex flex-wrap gap-3 mt-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                <span>Joined {fmtDate(member.created_at)}</span>
                {isElevated && !isOwnProfile && member.last_active_at && (
                  <span>Active {fmtDate(member.last_active_at)}</span>
                )}
              </div>
            </div>

            {isOwnProfile && (
              <Link
                href="/profile/privacy"
                onClick={onClose}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border shrink-0 transition-colors hover:border-purple-500/40"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
              >
                <Settings size={11} /> Privacy
              </Link>
            )}
          </div>

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
                      className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                    >
                      {q.slug === "zodiac"
                        ? <img src={`/${r.result_code}.svg`} alt={r.result_code} className="w-5 h-5"
                            style={{ filter: "drop-shadow(0 0 4px rgba(139,92,246,0.7))" }} />
                        : <span className="text-base">{(q as { icon?: string }).icon}</span>
                      }
                      <div>
                        <p className="text-xs font-bold" style={{ color: "var(--color-purple)" }}>{r.result_code}</p>
                        <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{q.shortName}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Favorites */}
          {showFavorites && hasFavorites && (
            <Section title="Likes &amp; Favorites" hidden={isOwnProfile && !privacy.favorites}>
              <div className="grid grid-cols-2 gap-2">
                {member.favorite_game  && <FavItem icon={<Gamepad2 size={12} />} label="Game"  value={member.favorite_game} />}
                {member.favorite_movie && <FavItem icon={<Film size={12} />}     label="Movie" value={member.favorite_movie} />}
                {member.favorite_food  && <FavItem icon={<Utensils size={12} />} label="Food"  value={member.favorite_food} />}
                {member.favorite_music && <FavItem icon={<Music size={12} />}    label="Music" value={member.favorite_music} />}
                {member.favorite_color && (
                  <FavItem
                    icon={<div className="w-3 h-3 rounded-full" style={{ backgroundColor: member.favorite_color }} />}
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
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Loading…</p>
              ) : activity.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No activity yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {activity.map(entry => (
                    <div key={entry.id} className="flex items-start gap-2.5">
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors"
                style={{ borderColor: "var(--color-border)", color: "var(--color-cyan)" }}
              >
                <ExternalLink size={13} /> View Steam Profile
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
          dangerouslySetInnerHTML={{ __html: title }}
        />
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

function FavItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-start gap-2 p-2.5 rounded-lg"
      style={{ backgroundColor: "var(--color-surface)" }}
    >
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
