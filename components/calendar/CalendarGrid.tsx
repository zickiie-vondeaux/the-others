"use client";

import { getCalendarCells, toDateKey, EVENT_META, type AnyEvent, isBirthdayEvent } from "@/lib/calendar/utils";
import { cn } from "@/lib/utils/cn";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface Props {
  month: Date;
  eventsByDate: Record<string, AnyEvent[]>;
  onPrev: () => void;
  onNext: () => void;
  onDateClick: (date: Date) => void;
  onEventClick: (event: AnyEvent) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const TODAY = toDateKey(new Date());

export function CalendarGrid({ month, eventsByDate, onPrev, onNext, onDateClick, onEventClick }: Props) {
  const cells = getCalendarCells(month.getFullYear(), month.getMonth());
  const currentMonthNum = month.getMonth();

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: "var(--color-border)" }}>
        <button onClick={onPrev} className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: "var(--color-text-secondary)" }}>
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
          {MONTHS[month.getMonth()]} {month.getFullYear()}
        </h2>
        <button onClick={onNext} className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: "var(--color-text-secondary)" }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b" style={{ borderColor: "var(--color-border)" }}>
        {DAYS.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--color-text-muted)" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid cells */}
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          const key = toDateKey(date);
          const isToday = key === TODAY;
          const isCurrentMonth = date.getMonth() === currentMonthNum;
          const events = eventsByDate[key] ?? [];
          const visible = events.slice(0, 3);
          const overflow = events.length - 3;
          const isLastRow = i >= 35;

          return (
            <div
              key={key + i}
              onClick={() => onDateClick(date)}
              className={cn(
                "min-h-[90px] p-1.5 border-b border-r cursor-pointer group transition-colors hover:bg-white/[0.03]",
                isLastRow && "border-b-0",
                (i + 1) % 7 === 0 && "border-r-0"
              )}
              style={{ borderColor: "var(--color-border)" }}
            >
              {/* Date number */}
              <div className="flex items-start justify-between mb-1">
                <span
                  className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    isToday ? "text-black font-bold" : ""
                  )}
                  style={{
                    backgroundColor: isToday ? "var(--color-cyan)" : "transparent",
                    color: isToday ? "black" : isCurrentMonth ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  }}
                >
                  {date.getDate()}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); onDateClick(date); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <Plus size={12} />
                </button>
              </div>

              {/* Events */}
              <div className="space-y-0.5">
                {visible.map(event => {
                  const meta = EVENT_META[event.type];
                  const label = isBirthdayEvent(event)
                    ? event.profile.display_name + "'s 🎂"
                    : event.title;
                  return (
                    <button
                      key={event.id}
                      onClick={e => { e.stopPropagation(); onEventClick(event); }}
                      className="w-full text-left text-[10px] font-medium px-1.5 py-0.5 rounded truncate transition-opacity hover:opacity-80"
                      style={{ backgroundColor: meta.bg, color: meta.color }}
                      title={label}
                    >
                      {label}
                    </button>
                  );
                })}
                {overflow > 0 && (
                  <p className="text-[10px] px-1.5" style={{ color: "var(--color-text-muted)" }}>
                    +{overflow} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
