"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  GROUP_STATUS_META, PERSONAL_STATUS_META,
  type Game, type GroupGameStatus, type PersonalGameStatus, type Profile,
} from "@/lib/supabase/types";
import { X, Gamepad2, Users, Star, CalendarPlus, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface MemberStatus {
  profile: Pick<Profile, "id" | "display_name" | "avatar_url" | "username">;
  status: PersonalGameStatus;
}

interface Props {
  game: Game;
  myUserId: string;
  myStatus: PersonalGameStatus | null;
  memberStatuses: MemberStatus[];
  totalMembers: number;
  isAdmin: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onDelete?: () => void;
}

const GROUP_STATUS_OPTIONS: GroupGameStatus[] = ["queue", "playing", "completed", "dropped"];
const PERSONAL_STATUS_OPTIONS: PersonalGameStatus[] = ["playing_solo", "playing_multiplayer", "completed", "want_to_play", "not_interested"];

export function GameDetailModal({
  game, myUserId, myStatus, memberStatuses, totalMembers, isAdmin,
  onClose, onUpdated, onDelete,
}: Props) {
  const [groupStatus, setGroupStatus] = useState<GroupGameStatus>(game.group_status);
  const [personalStatus, setPersonalStatus] = useState<PersonalGameStatus | null>(myStatus);
  const [isMultiplayer, setIsMultiplayer] = useState(game.is_multiplayer);
  const [saving, setSaving] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [scheduleTime, setScheduleTime] = useState("20:00");
  const [showScheduler, setShowScheduler] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const wantCount = memberStatuses.filter(m => m.status === "want_to_play").length;
  const playedCount = memberStatuses.filter(m => m.status === "completed" || m.status === "playing_solo" || m.status === "playing_multiplayer").length;

  async function updateGroupStatus(s: GroupGameStatus) {
    if (s === groupStatus) return;
    setGroupStatus(s);
    const supabase = createClient();
    await supabase.from("games").update({ group_status: s }).eq("id", game.id);
    onUpdated();
  }

  async function updatePersonalStatus(s: PersonalGameStatus | null) {
    setSaving(true);
    const supabase = createClient();

    if (s === null || s === personalStatus) {
      // Toggle off
      await supabase.from("user_game_status").delete().eq("user_id", myUserId).eq("game_id", game.id);
      setPersonalStatus(null);
    } else {
      await supabase.from("user_game_status").upsert({
        user_id: myUserId,
        game_id: game.id,
        status: s,
      }, { onConflict: "user_id,game_id" });
      setPersonalStatus(s);
    }
    setSaving(false);
    onUpdated();
  }

  async function scheduleSession() {
    setScheduling(true);
    const supabase = createClient();
    const start_at = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();

    await supabase.from("events").insert({
      title: `Game Night: ${game.title}`,
      type: "game_night",
      start_at,
      description: `Playing ${game.title} together`,
      created_by: myUserId,
    });

    setScheduling(false);
    setShowScheduler(false);
    onUpdated();
    // Navigate to calendar
    window.location.href = "/calendar";
  }

  async function toggleMultiplayer() {
    const next = !isMultiplayer;
    setIsMultiplayer(next);
    const supabase = createClient();
    await supabase.from("games").update({ is_multiplayer: next }).eq("id", game.id);
    onUpdated();
  }

  async function deleteGame() {
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("user_game_status").delete().eq("game_id", game.id);
    await supabase.from("games").delete().eq("id", game.id);
    setDeleting(false);
    onDelete?.();
    onClose();
  }

  const membersWanting = memberStatuses.filter(m => m.status === "want_to_play");
  const membersPlayingSolo = memberStatuses.filter(m => m.status === "playing_solo");
  const membersPlayingMulti = memberStatuses.filter(m => m.status === "playing_multiplayer");
  const membersCompleted = memberStatuses.filter(m => m.status === "completed");

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-2xl rounded-2xl border z-10 flex flex-col max-h-[90vh]"
          style={{ backgroundColor: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}
        >
          {/* Close */}
          <button onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 transition-colors z-10"
            style={{ color: "var(--color-text-muted)" }}>
            <X size={18} />
          </button>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1">
            {/* Hero */}
            <div className="flex gap-5 p-6 pb-4">
              {game.cover_url
                ? <img src={game.cover_url} alt={game.title} loading="lazy"
                    className="w-24 h-32 object-cover rounded-xl flex-shrink-0 shadow-lg" />
                : <div className="w-24 h-32 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: "var(--color-surface)" }}>
                    <Gamepad2 size={28} style={{ color: "var(--color-text-muted)" }} />
                  </div>
              }
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-xl font-bold leading-tight" style={{ color: "var(--color-text-primary)" }}>{game.title}</h2>
                <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {[game.release_year, game.genres.slice(0, 3).join(", ")].filter(Boolean).join(" · ")}
                </p>
                {game.platforms.length > 0 && (
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                    {game.platforms.slice(0, 5).join(", ")}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {isMultiplayer && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: "rgba(6,182,212,0.15)", color: "var(--color-cyan)" }}>
                      Multiplayer
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: GROUP_STATUS_META[groupStatus].bg,
                      color: GROUP_STATUS_META[groupStatus].color,
                    }}>
                    {GROUP_STATUS_META[groupStatus].label}
                  </span>
                </div>

                {/* Group progress */}
                <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  <span className="flex items-center gap-1"><Users size={11} /> {playedCount}/{totalMembers} played</span>
                  {wantCount > 0 && <span className="flex items-center gap-1" style={{ color: "var(--color-gold)" }}><Star size={11} /> {wantCount} want it</span>}
                </div>
              </div>
            </div>

            {/* Summary */}
            {game.summary && (
              <div className="px-6 pb-4">
                <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "var(--color-text-secondary)" }}>{game.summary}</p>
              </div>
            )}

            <div className="px-6 space-y-5 pb-6">
              {/* Group status */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>Group Status</p>
                <div className="flex flex-wrap gap-2">
                  {GROUP_STATUS_OPTIONS.map(s => {
                    const meta = GROUP_STATUS_META[s];
                    const active = groupStatus === s;
                    return (
                      <button key={s} onClick={() => updateGroupStatus(s)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
                        style={{
                          backgroundColor: active ? meta.bg : "transparent",
                          borderColor: active ? meta.color : "var(--color-border)",
                          color: active ? meta.color : "var(--color-text-muted)",
                        }}>
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
                  {PERSONAL_STATUS_OPTIONS
                    .filter(s => s !== "not_interested" && (s !== "playing_multiplayer" || isMultiplayer))
                    .map(s => {
                      const meta = PERSONAL_STATUS_META[s];
                      const active = personalStatus === s;
                      return (
                        <button key={s} onClick={() => updatePersonalStatus(active ? null : s)} disabled={saving}
                          className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border flex items-center gap-1.5 disabled:opacity-60")}
                          style={{
                            backgroundColor: active ? "rgba(124,58,237,0.15)" : "transparent",
                            borderColor: active ? "var(--color-purple)" : "var(--color-border)",
                            color: active ? "var(--color-purple-light)" : "var(--color-text-muted)",
                          }}>
                          <span>{meta.icon}</span> {meta.label}
                        </button>
                      );
                    })}
                  <button onClick={() => updatePersonalStatus(personalStatus === "not_interested" ? null : "not_interested")}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border flex items-center gap-1.5 disabled:opacity-60"
                    style={{
                      backgroundColor: personalStatus === "not_interested" ? "rgba(71,85,105,0.2)" : "transparent",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-muted)",
                    }}>
                    👻 Not interested
                  </button>
                </div>
              </div>

              {/* Member breakdown */}
              {(membersPlayingSolo.length > 0 || membersPlayingMulti.length > 0 || membersCompleted.length > 0 || membersWanting.length > 0) && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>The Others</p>
                  <div className="space-y-2">
                    {membersCompleted.length > 0 && (
                      <MemberRow label="Completed" icon="✅" members={membersCompleted} />
                    )}
                    {membersPlayingMulti.length > 0 && (
                      <MemberRow label="Playing multiplayer" icon="👾" members={membersPlayingMulti} color="var(--color-cyan)" />
                    )}
                    {membersPlayingSolo.length > 0 && (
                      <MemberRow label="Playing solo" icon="🎮" members={membersPlayingSolo} />
                    )}
                    {membersWanting.length > 0 && (
                      <MemberRow label="Want to play" icon="⭐" members={membersWanting} color="var(--color-gold)" />
                    )}
                  </div>
                </div>
              )}

              {/* Session scheduler */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
                <button
                  onClick={() => setShowScheduler(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--color-cyan)" }}>
                    <CalendarPlus size={16} />
                    Schedule a Session
                  </div>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {showScheduler ? "▲" : "▼"}
                  </span>
                </button>

                <AnimatePresence>
                  {showScheduler && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                        <p className="text-xs pt-3" style={{ color: "var(--color-text-muted)" }}>
                          Creates a Game Night event on the calendar for {game.title}.
                        </p>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="block text-xs mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Date</label>
                            <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
                          </div>
                          <div className="w-32">
                            <label className="block text-xs mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Time</label>
                            <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
                          </div>
                        </div>
                        <button onClick={scheduleSession} disabled={scheduling}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                          style={{ backgroundColor: "rgba(6,182,212,0.15)", color: "var(--color-cyan)", border: "1px solid rgba(6,182,212,0.3)" }}>
                          {scheduling ? <Loader2 size={14} className="animate-spin" /> : <CalendarPlus size={14} />}
                          Add to Calendar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Admin controls */}
              {isAdmin && (
                <div className="flex items-center gap-4">
                  <button onClick={toggleMultiplayer}
                    className="flex items-center gap-2 text-xs transition-colors"
                    style={{ color: isMultiplayer ? "var(--color-cyan)" : "var(--color-text-muted)" }}>
                    <span>👾</span>
                    {isMultiplayer ? "Multiplayer (on)" : "Mark as multiplayer"}
                  </button>
                  <button onClick={deleteGame} disabled={deleting}
                    className="flex items-center gap-2 text-xs transition-colors disabled:opacity-50"
                    style={{ color: "var(--color-text-muted)" }}>
                    {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Remove from library
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function MemberRow({
  label, icon, members, color,
}: {
  label: string;
  icon: string;
  members: MemberStatus[];
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-28 flex-shrink-0 flex items-center gap-1.5"
        style={{ color: color ?? "var(--color-text-secondary)" }}>
        {icon} {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {members.map(m => (
          <span key={m.profile.id}
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text-secondary)" }}>
            {m.profile.display_name}
          </span>
        ))}
      </div>
    </div>
  );
}
