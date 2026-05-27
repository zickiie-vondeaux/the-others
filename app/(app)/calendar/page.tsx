"use client";

import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { CreateEventModal } from "@/components/calendar/CreateEventModal";
import { EventDetailModal } from "@/components/calendar/EventDetailModal";
import { createClient } from "@/lib/supabase/client";
import {
  groupEventsByDate, getBirthdayEvents,
  type AnyEvent, type CalendarEvent,
} from "@/lib/calendar/utils";
import { Plus, List, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type View = "month" | "list";

export default function CalendarPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [birthdays, setBirthdays] = useState<ReturnType<typeof getBirthdayEvents>>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState("member");
  const [view, setView] = useState<View>("month");
  const [direction, setDirection] = useState(1);

  // Modals
  const [createDate, setCreateDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AnyEvent | null>(null);

  const fetchEvents = useCallback(async () => {
    const supabase = createClient();
    // Always fetch ±1 month around current view AND at least 3 months from today
    // so the list view (90-day window) is always fully covered
    const today = new Date();
    const start = new Date(Math.min(
      new Date(month.getFullYear(), month.getMonth() - 1, 1).getTime(),
      today.getTime()
    )).toISOString();
    const end = new Date(Math.max(
      new Date(month.getFullYear(), month.getMonth() + 2, 0).getTime(),
      new Date(today.getFullYear(), today.getMonth() + 3, 0).getTime()
    )).toISOString();

    const { data } = await supabase
      .from("events")
      .select("*, creator:profiles!created_by(display_name)")
      .gte("start_at", start)
      .lte("start_at", end)
      .order("start_at");

    setEvents((data as CalendarEvent[]) ?? []);
  }, [month]);

  // One-time init: user identity + birthdays
  useEffect(() => {
    const supabase = createClient();
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles").select("role").eq("id", user.id).single();
        if (profile) setUserRole(profile.role);
      }
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, birthday, avatar_url, favorite_color")
        .not("birthday", "is", null);
      setBirthdays(getBirthdayEvents(profiles ?? [], month.getFullYear()));
      await fetchEvents();
      setInitialLoading(false);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // runs once on mount

  // Background fetch when month changes (after first load)
  useEffect(() => {
    if (initialLoading) return;
    setFetching(true);
    fetchEvents().finally(() => setFetching(false));
  }, [month]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to realtime event changes
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("calendar-events")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, fetchEvents)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchEvents]);

  const allEvents: AnyEvent[] = [...events, ...birthdays];
  const eventsByDate = groupEventsByDate(allEvents);

  // Upcoming events for list view — use start of today so midnight events (birthdays)
  // and events earlier today aren't incorrectly excluded
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const in90 = new Date(todayStart.getTime() + 90 * 24 * 60 * 60 * 1000);
  const upcomingEvents = allEvents
    .filter(e => new Date(e.start_at) >= todayStart && new Date(e.start_at) <= in90)
    .sort((a, b) => a.start_at.localeCompare(b.start_at));

  return (
    <>
      <TopBar title="Calendar" />
      <div className="flex-1 p-4 md:p-6">
        <div className="max-w-5xl mx-auto">

          {/* Page header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>Calendar</h1>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Birthdays, game nights, and everything in between
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="hidden sm:flex items-center rounded-lg border p-0.5"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                {(["month", "list"] as View[]).map(v => (
                  <button key={v} onClick={() => setView(v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                    style={{
                      backgroundColor: view === v ? "var(--color-purple)" : "transparent",
                      color: view === v ? "white" : "var(--color-text-muted)",
                    }}>
                    {v === "month" ? <CalendarDays size={13} /> : <List size={13} />}
                    {v === "month" ? "Month" : "List"}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCreateDate(new Date())}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:brightness-110"
                style={{ backgroundColor: "var(--color-purple)", color: "white" }}>
                <Plus size={16} /> New Event
              </button>
            </div>
          </div>

          {/* Subtle fetch indicator — thin bar, doesn't hide the calendar */}
          <div className="h-0.5 rounded-full mb-3 overflow-hidden"
            style={{ backgroundColor: "var(--color-border)" }}>
            {fetching && (
              <div className="h-full w-1/3 rounded-full animate-pulse"
                style={{ backgroundColor: "var(--color-purple)" }} />
            )}
          </div>

          {initialLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-6 h-6 rounded-full border-2 animate-spin"
                style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-purple)" }} />
            </div>
          ) : view === "month" ? (
            <CalendarGrid
              month={month}
              direction={direction}
              eventsByDate={eventsByDate}
              onPrev={() => { setDirection(-1); setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1)); }}
              onNext={() => { setDirection(1);  setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1)); }}
              onDateClick={date => setCreateDate(date)}
              onEventClick={event => setSelectedEvent(event)}
            />
          ) : (
            <UpcomingList events={upcomingEvents} onEventClick={e => setSelectedEvent(e)} />
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4">
            {(["birthday","game_night","movie_night","meetup","online","milestone","other"] as const).map(type => {
              const { emoji, label, color } = require("@/lib/calendar/utils").EVENT_META[type];
              return (
                <span key={type} className="flex items-center gap-1.5 text-xs"
                  style={{ color: "var(--color-text-muted)" }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  {emoji} {label}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      {createDate !== null && (
        <CreateEventModal
          initialDate={createDate}
          userId={userId}
          onClose={() => setCreateDate(null)}
          onCreated={fetchEvents}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          userId={userId}
          userRole={userRole}
          onClose={() => setSelectedEvent(null)}
          onDeleted={fetchEvents}
        />
      )}
    </>
  );
}

function UpcomingList({ events, onEventClick }: { events: AnyEvent[]; onEventClick: (e: AnyEvent) => void }) {
  const { EVENT_META, isBirthdayEvent, formatFullDate, formatTime } = require("@/lib/calendar/utils");

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border p-12 text-center"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        <p className="text-lg mb-1" style={{ color: "var(--color-text-secondary)" }}>Nothing coming up</p>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Create an event to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map(event => {
        const meta = EVENT_META[event.type];
        const isBday = isBirthdayEvent(event);
        return (
          <button key={event.id} onClick={() => onEventClick(event)}
            className="w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:border-purple-500/40"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: meta.bg }}>
              {meta.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: "var(--color-text-primary)" }}>
                {event.title}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {formatFullDate(event.start_at)}{!isBday && ` · ${formatTime(event.start_at)}`}
              </p>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full flex-shrink-0"
              style={{ backgroundColor: meta.bg, color: meta.color }}>
              {meta.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
