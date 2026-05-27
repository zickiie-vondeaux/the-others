"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { EVENT_META, formatFullDate, formatTime, isBirthdayEvent, type AnyEvent } from "@/lib/calendar/utils";
import { X, MapPin, Clock, Trash2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type RsvpStatus = "going" | "maybe" | "not_going";

interface RsvpCounts {
  going: number;
  maybe: number;
  not_going: number;
}

interface Props {
  event: AnyEvent;
  userId: string;
  userRole: string;
  onClose: () => void;
  onDeleted: () => void;
}

export function EventDetailModal({ event, userId, userRole, onClose, onDeleted }: Props) {
  const meta = EVENT_META[event.type];
  const isBday = isBirthdayEvent(event);

  const [myRsvp, setMyRsvp] = useState<RsvpStatus | null>(null);
  const [counts, setCounts] = useState<RsvpCounts>({ going: 0, maybe: 0, not_going: 0 });
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isBday) return;
    const supabase = createClient();
    supabase
      .from("event_rsvps")
      .select("user_id, status")
      .eq("event_id", event.id)
      .then(({ data }) => {
        if (!data) return;
        const c: RsvpCounts = { going: 0, maybe: 0, not_going: 0 };
        for (const r of data) {
          c[r.status as RsvpStatus]++;
          if (r.user_id === userId) setMyRsvp(r.status as RsvpStatus);
        }
        setCounts(c);
      });
  }, [event.id, userId, isBday]);

  async function rsvp(status: RsvpStatus) {
    if (isBday) return;
    setRsvpLoading(true);
    const supabase = createClient();

    if (myRsvp === status) {
      // Toggle off
      await supabase.from("event_rsvps").delete().eq("event_id", event.id).eq("user_id", userId);
      setCounts(c => ({ ...c, [status]: c[status] - 1 }));
      setMyRsvp(null);
    } else {
      await supabase.from("event_rsvps").upsert({ event_id: event.id, user_id: userId, status });
      setCounts(c => {
        const next = { ...c, [status]: c[status] + 1 };
        if (myRsvp) next[myRsvp] = next[myRsvp] - 1;
        return next;
      });
      setMyRsvp(status);
    }
    setRsvpLoading(false);
  }

  async function deleteEvent() {
    if (isBday) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("events").delete().eq("id", event.id);
    onDeleted();
    onClose();
  }

  const canDelete = !isBday && (
    ("created_by" in event && event.created_by === userId) ||
    userRole === "super_admin" || userRole === "moderator"
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-md rounded-2xl border z-10 overflow-hidden"
          style={{ backgroundColor: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}
        >
          {/* Colored top bar */}
          <div className="h-1.5 w-full" style={{ backgroundColor: meta.color }} />

          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{meta.emoji}</span>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider mb-1 block"
                    style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                  <h2 className="text-lg font-bold leading-tight" style={{ color: "var(--color-text-primary)" }}>
                    {event.title}
                  </h2>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
                style={{ color: "var(--color-text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            {/* Birthday profile */}
            {isBday && (
              <div className="flex items-center gap-3 p-3 rounded-xl mb-4"
                style={{ backgroundColor: "var(--color-bg)", borderColor: "var(--color-border)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                  style={{ background: event.profile.favorite_color || "var(--color-purple)" }}>
                  {event.profile.avatar_url
                    ? <img src={event.profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    : event.profile.display_name[0]?.toUpperCase()
                  }
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
                    {event.profile.display_name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>It&apos;s their birthday! 🎉</p>
                </div>
              </div>
            )}

            {/* Date/time */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                <Clock size={14} style={{ color: "var(--color-text-muted)" }} />
                <span>{formatFullDate(event.start_at)}</span>
              </div>
              {!isBday && (
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  <span className="w-3.5" />
                  <span>{formatTime(event.start_at)}</span>
                </div>
              )}
              {"location_or_link" in event && event.location_or_link && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={14} style={{ color: "var(--color-text-muted)" }} />
                  <a href={event.location_or_link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:underline truncate"
                    style={{ color: "var(--color-cyan)" }}>
                    {event.location_or_link.replace(/^https?:\/\//, "")}
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>

            {/* Description */}
            {"description" in event && event.description && (
              <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--color-text-secondary)" }}>
                {event.description}
              </p>
            )}

            {/* RSVP — only for non-birthday events */}
            {!isBday && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: "var(--color-text-muted)" }}>
                  Are you going?
                </p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {([ ["going","✅","Going"], ["maybe","🤔","Maybe"], ["not_going","❌","Can't"] ] as const).map(([status, emoji, label]) => (
                    <button key={status} onClick={() => rsvp(status as RsvpStatus)}
                      disabled={rsvpLoading}
                      className={cn(
                        "flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all disabled:opacity-60",
                      )}
                      style={{
                        borderColor: myRsvp === status ? meta.color : "var(--color-border)",
                        backgroundColor: myRsvp === status ? meta.bg : "transparent",
                        color: myRsvp === status ? meta.color : "var(--color-text-secondary)",
                      }}>
                      <span className="text-base">{emoji}</span>
                      <span>{label}</span>
                      <span style={{ color: "var(--color-text-muted)" }}>
                        {counts[status as RsvpStatus]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Delete */}
            {canDelete && (
              <button onClick={deleteEvent} disabled={deleting}
                className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg transition-all hover:bg-red-500/10 disabled:opacity-50 mt-2"
                style={{ color: "var(--color-red)" }}>
                <Trash2 size={13} />
                {deleting ? "Deleting..." : "Delete event"}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
