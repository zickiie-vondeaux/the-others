"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { type Game, type GameReview, type Profile } from "@/lib/supabase/types";
import { X, Gamepad2, Users, CalendarPlus, Trash2, Loader2 } from "lucide-react";
import { HalfStar, StarRow } from "./StarDisplay";

export interface GameReviewWithProfile {
  review: GameReview;
  profile: Pick<Profile, "id" | "display_name" | "avatar_url" | "username">;
}

interface Props {
  game: Game;
  myUserId: string;
  myReview: GameReview | null;
  memberReviews: GameReviewWithProfile[];
  totalMembers: number;
  isAdmin: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onDelete?: () => void;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  const halfValueAt = (e: React.MouseEvent<HTMLButtonElement>, s: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return e.clientX < rect.left + rect.width / 2 ? s - 0.5 : s;
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => {
        const isFull = active >= s;
        const isHalf = !isFull && active >= s - 0.5;
        return (
          <button key={s}
            onMouseMove={e => setHover(halfValueAt(e, s))}
            onMouseLeave={() => setHover(0)}
            onClick={e => { const v = halfValueAt(e, s); onChange(value === v ? 0 : v); }}
            className="transition-transform hover:scale-110"
            aria-label={`Rate ${s - 0.5}–${s} stars`}>
            <HalfStar size={30} isFull={isFull} isHalf={isHalf}
              color="var(--color-gold)" emptyColor="var(--color-border)" />
          </button>
        );
      })}
    </div>
  );
}

const RATING_LABELS = ["", "Terrible", "Bad", "Okay", "Good", "Amazing"];

export function GameDetailModal({
  game, myUserId, myReview, memberReviews, totalMembers, isAdmin,
  onClose, onUpdated, onDelete,
}: Props) {
  const [rating, setRating] = useState<number>(myReview?.rating ?? 0);
  const [reviewText, setReviewText] = useState(myReview?.review_text ?? "");
  const [isMultiplayer, setIsMultiplayer] = useState(game.is_multiplayer);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [scheduleTime, setScheduleTime] = useState("20:00");

  const isDirty = rating !== (myReview?.rating ?? 0) || reviewText !== (myReview?.review_text ?? "");

  async function saveReview() {
    if (rating === 0) return;
    setSaving(true);
    await createClient().from("game_reviews").upsert({
      user_id: myUserId, game_id: game.id,
      rating, review_text: reviewText.trim() || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,game_id" });
    setSaving(false);
    onUpdated();
  }

  async function removeReview() {
    setSaving(true);
    await createClient().from("game_reviews").delete().eq("user_id", myUserId).eq("game_id", game.id);
    setRating(0); setReviewText("");
    setSaving(false);
    onUpdated();
  }

  async function scheduleSession() {
    setScheduling(true);
    const start_at = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();
    await createClient().from("events").insert({
      title: `Game Night: ${game.title}`, type: "game_night", start_at,
      description: `Playing ${game.title} together`, created_by: myUserId,
    });
    setScheduling(false); setShowScheduler(false);
    window.location.href = "/calendar";
  }

  async function toggleMultiplayer() {
    const next = !isMultiplayer;
    setIsMultiplayer(next);
    await createClient().from("games").update({ is_multiplayer: next }).eq("id", game.id);
    onUpdated();
  }

  async function deleteGame() {
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("game_reviews").delete().eq("game_id", game.id);
    await supabase.from("games").delete().eq("id", game.id);
    setDeleting(false);
    onDelete?.(); onClose();
  }

  const avgRating = memberReviews.length > 0
    ? memberReviews.reduce((s, r) => s + r.review.rating, 0) / memberReviews.length
    : null;

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
          <button onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 transition-colors z-10"
            style={{ color: "var(--color-text-muted)" }}>
            <X size={18} />
          </button>

          <div className="overflow-y-auto flex-1">
            {/* Hero */}
            <div className="flex gap-5 p-6 pb-4">
              {game.cover_url
                ? <img src={game.cover_url} alt={game.title} loading="lazy" className="w-24 h-32 object-cover rounded-xl flex-shrink-0 shadow-lg" />
                : <div className="w-24 h-32 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg" style={{ backgroundColor: "var(--color-surface)" }}>
                    <Gamepad2 size={28} style={{ color: "var(--color-text-muted)" }} />
                  </div>
              }
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-xl font-bold leading-tight" style={{ color: "var(--color-text-primary)" }}>{game.title}</h2>
                <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {[game.release_year, game.genres.slice(0, 3).join(", ")].filter(Boolean).join(" · ")}
                </p>
                {game.platforms.length > 0 && (
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{game.platforms.slice(0, 5).join(", ")}</p>
                )}
                {isMultiplayer && (
                  <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: "rgba(6,182,212,0.15)", color: "var(--color-cyan)" }}>
                    Multiplayer
                  </span>
                )}
                <div className="flex items-center gap-2 mt-3">
                  {avgRating !== null ? (
                    <>
                      <StarRow value={avgRating} size={13} />
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {avgRating.toFixed(1)} · {memberReviews.length}/{totalMembers} rated
                      </span>
                    </>
                  ) : (
                    <span className="text-xs flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                      <Users size={11} /> {memberReviews.length}/{totalMembers} rated
                    </span>
                  )}
                </div>
              </div>
            </div>

            {game.summary && (
              <div className="px-6 pb-4">
                <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "var(--color-text-secondary)" }}>{game.summary}</p>
              </div>
            )}

            <div className="px-6 space-y-5 pb-6">
              {/* My Rating */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-muted)" }}>My Rating</p>
                <StarPicker value={rating} onChange={setRating} />
                {rating > 0 && (
                  <p className="text-xs mt-1.5" style={{ color: "var(--color-gold)" }}>{RATING_LABELS[Math.round(rating)]}</p>
                )}

                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder={rating > 0 ? "Add a review (optional)..." : "Rate first, then write a review..."}
                  disabled={rating === 0}
                  rows={2}
                  maxLength={500}
                  className="w-full mt-3 px-3 py-2.5 rounded-xl border text-sm outline-none resize-none transition-colors focus:border-purple-500/60 disabled:opacity-40"
                  style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                />

                <div className="flex items-center gap-2 mt-2">
                  {isDirty && rating > 0 && (
                    <button onClick={saveReview} disabled={saving}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      style={{ backgroundColor: "var(--color-purple)", color: "#fff" }}>
                      {saving && <Loader2 size={12} className="animate-spin" />}
                      {myReview ? "Update" : "Save"} Review
                    </button>
                  )}
                  {myReview && (
                    <button onClick={removeReview} disabled={saving}
                      className="px-3 py-1.5 rounded-lg text-xs transition-colors"
                      style={{ color: "var(--color-text-muted)" }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Member reviews */}
              {memberReviews.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-muted)" }}>The Others</p>
                  <div className="space-y-3">
                    {memberReviews.map(({ review, profile }) => (
                      <div key={review.id} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center"
                          style={{ backgroundColor: "rgba(124,58,237,0.2)" }}>
                          {profile.avatar_url
                            ? <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                            : <span className="text-xs font-bold" style={{ color: "var(--color-purple-light)" }}>{profile.display_name[0]}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>{profile.display_name}</span>
                            <StarRow value={review.rating} size={10} />
                          </div>
                          {review.review_text && (
                            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{review.review_text}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Session scheduler */}
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
                <button onClick={() => setShowScheduler(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--color-cyan)" }}>
                    <CalendarPlus size={16} /> Schedule a Session
                  </div>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{showScheduler ? "▲" : "▼"}</span>
                </button>
                <AnimatePresence>
                  {showScheduler && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                        <p className="text-xs pt-3" style={{ color: "var(--color-text-muted)" }}>Creates a Game Night event on the calendar for {game.title}.</p>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="block text-xs mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Date</label>
                            <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)", colorScheme: "dark" }} />
                          </div>
                          <div className="w-32">
                            <label className="block text-xs mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Time</label>
                            <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)", colorScheme: "dark" }} />
                          </div>
                        </div>
                        <button onClick={scheduleSession} disabled={scheduling}
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

              {/* Admin controls */}
              {isAdmin && (
                <div className="flex items-center gap-4">
                  <button onClick={toggleMultiplayer}
                    className="flex items-center gap-2 text-xs transition-colors"
                    style={{ color: isMultiplayer ? "var(--color-cyan)" : "var(--color-text-muted)" }}>
                    <span>👾</span> {isMultiplayer ? "Multiplayer (on)" : "Mark as multiplayer"}
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
