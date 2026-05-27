export type Role = "member" | "moderator" | "super_admin";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  real_name: string | null;
  ign: string | null;
  avatar_url: string | null;
  bio: string | null;
  birthday: string | null; // ISO date string YYYY-MM-DD
  city: string | null;
  timezone: string;
  favorite_game: string | null;
  favorite_movie: string | null;
  favorite_food: string | null;
  favorite_color: string | null;
  favorite_music: string | null;
  platforms: string[];
  role: Role;
  onboarding_complete: boolean;
  created_at: string;
  last_active_at: string;
}

export const PLATFORMS = ["PC", "PS5", "Xbox", "Switch", "Mobile"] as const;
export type Platform = (typeof PLATFORMS)[number];

// ── Gaming ─────────────────────────────────────────────────────

export type GroupGameStatus = "queue" | "playing" | "completed" | "dropped";
export type PersonalGameStatus = "playing_solo" | "completed" | "want_to_play" | "not_interested";

export interface Game {
  id: string;
  igdb_id: number | null;
  title: string;
  cover_url: string | null;
  release_year: number | null;
  genres: string[];
  platforms: string[];
  is_multiplayer: boolean;
  summary: string | null;
  group_status: GroupGameStatus;
  added_by: string | null;
  created_at: string;
}

export interface UserGameStatus {
  id: string;
  user_id: string;
  game_id: string;
  status: PersonalGameStatus;
  created_at: string;
}

export const GROUP_STATUS_META: Record<GroupGameStatus, { label: string; color: string; bg: string }> = {
  playing:   { label: "Playing",   color: "var(--color-cyan)",   bg: "rgba(6,182,212,0.15)"  },
  queue:     { label: "Queue",     color: "var(--color-purple)", bg: "rgba(124,58,237,0.15)" },
  completed: { label: "Completed", color: "var(--color-green)",  bg: "rgba(16,185,129,0.15)" },
  dropped:   { label: "Dropped",   color: "var(--color-text-muted)", bg: "rgba(71,85,105,0.15)" },
};

export const PERSONAL_STATUS_META: Record<PersonalGameStatus, { label: string; icon: string }> = {
  playing_solo:   { label: "Playing solo",   icon: "🎮" },
  completed:      { label: "Completed",      icon: "✅" },
  want_to_play:   { label: "Want to play",   icon: "⭐" },
  not_interested: { label: "Not interested", icon: "👻" },
};

// ── Movies ─────────────────────────────────────────────────────

export type GroupMovieStatus = "queue" | "watching" | "watched" | "dropped";
export type PersonalMovieStatus = "watched" | "watching" | "want_to_watch" | "not_interested";

export interface Movie {
  id: string;
  omdb_id: string | null;
  title: string;
  poster_url: string | null;
  release_year: number | null;
  genres: string[];
  runtime_minutes: number | null;
  overview: string | null;
  director: string | null;
  group_status: GroupMovieStatus;
  added_by: string | null;
  created_at: string;
}

export interface UserMovieStatus {
  id: string;
  user_id: string;
  movie_id: string;
  status: PersonalMovieStatus;
  watched_at: string | null;
  created_at: string;
}

export interface Poll {
  id: string;
  title: string;
  created_by: string | null;
  closes_at: string | null;
  is_closed: boolean;
  hide_until_closed: boolean;
  winning_movie_id: string | null;
  created_at: string;
}

export interface PollOption {
  id: string;
  poll_id: string;
  movie_id: string;
  position: number;
}

export interface PollVote {
  id: string;
  poll_id: string;
  user_id: string;
  rankings: { option_id: string; rank: number }[];
  created_at: string;
}

export const GROUP_MOVIE_STATUS_META: Record<GroupMovieStatus, { label: string; color: string; bg: string }> = {
  queue:    { label: "Watch Queue",  color: "var(--color-purple)", bg: "rgba(124,58,237,0.15)"  },
  watching: { label: "Watching",     color: "var(--color-cyan)",   bg: "rgba(6,182,212,0.15)"   },
  watched:  { label: "Watched",      color: "var(--color-green)",  bg: "rgba(16,185,129,0.15)"  },
  dropped:  { label: "Did Not Finish", color: "var(--color-text-muted)", bg: "rgba(71,85,105,0.15)" },
};

export const PERSONAL_MOVIE_STATUS_META: Record<PersonalMovieStatus, { label: string; icon: string }> = {
  watched:        { label: "Watched",        icon: "✅" },
  watching:       { label: "Watching",       icon: "👀" },
  want_to_watch:  { label: "Want to watch",  icon: "⭐" },
  not_interested: { label: "Not interested", icon: "👻" },
};
