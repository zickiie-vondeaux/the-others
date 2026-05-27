export type EventType = "birthday" | "game_night" | "movie_night" | "meetup" | "online" | "milestone" | "other";

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  start_at: string;
  end_at?: string | null;
  description?: string | null;
  location_or_link?: string | null;
  created_by?: string | null;
  creator?: { display_name: string } | null;
}

export interface BirthdayEvent {
  id: string;
  title: string;
  type: "birthday";
  start_at: string;
  profile: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    favorite_color: string | null;
  };
}

export type AnyEvent = CalendarEvent | BirthdayEvent;

export function isBirthdayEvent(e: AnyEvent): e is BirthdayEvent {
  return e.type === "birthday" && "profile" in e;
}

export const EVENT_META: Record<EventType, { label: string; color: string; bg: string; emoji: string }> = {
  birthday:   { label: "Birthday",    color: "#fbbf24", bg: "rgba(251,191,36,0.15)",  emoji: "🎂" },
  game_night: { label: "Game Night",  color: "#a855f7", bg: "rgba(168,85,247,0.15)",  emoji: "🎮" },
  movie_night:{ label: "Movie Night", color: "#06b6d4", bg: "rgba(6,182,212,0.15)",   emoji: "🎬" },
  meetup:     { label: "Meetup",      color: "#10b981", bg: "rgba(16,185,129,0.15)",  emoji: "📍" },
  online:     { label: "Online",      color: "#3b82f6", bg: "rgba(59,130,246,0.15)",  emoji: "💻" },
  milestone:  { label: "Milestone",   color: "#ec4899", bg: "rgba(236,72,153,0.15)",  emoji: "🏆" },
  other:      { label: "Other",       color: "#94a3b8", bg: "rgba(148,163,184,0.15)", emoji: "📅" },
};

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function eventDateKey(isoString: string): string {
  // Parse as local date from the ISO string date portion
  const [datePart] = isoString.split("T");
  return datePart;
}

export function getCalendarCells(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const cells: Date[] = [];

  // Fill leading days from previous month
  for (let i = 0; i < firstDay.getDay(); i++) {
    cells.push(new Date(year, month, -firstDay.getDay() + i + 1));
  }
  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(new Date(year, month, d));
  }
  // Fill trailing days to complete 6 rows (42 cells)
  while (cells.length < 42) {
    cells.push(new Date(year, month + 1, cells.length - firstDay.getDay() - lastDay.getDate() + 1));
  }
  return cells;
}

export function getBirthdayEvents(
  profiles: { id: string; display_name: string; birthday: string | null; avatar_url: string | null; favorite_color: string | null }[],
  year: number
): BirthdayEvent[] {
  return profiles
    .filter(p => p.birthday)
    .map(p => {
      const [, month, day] = p.birthday!.split("-");
      return {
        id: `bday-${p.id}`,
        title: `${p.display_name}'s Birthday`,
        type: "birthday" as const,
        start_at: `${year}-${month}-${day}T00:00:00`,
        profile: {
          id: p.id,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
          favorite_color: p.favorite_color,
        },
      };
    });
}

export function groupEventsByDate(events: AnyEvent[]): Record<string, AnyEvent[]> {
  const map: Record<string, AnyEvent[]> = {};
  for (const e of events) {
    const key = eventDateKey(e.start_at);
    if (!map[key]) map[key] = [];
    map[key].push(e);
  }
  return map;
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatFullDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
