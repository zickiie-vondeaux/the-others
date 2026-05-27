import { createClient } from "@/lib/supabase/client";

export type ActivityType =
  | "game_added"
  | "game_status"
  | "movie_added"
  | "movie_watched"
  | "poll_created"
  | "poll_closed"
  | "personality_taken"
  | "event_created"
  | "member_joined";

export type EntityType = "game" | "movie" | "poll" | "personality" | "event";

export interface ActivityEntry {
  id: string;
  user_id: string;
  type: ActivityType;
  entity_type: EntityType | null;
  entity_id: string | null;
  entity_title: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ActivityEntryWithProfile extends ActivityEntry {
  profile: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    username: string;
  };
}

export const ACTIVITY_LABELS: Record<ActivityType, (title?: string | null, meta?: Record<string,unknown> | null) => string> = {
  game_added:       (t) => `added **${t}** to the game library`,
  game_status:      (t, m) => `moved **${t}** to ${m?.new_status ?? "a new status"}`,
  movie_added:      (t) => `added **${t}** to the movie list`,
  movie_watched:    (t) => `watched **${t}**`,
  poll_created:     (t) => `started a poll: **${t}**`,
  poll_closed:      (t, m) => `closed the poll **${t}** — winner: **${m?.winner ?? "TBD"}**`,
  personality_taken:(t) => `got **${t}** on a personality quiz`,
  event_created:    (t) => `scheduled **${t}**`,
  member_joined:    ()  => `joined The Others`,
};

export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  game_added:        "🎮",
  game_status:       "🎮",
  movie_added:       "🎬",
  movie_watched:     "✅",
  poll_created:      "🗳",
  poll_closed:       "🏆",
  personality_taken: "🧠",
  event_created:     "📅",
  member_joined:     "👋",
};

export async function logActivity(params: {
  type: ActivityType;
  entityType?: EntityType;
  entityId?: string;
  entityTitle?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("activity_feed").insert({
    user_id: user.id,
    type: params.type,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
    entity_title: params.entityTitle ?? null,
    metadata: params.metadata ?? null,
  });
}
