"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Poll, PollOption, PollVote, Movie } from "@/lib/supabase/types";
import { X, Vote, Film, Check, Trophy, Loader2, Plus, Clock } from "lucide-react";
import { logActivity } from "@/lib/activity";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils/cn";

// ── IRV calculation ────────────────────────────────────────────

function runIRV(votes: PollVote[], optionIds: string[]): string | null {
  if (votes.length === 0 || optionIds.length === 0) return null;

  let remaining = [...optionIds];

  const ballots: string[][] = votes.map(v =>
    [...v.rankings].sort((a, b) => a.rank - b.rank).map(r => r.option_id)
  );

  while (remaining.length > 1) {
    const counts: Record<string, number> = {};
    remaining.forEach(id => (counts[id] = 0));

    for (const ballot of ballots) {
      const top = ballot.find(id => remaining.includes(id));
      if (top) counts[top]++;
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total === 0) break;

    // Check majority
    for (const [id, count] of Object.entries(counts)) {
      if (count / total > 0.5) return id;
    }

    // Eliminate last place (lowest count)
    const minCount = Math.min(...Object.values(counts));
    remaining = remaining.filter(id => counts[id] > minCount);

    // If all tied, pick first alphabetically (tiebreak)
    if (remaining.length === optionIds.length) {
      remaining = remaining.slice(0, remaining.length - 1);
    }
  }

  return remaining[0] ?? null;
}

// ── Types ──────────────────────────────────────────────────────

interface PollWithData extends Poll {
  options: (PollOption & { movie: Movie | null })[];
  votes: PollVote[];
}

interface Props {
  poll: PollWithData;
  myUserId: string;
  queueMovies: Movie[];  // for creating poll options
  onClose: () => void;
  onUpdated: () => void;
}

// ── Create Poll Modal ──────────────────────────────────────────

interface CreatePollProps {
  myUserId: string;
  queueMovies: Movie[];
  onClose: () => void;
  onCreated: () => void;
}

export function CreatePollModal({ myUserId, queueMovies, onClose, onCreated }: CreatePollProps) {
  const [title, setTitle] = useState("Movie Night Poll");
  const [closesIn, setClosesIn] = useState("24");
  const [selectedMovieIds, setSelectedMovieIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleMovie(id: string) {
    setSelectedMovieIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function create() {
    if (selectedMovieIds.length < 2) { setError("Select at least 2 movies."); return; }
    if (!title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    const supabase = createClient();
    const closes_at = new Date(Date.now() + parseInt(closesIn) * 3600 * 1000).toISOString();

    const { data: poll, error: err } = await supabase
      .from("polls").insert({ title: title.trim(), created_by: myUserId, closes_at, hide_until_closed: false })
      .select().single();

    if (err || !poll) { setError(err?.message ?? "Failed to create poll"); setSaving(false); return; }

    const options = selectedMovieIds.map((movie_id, i) => ({ poll_id: poll.id, movie_id, position: i }));
    await supabase.from("poll_options").insert(options);
    logActivity({ type: "poll_created", entityType: "poll", entityId: poll.id, entityTitle: title.trim() });
    setSaving(false);
    onCreated();
    onClose();
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.75)" }} onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.18 }}
          className="relative w-full max-w-md rounded-2xl border z-10 flex flex-col max-h-[90vh]"
          style={{ backgroundColor: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Vote size={20} style={{ color: "var(--color-cyan)" }} />
              <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Create Poll</h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5" style={{ color: "var(--color-text-muted)" }}><X size={18} /></button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-2">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Poll Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:border-cyan-500"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Closes in</label>
              <select value={closesIn} onChange={e => setClosesIn(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>
                <option value="6">6 hours</option>
                <option value="12">12 hours</option>
                <option value="24">24 hours</option>
                <option value="48">48 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
                Movies ({selectedMovieIds.length} selected)
              </label>
              {queueMovies.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>No movies in the Watch Queue. Add some first.</p>
              ) : (
                <div className="space-y-2">
                  {queueMovies.map(m => {
                    const selected = selectedMovieIds.includes(m.id);
                    return (
                      <button key={m.id} onClick={() => toggleMovie(m.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left"
                        style={{ backgroundColor: selected ? "rgba(6,182,212,0.08)" : "var(--color-surface)", borderColor: selected ? "var(--color-cyan)" : "var(--color-border)" }}>
                        {m.poster_url
                          ? <img src={m.poster_url} alt={m.title} className="w-8 h-12 object-cover rounded flex-shrink-0" />
                          : <div className="w-8 h-12 rounded flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: "var(--color-surface-elevated)" }}><Film size={12} style={{ color: "var(--color-text-muted)" }} /></div>}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{m.title}</p>
                          {m.release_year && <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{m.release_year}</p>}
                        </div>
                        {selected && <Check size={16} style={{ color: "var(--color-cyan)", flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 pt-4 pb-6 flex-shrink-0 border-t space-y-3" style={{ borderColor: "var(--color-border)" }}>
            {error && <p className="text-xs" style={{ color: "var(--color-red)" }}>{error}</p>}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium hover:bg-white/5"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>Cancel</button>
              <button onClick={create} disabled={saving || selectedMovieIds.length < 2}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--color-cyan)", color: "#000" }}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Start Poll
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ── Vote / Results Modal ───────────────────────────────────────

export function PollDetailModal({ poll, myUserId, onClose, onUpdated }: Props) {
  const myVote = poll.votes.find(v => v.user_id === myUserId);
  const [ranking, setRanking] = useState<string[]>(
    myVote ? [...myVote.rankings].sort((a, b) => a.rank - b.rank).map(r => r.option_id) : []
  );
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);

  const optionIds = poll.options.map(o => o.id);
  const winner = poll.is_closed ? runIRV(poll.votes, optionIds) : null;
  const winnerOption = poll.options.find(o => o.id === winner);
  const isPast = poll.closes_at ? new Date(poll.closes_at) < new Date() : false;
  const showResults = poll.is_closed || (!poll.hide_until_closed);

  // First-choice vote counts for display
  const firstChoiceCounts: Record<string, number> = {};
  optionIds.forEach(id => (firstChoiceCounts[id] = 0));
  poll.votes.forEach(v => {
    const top = [...v.rankings].sort((a, b) => a.rank - b.rank)[0];
    if (top && firstChoiceCounts[top.option_id] !== undefined) firstChoiceCounts[top.option_id]++;
  });
  const maxCount = Math.max(...Object.values(firstChoiceCounts), 1);

  function toggleRank(optionId: string) {
    if (poll.is_closed) return;
    setRanking(prev => {
      if (prev.includes(optionId)) return prev.filter(id => id !== optionId);
      return [...prev, optionId];
    });
  }

  async function submitVote() {
    if (ranking.length === 0) return;
    setSaving(true);
    const rankings = ranking.map((option_id, i) => ({ option_id, rank: i + 1 }));
    await createClient().from("poll_votes").upsert(
      { poll_id: poll.id, user_id: myUserId, rankings },
      { onConflict: "poll_id,user_id" }
    );
    setSaving(false);
    onUpdated();
  }

  async function closePoll() {
    setClosing(true);
    const finalWinner = runIRV(poll.votes, optionIds);
    const winnerOpt = finalWinner ? poll.options.find(o => o.id === finalWinner) : null;
    await createClient().from("polls").update({
      is_closed: true,
      winning_movie_id: winnerOpt?.movie_id ?? null,
    }).eq("id", poll.id);
    const winnerTitle = winnerOpt?.movie?.title ?? "Unknown";
    logActivity({ type: "poll_closed", entityType: "poll", entityId: poll.id, entityTitle: poll.title, metadata: { winner: winnerTitle } });
    setClosing(false);
    onUpdated();
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.75)" }} onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.18 }}
          className="relative w-full max-w-lg rounded-2xl border z-10 flex flex-col max-h-[90vh]"
          style={{ backgroundColor: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}
        >
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 z-10" style={{ color: "var(--color-text-muted)" }}><X size={18} /></button>

          <div className="overflow-y-auto flex-1 p-6 space-y-5">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Vote size={18} style={{ color: "var(--color-cyan)" }} />
                <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{poll.title}</h2>
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                <span>{poll.votes.length} vote{poll.votes.length !== 1 ? "s" : ""}</span>
                {poll.closes_at && !poll.is_closed && (
                  <span className={cn("flex items-center gap-1", isPast ? "" : "")} style={{ color: isPast ? "var(--color-amber)" : "var(--color-text-muted)" }}>
                    <Clock size={10} />
                    {isPast ? "Closed" : `Closes ${formatDistanceToNow(new Date(poll.closes_at), { addSuffix: true })}`}
                  </span>
                )}
                {poll.is_closed && <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: "rgba(16,185,129,0.15)", color: "var(--color-green)" }}>Closed</span>}
              </div>
            </div>

            {/* Winner banner */}
            {poll.is_closed && winnerOption?.movie && (
              <div className="flex items-center gap-4 p-4 rounded-xl border" style={{ borderColor: "var(--color-gold)", backgroundColor: "rgba(251,191,36,0.06)" }}>
                <Trophy size={24} style={{ color: "var(--color-gold)", flexShrink: 0 }} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--color-gold)" }}>Winner</p>
                  <p className="font-bold" style={{ color: "var(--color-text-primary)" }}>{winnerOption.movie.title}</p>
                </div>
                {winnerOption.movie.poster_url && (
                  <img src={winnerOption.movie.poster_url} alt={winnerOption.movie.title} className="w-10 h-14 object-cover rounded ml-auto flex-shrink-0" />
                )}
              </div>
            )}

            {/* Voting / results */}
            {!poll.is_closed ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
                  {myVote ? "Update your ranking" : "Rank your picks"} — click in order of preference
                </p>
                <div className="space-y-2">
                  {poll.options.map(opt => {
                    const idx = ranking.indexOf(opt.id);
                    const ranked = idx !== -1;
                    const movie = opt.movie;
                    return (
                      <button key={opt.id} onClick={() => toggleRank(opt.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left"
                        style={{ backgroundColor: ranked ? "rgba(6,182,212,0.08)" : "var(--color-surface)", borderColor: ranked ? "var(--color-cyan)" : "var(--color-border)" }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                          style={{ backgroundColor: ranked ? "var(--color-cyan)" : "var(--color-surface-elevated)", color: ranked ? "#000" : "var(--color-text-muted)" }}>
                          {ranked ? idx + 1 : "·"}
                        </div>
                        {movie?.poster_url
                          ? <img src={movie.poster_url} alt={movie.title} className="w-8 h-12 object-cover rounded flex-shrink-0" />
                          : <div className="w-8 h-12 rounded flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: "var(--color-surface-elevated)" }}><Film size={12} style={{ color: "var(--color-text-muted)" }} /></div>}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{movie?.title ?? "Unknown"}</p>
                          {movie?.release_year && <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{movie.release_year}</p>}
                        </div>
                        {showResults && (
                          <div className="flex-shrink-0 text-right">
                            <p className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>{firstChoiceCounts[opt.id] ?? 0}</p>
                            <div className="w-16 h-1.5 rounded-full mt-1 overflow-hidden" style={{ backgroundColor: "var(--color-border)" }}>
                              <div className="h-full rounded-full" style={{ width: `${((firstChoiceCounts[opt.id] ?? 0) / maxCount) * 100}%`, backgroundColor: "var(--color-cyan)" }} />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={submitVote} disabled={saving || ranking.length === 0}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: "var(--color-cyan)", color: "#000" }}>
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                    {myVote ? "Update Vote" : "Submit Vote"}
                  </button>
                  {(isPast || poll.votes.length >= 2) && (
                    <button onClick={closePoll} disabled={closing}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium border disabled:opacity-50"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                      {closing ? <Loader2 size={14} className="animate-spin" /> : "Close Poll"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Results view */
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>Final Results</p>
                {[...poll.options].sort((a, b) => (firstChoiceCounts[b.id] ?? 0) - (firstChoiceCounts[a.id] ?? 0)).map(opt => {
                  const movie = opt.movie;
                  const isWinner = opt.id === winner;
                  const count = firstChoiceCounts[opt.id] ?? 0;
                  return (
                    <div key={opt.id} className="flex items-center gap-3 p-3 rounded-xl border"
                      style={{ borderColor: isWinner ? "var(--color-gold)" : "var(--color-border)", backgroundColor: isWinner ? "rgba(251,191,36,0.05)" : "var(--color-surface)" }}>
                      {isWinner && <Trophy size={14} style={{ color: "var(--color-gold)", flexShrink: 0 }} />}
                      <p className="text-sm font-medium flex-1 truncate" style={{ color: "var(--color-text-primary)" }}>{movie?.title ?? "Unknown"}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-border)" }}>
                          <div className="h-full rounded-full" style={{ width: `${(count / maxCount) * 100}%`, backgroundColor: isWinner ? "var(--color-gold)" : "var(--color-cyan)" }} />
                        </div>
                        <span className="text-xs w-4 text-right" style={{ color: "var(--color-text-muted)" }}>{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
