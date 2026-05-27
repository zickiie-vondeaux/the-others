"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  GROUP_MOVIE_STATUS_META, PERSONAL_MOVIE_STATUS_META,
  type Movie, type GroupMovieStatus, type PersonalMovieStatus, type Profile,
} from "@/lib/supabase/types";
import { X, Film, Users, Star, CalendarPlus, Trash2, Loader2, Clock } from "lucide-react";

interface MemberStatus {
  profile: Pick<Profile, "id" | "display_name" | "avatar_url" | "username">;
  status: PersonalMovieStatus;
}

interface Props {
  movie: Movie;
  myUserId: string;
  myStatus: PersonalMovieStatus | null;
  memberStatuses: MemberStatus[];
  totalMembers: number;
  isAdmin: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onDelete?: () => void;
}

const GROUP_OPTIONS: GroupMovieStatus[] = ["queue", "watching", "watched", "dropped"];
const PERSONAL_OPTIONS: PersonalMovieStatus[] = ["watched", "watching", "want_to_watch", "not_interested"];

export function MovieDetailModal({ movie, myUserId, myStatus, memberStatuses, totalMembers, isAdmin, onClose, onUpdated, onDelete }: Props) {
  const [groupStatus, setGroupStatus] = useState<GroupMovieStatus>(movie.group_status);
  const [personalStatus, setPersonalStatus] = useState<PersonalMovieStatus | null>(myStatus);
  const [saving, setSaving] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split("T")[0]; });
  const [scheduleTime, setScheduleTime] = useState("20:00");
  const [scheduling, setScheduling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const watchedCount = memberStatuses.filter(m => m.status === "watched").length;
  const wantCount = memberStatuses.filter(m => m.status === "want_to_watch").length;
  const membersWatched = memberStatuses.filter(m => m.status === "watched");
  const membersWatching = memberStatuses.filter(m => m.status === "watching");
  const membersWant = memberStatuses.filter(m => m.status === "want_to_watch");

  async function updateGroupStatus(s: GroupMovieStatus) {
    if (s === groupStatus) return;
    setGroupStatus(s);
    await createClient().from("movies").update({ group_status: s }).eq("id", movie.id);
    onUpdated();
  }

  async function updatePersonalStatus(s: PersonalMovieStatus | null) {
    setSaving(true);
    const supabase = createClient();
    if (s === null || s === personalStatus) {
      await supabase.from("user_movie_status").delete().eq("user_id", myUserId).eq("movie_id", movie.id);
      setPersonalStatus(null);
    } else {
      await supabase.from("user_movie_status").upsert({
        user_id: myUserId, movie_id: movie.id, status: s,
        watched_at: s === "watched" ? new Date().toISOString().split("T")[0] : null,
      }, { onConflict: "user_id,movie_id" });
      setPersonalStatus(s);
    }
    setSaving(false);
    onUpdated();
  }

  async function scheduleWatchParty() {
    setScheduling(true);
    const start_at = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();
    await createClient().from("events").insert({
      title: `Movie Night: ${movie.title}`, type: "movie_night", start_at,
      description: `Watching ${movie.title} together`, created_by: myUserId,
    });
    setScheduling(false);
    setShowScheduler(false);
    onUpdated();
    window.location.href = "/calendar";
  }

  async function deleteMovie() {
    setDeleting(true);
    await createClient().from("movies").delete().eq("id", movie.id);
    setDeleting(false);
    onDelete?.(); onClose();
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.75)" }} onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.18 }}
          className="relative w-full max-w-2xl rounded-2xl border z-10 flex flex-col max-h-[90vh]"
          style={{ backgroundColor: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}
        >
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 z-10" style={{ color: "var(--color-text-muted)" }}><X size={18} /></button>

          <div className="overflow-y-auto flex-1">
            {/* Hero */}
            <div className="flex gap-5 p-6 pb-4">
              {movie.poster_url
                ? <img src={movie.poster_url} alt={movie.title} className="w-24 rounded-xl flex-shrink-0 shadow-lg object-cover" style={{ height: "144px" }} />
                : <div className="w-24 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg" style={{ backgroundColor: "var(--color-surface)", height: "144px" }}><Film size={28} style={{ color: "var(--color-text-muted)" }} /></div>}
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-xl font-bold leading-tight" style={{ color: "var(--color-text-primary)" }}>{movie.title}</h2>
                <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {[movie.release_year, movie.genres.slice(0, 3).join(", ")].filter(Boolean).join(" · ")}
                </p>
                {movie.director && <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Dir. {movie.director}</p>}
                {movie.runtime_minutes && (
                  <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                    <Clock size={10} /> {movie.runtime_minutes} min
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: GROUP_MOVIE_STATUS_META[groupStatus].bg, color: GROUP_MOVIE_STATUS_META[groupStatus].color }}>
                    {GROUP_MOVIE_STATUS_META[groupStatus].label}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  <span className="flex items-center gap-1"><Users size={11} /> {watchedCount}/{totalMembers} watched</span>
                  {wantCount > 0 && <span className="flex items-center gap-1" style={{ color: "var(--color-gold)" }}><Star size={11} /> {wantCount} want it</span>}
                </div>
              </div>
            </div>

            {movie.overview && (
              <div className="px-6 pb-4">
                <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "var(--color-text-secondary)" }}>{movie.overview}</p>
              </div>
            )}

            <div className="px-6 space-y-5 pb-6">
              {/* Group status */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>Group Status</p>
                <div className="flex flex-wrap gap-2">
                  {GROUP_OPTIONS.map(s => {
                    const meta = GROUP_MOVIE_STATUS_META[s]; const active = groupStatus === s;
                    return (
                      <button key={s} onClick={() => updateGroupStatus(s)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
                        style={{ backgroundColor: active ? meta.bg : "transparent", borderColor: active ? meta.color : "var(--color-border)", color: active ? meta.color : "var(--color-text-muted)" }}>
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Personal status */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>My Status</p>
                <div className="flex flex-wrap gap-2">
                  {PERSONAL_OPTIONS.map(s => {
                    const meta = PERSONAL_MOVIE_STATUS_META[s]; const active = personalStatus === s;
                    return (
                      <button key={s} onClick={() => updatePersonalStatus(active ? null : s)} disabled={saving}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border flex items-center gap-1.5 disabled:opacity-60"
                        style={{ backgroundColor: active ? "rgba(6,182,212,0.12)" : "transparent", borderColor: active ? "var(--color-cyan)" : "var(--color-border)", color: active ? "var(--color-cyan-light)" : "var(--color-text-muted)" }}>
                        <span>{meta.icon}</span> {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Member breakdown */}
              {(membersWatched.length > 0 || membersWatching.length > 0 || membersWant.length > 0) && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>The Others</p>
                  <div className="space-y-2">
                    {membersWatched.length > 0 && <MemberRow label="Watched" icon="✅" members={membersWatched} color="var(--color-green)" />}
                    {membersWatching.length > 0 && <MemberRow label="Watching" icon="👀" members={membersWatching} color="var(--color-cyan)" />}
                    {membersWant.length > 0 && <MemberRow label="Want to watch" icon="⭐" members={membersWant} color="var(--color-gold)" />}
                  </div>
                </div>
              )}

              {/* Watch party scheduler */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
                <button onClick={() => setShowScheduler(v => !v)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--color-cyan)" }}>
                    <CalendarPlus size={16} /> Schedule Watch Party
                  </div>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{showScheduler ? "▲" : "▼"}</span>
                </button>
                <AnimatePresence>
                  {showScheduler && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                        <p className="text-xs pt-3" style={{ color: "var(--color-text-muted)" }}>Creates a Movie Night event on the calendar.</p>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="block text-xs mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Date</label>
                            <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
                          </div>
                          <div className="w-32">
                            <label className="block text-xs mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Time</label>
                            <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
                          </div>
                        </div>
                        <button onClick={scheduleWatchParty} disabled={scheduling}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                          style={{ backgroundColor: "rgba(6,182,212,0.15)", color: "var(--color-cyan)", border: "1px solid rgba(6,182,212,0.3)" }}>
                          {scheduling ? <Loader2 size={14} className="animate-spin" /> : <CalendarPlus size={14} />}
                          Add to Calendar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {isAdmin && (
                <button onClick={deleteMovie} disabled={deleting} className="flex items-center gap-2 text-xs disabled:opacity-50" style={{ color: "var(--color-text-muted)" }}>
                  {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Remove from library
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function MemberRow({ label, icon, members, color }: { label: string; icon: string; members: MemberStatus[]; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-28 flex-shrink-0 flex items-center gap-1.5" style={{ color: color ?? "var(--color-text-secondary)" }}>
        {icon} {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {members.map(m => (
          <span key={m.profile.id} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text-secondary)" }}>
            {m.profile.display_name}
          </span>
        ))}
      </div>
    </div>
  );
}
