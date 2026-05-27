"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PLATFORMS } from "@/lib/supabase/types";
import { Pencil, Gamepad2, Film, Utensils, Music, MapPin, Calendar } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ALL_ACHIEVEMENTS, ACHIEVEMENT_MAP } from "@/lib/achievements";
import { AchievementGrid } from "@/components/achievements/AchievementBadge";
import { ALL_QUIZZES, AUTO_CALC_META, type AutoCalcSlug } from "@/lib/personality";
import type { PersonalityResult } from "@/lib/supabase/types";

export default function ProfilePage() {
  const { profile, loading } = useCurrentUser();
  const [earnedIds, setEarnedIds] = useState<string[]>([]);
  const [personalityResults, setPersonalityResults] = useState<PersonalityResult[]>([]);

  useEffect(() => {
    if (!profile) return;
    const supabase = createClient();
    Promise.all([
      supabase.from("user_achievements").select("achievement_id").eq("user_id", profile.id),
      supabase.from("personality_results").select("*").eq("user_id", profile.id),
    ]).then(([{ data: ach }, { data: pers }]) => {
      setEarnedIds((ach ?? []).map((r: any) => r.achievement_id));
      setPersonalityResults((pers ?? []) as PersonalityResult[]);
    });
  }, [profile?.id]);

  if (loading) return <LoadingState />;
  if (!profile) return null;

  const zodiac = profile.birthday ? getZodiac(profile.birthday) : null;
  const lifePathNumber = profile.birthday ? getLifePath(profile.birthday) : null;

  return (
    <>
      <TopBar title="My Profile" />
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Hero card */}
          <div className="rounded-2xl border p-6 relative"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <Link href="/profile/edit"
              className="absolute top-4 right-4 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all hover:border-purple-500/60"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
              <Pencil size={12} /> Edit
            </Link>

            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center text-3xl font-black text-white"
                style={{ background: profile.favorite_color
                  ? `linear-gradient(135deg, ${profile.favorite_color}cc, var(--color-purple))`
                  : "linear-gradient(135deg, var(--color-purple), var(--color-cyan))"
                }}>
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                  : profile.display_name[0]?.toUpperCase()
                }
              </div>

              {/* Name block */}
              <div className="flex-1 min-w-0 pt-1">
                <h1 className="text-xl font-black truncate" style={{ color: "var(--color-text-primary)" }}>
                  {profile.display_name}
                </h1>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>@{profile.username}</p>
                {profile.ign && (
                  <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--color-cyan)" }}>
                    IGN: {profile.ign}
                  </p>
                )}
                {profile.bio && (
                  <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-4 mt-5 pt-5 border-t text-xs"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
              {profile.city && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} /> {profile.city}
                </span>
              )}
              {profile.birthday && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {formatBirthday(profile.birthday)}
                </span>
              )}
              {zodiac && <span>{zodiac.symbol} {zodiac.sign}</span>}
              {lifePathNumber && <span>Life Path {lifePathNumber}</span>}
            </div>
          </div>

          {/* Platforms */}
          {profile.platforms.length > 0 && (
            <Section title="Gaming Platforms">
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => (
                  <span key={p}
                    className="text-xs font-medium px-3 py-1.5 rounded-full border"
                    style={{
                      borderColor: profile.platforms.includes(p) ? "var(--color-cyan)" : "var(--color-border)",
                      backgroundColor: profile.platforms.includes(p) ? "color-mix(in srgb, var(--color-cyan) 10%, transparent)" : "transparent",
                      color: profile.platforms.includes(p) ? "var(--color-cyan)" : "var(--color-text-muted)",
                    }}>
                    {p}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Favorites */}
          {hasAnyFavorite(profile) && (
            <Section title="Favorites">
              <div className="grid grid-cols-2 gap-3">
                {profile.favorite_game && <FavCard icon={<Gamepad2 size={14} />} label="Game" value={profile.favorite_game} />}
                {profile.favorite_movie && <FavCard icon={<Film size={14} />} label="Movie" value={profile.favorite_movie} />}
                {profile.favorite_food && <FavCard icon={<Utensils size={14} />} label="Food" value={profile.favorite_food} />}
                {profile.favorite_music && <FavCard icon={<Music size={14} />} label="Music" value={profile.favorite_music} />}
                {profile.favorite_color && (
                  <FavCard
                    icon={<div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: profile.favorite_color }} />}
                    label="Color"
                    value={profile.favorite_color}
                  />
                )}
              </div>
            </Section>
          )}

          {/* Personality results */}
          <Section title="Personality" action={{ label: "Take tests", href: "/personality" }}>
            {personalityResults.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                No results yet. Head to the Personality Corner to take your first test.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {[...ALL_QUIZZES, ...Object.entries(AUTO_CALC_META).map(([slug, m]) => ({ slug, ...m }))].map(q => {
                  const r = personalityResults.find(p => p.test_slug === q.slug);
                  if (!r) return null;
                  return (
                    <div
                      key={q.slug}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ backgroundColor: "var(--color-surface-elevated)", border: "1px solid var(--color-border)" }}
                    >
                      <span className="text-base">{q.icon}</span>
                      <div>
                        <p className="text-xs font-bold" style={{ color: "var(--color-purple)" }}>{r.result_code}</p>
                        <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{q.shortName}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Achievements */}
          <Section title={`Achievements · ${earnedIds.length}/${ALL_ACHIEVEMENTS.length}`}>
            <AchievementGrid
              earned={earnedIds.map(id => ACHIEVEMENT_MAP[id]).filter(Boolean)}
              locked={ALL_ACHIEVEMENTS.filter(a => !earnedIds.includes(a.id))}
            />
          </Section>

        </div>
      </div>
    </>
  );
}

function Section({ title, children, action }: {
  title: string;
  children: React.ReactNode;
  action?: { label: string; href: string };
}) {
  return (
    <div className="rounded-2xl border p-5"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
          {title}
        </h2>
        {action && (
          <Link href={action.href} className="text-xs font-medium" style={{ color: "var(--color-purple)" }}>
            {action.label} →
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function FavCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl"
      style={{ backgroundColor: "var(--color-bg)" }}>
      <span style={{ color: "var(--color-text-muted)" }} className="mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>{label}</p>
        <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{value}</p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <>
      <TopBar title="My Profile" />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-purple)" }} />
      </div>
    </>
  );
}

// ── Helpers ────────────────────────────────────────────────

function hasAnyFavorite(p: ReturnType<typeof useCurrentUser>["profile"]) {
  if (!p) return false;
  return p.favorite_game || p.favorite_movie || p.favorite_food || p.favorite_music || p.favorite_color;
}

function formatBirthday(iso: string) {
  const [, month, day] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(month) - 1]} ${parseInt(day)}`;
}

function getZodiac(iso: string) {
  const [, m, d] = iso.split("-").map(Number);
  const signs = [
    { sign: "Capricorn", symbol: "♑", end: [1, 19] },
    { sign: "Aquarius",  symbol: "♒", end: [2, 18] },
    { sign: "Pisces",    symbol: "♓", end: [3, 20] },
    { sign: "Aries",     symbol: "♈", end: [4, 19] },
    { sign: "Taurus",    symbol: "♉", end: [5, 20] },
    { sign: "Gemini",    symbol: "♊", end: [6, 20] },
    { sign: "Cancer",    symbol: "♋", end: [7, 22] },
    { sign: "Leo",       symbol: "♌", end: [8, 22] },
    { sign: "Virgo",     symbol: "♍", end: [9, 22] },
    { sign: "Libra",     symbol: "♎", end: [10, 22] },
    { sign: "Scorpio",   symbol: "♏", end: [11, 21] },
    { sign: "Sagittarius",symbol:"♐", end: [12, 21] },
    { sign: "Capricorn", symbol: "♑", end: [12, 31] },
  ];
  return signs.find(s => m < s.end[0] || (m === s.end[0] && d <= s.end[1])) ?? signs[0];
}

function getLifePath(iso: string) {
  const digits = iso.replace(/-/g, "").split("").map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = String(sum).split("").map(Number).reduce((a, b) => a + b, 0);
  }
  return sum;
}
