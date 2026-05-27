import type { Profile } from "@/lib/supabase/types";

export interface BirthdayMessage {
  id: string;
  for_user_id: string;
  from_user_id: string;
  message: string;
  year: number;
  created_at: string;
  from_profile?: Pick<Profile, "id" | "display_name" | "avatar_url">;
}

export function isBirthdayToday(birthday: string | null): boolean {
  if (!birthday) return false;
  const today = new Date();
  const [, monthStr, dayStr] = birthday.split("-");
  return (
    parseInt(monthStr) === today.getMonth() + 1 &&
    parseInt(dayStr) === today.getDate()
  );
}

export function isBirthdaySoon(birthday: string | null, withinDays = 7): boolean {
  if (!birthday) return false;
  const today = new Date();
  const [, monthStr, dayStr] = birthday.split("-");
  const month = parseInt(monthStr) - 1;
  const day = parseInt(dayStr);
  const next = new Date(today.getFullYear(), month, day);
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  const diff = (next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= withinDays;
}

export function daysUntilBirthday(birthday: string | null): number | null {
  if (!birthday) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [, monthStr, dayStr] = birthday.split("-");
  const month = parseInt(monthStr) - 1;
  const day = parseInt(dayStr);
  const next = new Date(today.getFullYear(), month, day);
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatBirthdayDate(birthday: string): string {
  const [, monthStr, dayStr] = birthday.split("-");
  const date = new Date(2000, parseInt(monthStr) - 1, parseInt(dayStr));
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

// Key for localStorage — prevents showing the surprise screen more than once per day
export function getSurpriseSeenKey(userId: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `birthday_surprise_seen_${userId}_${today}`;
}
