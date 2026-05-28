"use client";

import { useCallback, useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { ActivityFeed } from "@/components/group/ActivityFeed";
import { GroupStats, type QuickLookData } from "@/components/group/GroupStats";
import { PersonalityOverview } from "@/components/group/PersonalityOverview";
import { BirthdayBanner } from "@/components/birthday/BirthdayBanner";
import { BirthdayMessageWall } from "@/components/birthday/BirthdayMessageWall";
import { useBirthdays } from "@/components/birthday/BirthdayProvider";
import { createClient } from "@/lib/supabase/client";
import { daysUntilBirthday, formatBirthdayDate } from "@/lib/birthday";
import type { ActivityEntryWithProfile } from "@/lib/activity";
import type { PersonalityResult } from "@/lib/supabase/types";

export default function GroupCornerPage() {
  const { todaysCelebrants, upcomingBirthdays, myProfile } = useBirthdays();
  const [birthdayWallUserId, setBirthdayWallUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState("");
  const [feed, setFeed] = useState<ActivityEntryWithProfile[]>([]);
  const [reactions, setReactions] = useState<{ user_id: string; emoji: string; activity_id: string }[]>([]);
  const [personalityResults, setPersonalityResults] = useState<PersonalityResult[]>([]);
  const [stats, setStats] = useState({
    totalGames: 0,
    gamesPlaying: 0,
    gamesCompleted: 0,
    totalMovies: 0,
    moviesWatched: 0,
    activeMembers: 0,
    totalMembers: 0,
    topMember: null as { name: string; count: number } | null,
  });
  const [quickLook, setQuickLook] = useState<QuickLookData>({
    topGameGenres: [],
    recentlyActiveGame: null,
    moviesWatchlist: 0,
    recentlyWatchedMovie: null,
    mostActiveThisWeek: null,
    newestMember: null,
  });

  const supabase = createClient();

  const load = useCallback(async () => {
    try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setMyUserId(user.id);

    const [
      { data: feedData },
      { data: reactionData },
      { data: gamesData },
      { data: moviesData },
      { data: profilesData },
      { data: personalityData },
      { data: activityCountData },
      { data: weeklyActivityData },
    ] = await Promise.all([
      supabase.from("activity_feed")
        .select("*, profile:profiles!activity_feed_user_id_fkey(id,display_name,avatar_url,username)")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("reactions").select("user_id,emoji,activity_id"),
      supabase.from("games").select("genres, group_status"),
      supabase.from("movies").select("group_status"),
      supabase.from("profiles").select("id,display_name,created_at"),
      supabase.from("personality_results").select("*").eq("is_shared", true),
      supabase.from("activity_feed")
        .select("user_id")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from("activity_feed")
        .select("user_id")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    setFeed((feedData ?? []) as ActivityEntryWithProfile[]);
    setReactions((reactionData ?? []) as { user_id: string; emoji: string; activity_id: string }[]);
    setPersonalityResults((personalityData ?? []) as PersonalityResult[]);

    // Compute stats
    const games = gamesData ?? [];
    const movies = moviesData ?? [];
    const profiles = profilesData ?? [];

    // Most active member (last 30 days)
    const actCounts: Record<string, number> = {};
    (activityCountData ?? []).forEach((a: { user_id: string }) => {
      actCounts[a.user_id] = (actCounts[a.user_id] ?? 0) + 1;
    });
    const topEntry = Object.entries(actCounts).sort((a, b) => b[1] - a[1])[0];
    const topProfile = topEntry ? (profiles as { id: string; display_name: string }[]).find(p => p.id === topEntry[0]) : null;

    const typedGames = games as { genres: string[]; group_status: string }[];
    const typedMovies = movies as { group_status: string }[];
    const typedProfiles = profiles as { id: string; display_name: string; created_at: string }[];

    setStats({
      totalGames: games.length,
      gamesPlaying: typedGames.filter(g => g.group_status === "playing").length,
      gamesCompleted: typedGames.filter(g => g.group_status === "completed").length,
      totalMovies: movies.length,
      moviesWatched: typedMovies.filter(m => m.group_status === "watched").length,
      activeMembers: Object.keys(actCounts).length,
      totalMembers: profiles.length,
      topMember: topProfile ? { name: topProfile.display_name, count: topEntry[1] } : null,
    });

    // QuickLook data
    const genreCount: Record<string, number> = {};
    typedGames.forEach(g => {
      (Array.isArray(g.genres) ? g.genres : []).forEach(genre => {
        if (typeof genre === "string") genreCount[genre] = (genreCount[genre] ?? 0) + 1;
      });
    });
    const topGameGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g]) => g);

    const recentlyActiveGame =
      (feedData ?? []).find(e => e.type === "game_added" || e.type === "game_status")
        ?.entity_title ?? null;

    const moviesWatchlist = typedMovies.filter(m => m.group_status === "queue").length;

    const recentlyWatchedMovie =
      (feedData ?? []).find(e => e.type === "movie_watched")?.entity_title ?? null;

    const weekCounts: Record<string, number> = {};
    (weeklyActivityData ?? []).forEach((a: { user_id: string }) => {
      weekCounts[a.user_id] = (weekCounts[a.user_id] ?? 0) + 1;
    });
    const topWeekEntry = Object.entries(weekCounts).sort((a, b) => b[1] - a[1])[0];
    const topWeekProfile = topWeekEntry
      ? typedProfiles.find(p => p.id === topWeekEntry[0])
      : null;

    const newestProfile = [...typedProfiles].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    setQuickLook({
      topGameGenres,
      recentlyActiveGame,
      moviesWatchlist,
      recentlyWatchedMovie,
      mostActiveThisWeek: topWeekProfile ? { name: topWeekProfile.display_name } : null,
      newestMember: newestProfile
        ? { name: newestProfile.display_name, joinDate: newestProfile.created_at }
        : null,
    });

    setLoading(false);
    } catch (err) {
      console.error("[GroupCorner] load error:", err);
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <>
        <TopBar title="Group Corner" />
        <div className="flex-1 flex items-center justify-center" style={{ color: "var(--color-text-muted)" }}>
          Loading…
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Group Corner" />
      <div className="flex-1 overflow-y-auto">
        <div className="px-[8%] py-6 flex flex-col gap-6">

          <div>
            <h1 className="neon-heading text-4xl font-black mb-1 uppercase tracking-widest">
              Group Corner
            </h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Your group&apos;s living dashboard.
            </p>
          </div>

          {/* Birthday banner */}
          {todaysCelebrants.length > 0 && (
            <BirthdayBanner
              celebrants={todaysCelebrants}
              onClickCelebrant={id => setBirthdayWallUserId(id)}
            />
          )}

          {/* Birthday message wall modal */}
          {birthdayWallUserId && myProfile && (() => {
            const celebrant = todaysCelebrants.find(c => c.id === birthdayWallUserId);
            if (!celebrant) return null;
            return (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
                onClick={e => { if (e.target === e.currentTarget) setBirthdayWallUserId(null); }}
              >
                <div
                  className="w-full max-w-md rounded-2xl p-6"
                  style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                >
                  <BirthdayMessageWall
                    forUserId={birthdayWallUserId}
                    forUserName={celebrant.display_name}
                    myUserId={myProfile.id}
                    onClose={() => setBirthdayWallUserId(null)}
                  />
                </div>
              </div>
            );
          })()}

          <GroupStats stats={stats} quickLook={quickLook} />

          {/* Upcoming birthdays */}
          {upcomingBirthdays.length > 0 && (
            <div
              className="flex gap-3 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "none" }}
            >
              {upcomingBirthdays.map(p => (
                <div
                  key={p.id}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl text-center"
                  style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", minWidth: 88 }}
                >
                  {p.avatar_url
                    ? <img src={p.avatar_url} alt={p.display_name} className="w-10 h-10 rounded-full object-cover" />
                    : <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: "var(--color-surface-elevated)", color: "var(--color-purple)" }}>
                        {p.display_name[0]?.toUpperCase()}
                      </div>}
                  <p className="text-xs font-medium leading-tight truncate w-full" style={{ color: "var(--color-text-primary)" }}>
                    {p.display_name.split(" ")[0]}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                    {p.birthday ? formatBirthdayDate(p.birthday) : ""}
                  </p>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: "rgba(251,191,36,0.12)", color: "var(--color-gold)" }}
                  >
                    {p.daysUntil === 0 ? "Today!" : p.daysUntil === 1 ? "Tomorrow" : `${p.daysUntil}d`}
                  </span>
                </div>
              ))}
            </div>
          )}

          <PersonalityOverview results={personalityResults} totalMembers={stats.totalMembers} />

          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: "var(--color-cyan)", textShadow: "0 0 8px rgba(0,255,234,0.45)" }}>
              Activity
            </h2>
            <ActivityFeed initial={feed} allReactions={reactions} myUserId={myUserId} />
          </section>

        </div>
      </div>
    </>
  );
}
