import { createClient } from "@/lib/supabase/client";
import { logActivity } from "@/lib/activity";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "uncommon" | "rare" | "legendary";
}

export const ALL_ACHIEVEMENTS: Achievement[] = [
  // Onboarding
  { id: "founding_otter",    name: "Founding Otter",     icon: "🦦", rarity: "legendary", description: "One of the first 5 members to join The Others." },
  { id: "first_impression",  name: "First Impression",   icon: "👋", rarity: "common",    description: "Joined The Others." },
  { id: "got_personality",   name: "Got Personality",    icon: "🧭", rarity: "common",    description: "Completed your first personality quiz." },
  { id: "know_thyself",      name: "Know Thyself",       icon: "🧠", rarity: "uncommon",  description: "Completed all 6 personality quizzes." },
  { id: "cosmic_self",       name: "Cosmic Self",        icon: "✨", rarity: "uncommon",  description: "Unlocked all 4 auto-calculated personality systems." },

  // Gaming
  { id: "first_game",        name: "Player One",         icon: "🎮", rarity: "common",    description: "Added your first game to the library." },
  { id: "gamer",             name: "Gamer",              icon: "🏆", rarity: "uncommon",  description: "Marked 5 games as completed." },
  { id: "completionist",     name: "Completionist",      icon: "💎", rarity: "rare",      description: "Marked 10 games as completed." },
  { id: "backlog_keeper",    name: "Backlog Keeper",     icon: "📚", rarity: "common",    description: "Added 5 games to the queue." },

  // Movies
  { id: "first_movie",       name: "Lights, Camera",     icon: "🎬", rarity: "common",    description: "Added your first movie to the list." },
  { id: "cinephile",         name: "Cinephile",          icon: "🍿", rarity: "uncommon",  description: "Watched 5 movies with the group." },
  { id: "movie_buff",        name: "Movie Buff",         icon: "🎞", rarity: "rare",      description: "Watched 10 movies with the group." },
  { id: "poll_starter",      name: "Poll Starter",       icon: "🗳", rarity: "common",    description: "Created your first movie poll." },
  { id: "poll_master",       name: "Poll Master",        icon: "⚖️", rarity: "uncommon",  description: "Created 3 movie polls." },

  // Social
  { id: "birthday_buddy",    name: "Birthday Buddy",     icon: "🎂", rarity: "common",    description: "Wrote a birthday message for someone." },
  { id: "reactor",           name: "Reactor",            icon: "⚡", rarity: "common",    description: "Reacted to 10 activity feed posts." },
  { id: "active_otter",      name: "Active Otter",       icon: "🔥", rarity: "uncommon",  description: "Logged 20 activities in The Others." },
];

export const ACHIEVEMENT_MAP = Object.fromEntries(ALL_ACHIEVEMENTS.map(a => [a.id, a]));

export const RARITY_COLOR: Record<Achievement["rarity"], { color: string; bg: string; border: string }> = {
  common:    { color: "var(--color-text-secondary)", bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.3)" },
  uncommon:  { color: "var(--color-cyan)",   bg: "rgba(6,182,212,0.12)",   border: "rgba(6,182,212,0.3)"   },
  rare:      { color: "var(--color-purple)", bg: "rgba(139,92,246,0.12)",  border: "rgba(139,92,246,0.3)"  },
  legendary: { color: "var(--color-gold)",   bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)"  },
};

// ── Unlock logic ──────────────────────────────────────────────

export async function checkAndUnlockAchievements(userId: string): Promise<Achievement[]> {
  const supabase = createClient();

  // Load all data needed for checks in parallel
  const [
    { data: existing },
    { data: profiles },
    { data: games },
    { data: userGameStatuses },
    { data: movies },
    { data: userMovieStatuses },
    { data: polls },
    { data: personalityResults },
    { data: birthdayMessages },
    { data: reactions },
    { data: activityCount },
  ] = await Promise.all([
    supabase.from("user_achievements").select("achievement_id").eq("user_id", userId),
    supabase.from("profiles").select("id,created_at").order("created_at", { ascending: true }).limit(5),
    supabase.from("games").select("id,group_status,added_by"),
    supabase.from("user_game_status").select("status").eq("user_id", userId),
    supabase.from("movies").select("id,group_status,added_by"),
    supabase.from("user_movie_status").select("status").eq("user_id", userId),
    supabase.from("polls").select("id").eq("created_by", userId),
    supabase.from("personality_results").select("test_slug").eq("user_id", userId),
    supabase.from("birthday_messages").select("id").eq("from_user_id", userId),
    supabase.from("reactions").select("id").eq("user_id", userId),
    supabase.from("activity_feed").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const alreadyHave = new Set((existing ?? []).map((e: any) => e.achievement_id));

  const AUTO_CALC_SLUGS = ["zodiac", "chinese_zodiac", "life_path", "human_design"];
  const QUIZ_SLUGS = ["mbti", "enneagram", "big_five", "love_languages", "attachment", "disc"];
  const takenSlugs = new Set((personalityResults ?? []).map((r: any) => r.test_slug));
  const completedGames = (userGameStatuses ?? []).filter((s: any) => s.status === "completed").length;
  const queuedGames = (userGameStatuses ?? []).filter((s: any) => s.status === "want_to_play").length;
  const watchedMovies = (userMovieStatuses ?? []).filter((s: any) => s.status === "watched").length;
  const myGames = (games ?? []).filter((g: any) => g.added_by === userId);
  const myMovies = (movies ?? []).filter((m: any) => m.added_by === userId);
  const pollCount = (polls ?? []).length;
  const birthdayCount = (birthdayMessages ?? []).length;
  const reactionCount = (reactions ?? []).length;
  const actCount = (activityCount as any)?.count ?? 0;
  const isFoundingMember = (profiles ?? []).slice(0, 5).some((p: any) => p.id === userId);

  const shouldHave: string[] = [
    "first_impression",
    ...(isFoundingMember ? ["founding_otter"] : []),
    ...(myGames.length >= 1 ? ["first_game"] : []),
    ...(completedGames >= 5 ? ["gamer"] : []),
    ...(completedGames >= 10 ? ["completionist"] : []),
    ...((myGames.length + queuedGames) >= 5 ? ["backlog_keeper"] : []),
    ...(myMovies.length >= 1 ? ["first_movie"] : []),
    ...(watchedMovies >= 5 ? ["cinephile"] : []),
    ...(watchedMovies >= 10 ? ["movie_buff"] : []),
    ...(pollCount >= 1 ? ["poll_starter"] : []),
    ...(pollCount >= 3 ? ["poll_master"] : []),
    ...(takenSlugs.size >= 1 ? ["got_personality"] : []),
    ...(QUIZ_SLUGS.every(s => takenSlugs.has(s)) ? ["know_thyself"] : []),
    ...(AUTO_CALC_SLUGS.every(s => takenSlugs.has(s)) ? ["cosmic_self"] : []),
    ...(birthdayCount >= 1 ? ["birthday_buddy"] : []),
    ...(reactionCount >= 10 ? ["reactor"] : []),
    ...(actCount >= 20 ? ["active_otter"] : []),
  ];

  const newIds = shouldHave.filter(id => !alreadyHave.has(id));
  if (newIds.length === 0) return [];

  await supabase.from("user_achievements").upsert(
    newIds.map(achievement_id => ({ user_id: userId, achievement_id })),
    { onConflict: "user_id,achievement_id", ignoreDuplicates: true }
  );

  // Log the first new achievement to activity feed
  if (newIds.length > 0) {
    const first = ACHIEVEMENT_MAP[newIds[0]];
    if (first) {
      logActivity({
        type: "personality_taken", // reuse closest type — activity feed shows it as a generic entry
        entityType: "personality",
        entityId: first.id,
        entityTitle: `${first.icon} ${first.name}`,
        metadata: { achievement: true },
      });
    }
  }

  return newIds.map(id => ACHIEVEMENT_MAP[id]).filter(Boolean);
}
