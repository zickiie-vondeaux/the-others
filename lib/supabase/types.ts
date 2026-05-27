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
