"use client";

import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { MovieCard } from "@/components/movies/MovieCard";
import { AddMovieModal } from "@/components/movies/AddMovieModal";
import { MovieDetailModal } from "@/components/movies/MovieDetailModal";
import { CreatePollModal, PollDetailModal } from "@/components/movies/PollModal";
import { createClient } from "@/lib/supabase/client";
import {
  GROUP_MOVIE_STATUS_META,
  type Movie, type GroupMovieStatus, type PersonalMovieStatus,
  type Profile, type Poll, type PollOption, type PollVote,
} from "@/lib/supabase/types";
import { Plus, LayoutGrid, List, Filter, Film, Vote, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatDistanceToNow } from "date-fns";

type Tab = "all" | GroupMovieStatus;
type ViewMode = "grid" | "list";

interface UserMovieRow { user_id: string; movie_id: string; status: PersonalMovieStatus; }
interface MemberStatus {
  profile: Pick<Profile, "id" | "display_name" | "avatar_url" | "username">;
  status: PersonalMovieStatus;
}
interface PollWithData extends Poll {
  options: (PollOption & { movie: Movie | null })[];
  votes: PollVote[];
}

const TABS: { id: Tab; label: string }[] = [
  { id: "all",      label: "All" },
  { id: "queue",    label: "Watch Queue" },
  { id: "watching", label: "Watching" },
  { id: "watched",  label: "Watched" },
  { id: "dropped",  label: "Did Not Finish" },
];

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [allStatuses, setAllStatuses] = useState<UserMovieRow[]>([]);
  const [profiles, setProfiles] = useState<Pick<Profile, "id" | "display_name" | "avatar_url" | "username">[]>([]);
  const [polls, setPolls] = useState<PollWithData[]>([]);
  const [myUserId, setMyUserId] = useState("");
  const [myRole, setMyRole] = useState("member");
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<Tab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [genreFilter, setGenreFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<PollWithData | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const [
      { data: { user } },
      { data: moviesData },
      { data: statusData },
      { data: profilesData },
      { data: pollsData },
      { data: pollOptionsData },
      { data: pollVotesData },
    ] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("movies").select("*").order("created_at", { ascending: false }),
      supabase.from("user_movie_status").select("user_id,movie_id,status"),
      supabase.from("profiles").select("id,display_name,avatar_url,username,role"),
      supabase.from("polls").select("*").order("created_at", { ascending: false }),
      supabase.from("poll_options").select("*"),
      supabase.from("poll_votes").select("*"),
    ]);

    if (user) {
      setMyUserId(user.id);
      const me = profilesData?.find(p => p.id === user.id);
      if (me) setMyRole((me as Profile).role ?? "member");
    }

    const movieList = (moviesData ?? []) as Movie[];
    setMovies(movieList);
    setAllStatuses((statusData ?? []) as UserMovieRow[]);
    setProfiles((profilesData ?? []) as Pick<Profile, "id" | "display_name" | "avatar_url" | "username">[]);

    // Build polls with nested options + votes
    const options = (pollOptionsData ?? []) as PollOption[];
    const votes = (pollVotesData ?? []) as PollVote[];
    const builtPolls: PollWithData[] = ((pollsData ?? []) as Poll[]).map(poll => ({
      ...poll,
      options: options
        .filter(o => o.poll_id === poll.id)
        .sort((a, b) => a.position - b.position)
        .map(o => ({ ...o, movie: movieList.find(m => m.id === o.movie_id) ?? null })),
      votes: votes.filter(v => v.poll_id === poll.id),
    }));
    setPolls(builtPolls);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function myStatusForMovie(movieId: string): PersonalMovieStatus | null {
    return allStatuses.find(r => r.user_id === myUserId && r.movie_id === movieId)?.status ?? null;
  }

  function memberStatusesForMovie(movieId: string): MemberStatus[] {
    return allStatuses
      .filter(r => r.movie_id === movieId && r.status !== "not_interested")
      .map(r => ({
        profile: profiles.find(p => p.id === r.user_id) ?? { id: r.user_id, display_name: "Member", avatar_url: null, username: "" },
        status: r.status,
      }));
  }

  function watchedCount(movieId: string) { return allStatuses.filter(r => r.movie_id === movieId && r.status === "watched").length; }
  function wantCount(movieId: string) { return allStatuses.filter(r => r.movie_id === movieId && r.status === "want_to_watch").length; }

  const allGenres = Array.from(new Set(movies.flatMap(m => m.genres))).sort();
  const queueMovies = movies.filter(m => m.group_status === "queue");
  const activePolls = polls.filter(p => !p.is_closed);
  const closedPolls = polls.filter(p => p.is_closed);

  const filteredMovies = movies.filter(m => {
    if (tab !== "all" && m.group_status !== tab) return false;
    if (genreFilter !== "all" && !m.genres.includes(genreFilter)) return false;
    return true;
  });

  const tabCounts: Partial<Record<Tab, number>> = {
    all: movies.length,
    queue: movies.filter(m => m.group_status === "queue").length,
    watching: movies.filter(m => m.group_status === "watching").length,
    watched: movies.filter(m => m.group_status === "watched").length,
    dropped: movies.filter(m => m.group_status === "dropped").length,
  };

  return (
    <>
      <TopBar title="Movie Library" />
      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>Movie Library</h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>{movies.length} movie{movies.length !== 1 ? "s" : ""} in the library</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowCreatePoll(true)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors border"
                style={{ borderColor: "var(--color-cyan)", color: "var(--color-cyan)", backgroundColor: "rgba(6,182,212,0.08)" }}>
                <Vote size={15} /> New Poll
              </button>
              <button onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: "var(--color-cyan)", color: "#000" }}>
                <Plus size={16} /> Add Movie
              </button>
            </div>
          </div>

          {/* Active polls */}
          {activePolls.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>Active Polls</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activePolls.map(poll => {
                  const myVote = poll.votes.find(v => v.user_id === myUserId);
                  const isPast = poll.closes_at ? new Date(poll.closes_at) < new Date() : false;
                  return (
                    <button key={poll.id} onClick={() => setSelectedPoll(poll)}
                      className="p-4 rounded-xl border text-left transition-colors hover:bg-white/5"
                      style={{ backgroundColor: "var(--color-surface)", borderColor: myVote ? "var(--color-cyan)" : "var(--color-border)" }}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>{poll.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                            {poll.votes.length} vote{poll.votes.length !== 1 ? "s" : ""} · {poll.options.length} movies
                          </p>
                        </div>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full flex-shrink-0")}
                          style={{ backgroundColor: myVote ? "rgba(6,182,212,0.15)" : "rgba(124,58,237,0.15)", color: myVote ? "var(--color-cyan)" : "var(--color-purple-light)" }}>
                          {myVote ? "Voted" : "Vote now!"}
                        </span>
                      </div>
                      {poll.closes_at && (
                        <p className="text-xs mt-2 flex items-center gap-1" style={{ color: isPast ? "var(--color-amber)" : "var(--color-text-muted)" }}>
                          <Clock size={10} />
                          {isPast ? "Ready to close" : `Closes ${formatDistanceToNow(new Date(poll.closes_at), { addSuffix: true })}`}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {TABS.map(t => {
              const count = tabCounts[t.id] ?? 0;
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0"
                  style={active ? { backgroundColor: "var(--color-cyan)", color: "#000" } : { color: "var(--color-text-secondary)" }}>
                  {t.label}
                  {count > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-mono"
                      style={{ backgroundColor: active ? "rgba(0,0,0,0.2)" : "var(--color-surface-elevated)", color: active ? "#000" : "var(--color-text-muted)" }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button onClick={() => setShowFilters(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors"
              style={{ borderColor: showFilters ? "var(--color-cyan)" : "var(--color-border)", color: showFilters ? "var(--color-cyan)" : "var(--color-text-secondary)", backgroundColor: showFilters ? "rgba(6,182,212,0.08)" : "transparent" }}>
              <Filter size={13} /> Filters
            </button>
            <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
              {(["grid", "list"] as ViewMode[]).map(v => (
                <button key={v} onClick={() => setViewMode(v)} className="px-3 py-1.5 transition-colors"
                  style={{ backgroundColor: viewMode === v ? "var(--color-surface-elevated)" : "transparent", color: viewMode === v ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                  {v === "grid" ? <LayoutGrid size={14} /> : <List size={14} />}
                </button>
              ))}
            </div>
            <span className="ml-auto text-xs" style={{ color: "var(--color-text-muted)" }}>{filteredMovies.length} result{filteredMovies.length !== 1 ? "s" : ""}</span>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-3 p-4 rounded-xl border" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>Genre</label>
                <select value={genreFilter} onChange={e => setGenreFilter(e.target.value)}
                  className="px-2 py-1 rounded-lg border text-xs outline-none"
                  style={{ backgroundColor: "var(--color-surface-elevated)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>
                  <option value="all">All genres</option>
                  {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              {genreFilter !== "all" && (
                <button onClick={() => setGenreFilter("all")} className="text-xs" style={{ color: "var(--color-text-muted)" }}>Clear</button>
              )}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-cyan)" }} />
            </div>
          ) : filteredMovies.length === 0 ? (
            <EmptyState tab={tab} onAdd={() => setShowAddModal(true)} />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredMovies.map(movie => (
                <MovieCard key={movie.id} movie={movie} myStatus={myStatusForMovie(movie.id)}
                  watchedCount={watchedCount(movie.id)} wantCount={wantCount(movie.id)}
                  totalMembers={profiles.length} onClick={() => setSelectedMovie(movie)} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMovies.map(movie => (
                <ListRow key={movie.id} movie={movie} myStatus={myStatusForMovie(movie.id)}
                  watchedCount={watchedCount(movie.id)} wantCount={wantCount(movie.id)}
                  totalMembers={profiles.length} onClick={() => setSelectedMovie(movie)} />
              ))}
            </div>
          )}

          {/* Past polls */}
          {closedPolls.length > 0 && (
            <div className="pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-muted)" }}>Past Polls</p>
              <div className="space-y-2">
                {closedPolls.map(poll => {
                  const optionIds = poll.options.map(o => o.id);
                  const winnerId = poll.winning_movie_id ? poll.options.find(o => o.movie_id === poll.winning_movie_id)?.id : null;
                  const winnerMovie = poll.options.find(o => o.id === winnerId)?.movie;
                  return (
                    <button key={poll.id} onClick={() => setSelectedPoll(poll)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border text-left hover:bg-white/5 transition-colors"
                      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{poll.title}</p>
                        {winnerMovie && <p className="text-xs mt-0.5" style={{ color: "var(--color-gold)" }}>🏆 {winnerMovie.title}</p>}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(71,85,105,0.2)", color: "var(--color-text-muted)" }}>Closed</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddModal && <AddMovieModal userId={myUserId} onClose={() => setShowAddModal(false)} onAdded={fetchData} />}
      {selectedMovie && (
        <MovieDetailModal movie={selectedMovie} myUserId={myUserId} myStatus={myStatusForMovie(selectedMovie.id)}
          memberStatuses={memberStatusesForMovie(selectedMovie.id)} totalMembers={profiles.length}
          isAdmin={myRole === "super_admin" || myRole === "moderator"}
          onClose={() => setSelectedMovie(null)} onUpdated={() => { fetchData(); }}
          onDelete={() => { setSelectedMovie(null); fetchData(); }} />
      )}
      {showCreatePoll && (
        <CreatePollModal myUserId={myUserId} queueMovies={queueMovies}
          onClose={() => setShowCreatePoll(false)} onCreated={fetchData} />
      )}
      {selectedPoll && (
        <PollDetailModal poll={selectedPoll} myUserId={myUserId} queueMovies={queueMovies}
          onClose={() => setSelectedPoll(null)} onUpdated={() => { fetchData(); setSelectedPoll(null); }} />
      )}
    </>
  );
}

function EmptyState({ tab, onAdd }: { tab: Tab; onAdd: () => void }) {
  const messages: Partial<Record<Tab, string>> = {
    all: "No movies yet. Add the first one!",
    queue: "Nothing in the watch queue.",
    watching: "Not watching anything currently.",
    watched: "No movies watched together yet.",
    dropped: "Nothing dropped. Great taste!",
  };
  return (
    <div className="py-20 flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "var(--color-surface)" }}>
        <Film size={28} style={{ color: "var(--color-text-muted)" }} />
      </div>
      <p className="text-center max-w-xs" style={{ color: "var(--color-text-muted)" }}>{messages[tab] ?? "Nothing here yet."}</p>
      {tab === "all" && (
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: "var(--color-cyan)", color: "#000" }}>
          <Plus size={15} /> Add a Movie
        </button>
      )}
    </div>
  );
}

function ListRow({ movie, myStatus, watchedCount, wantCount, totalMembers, onClick }: {
  movie: Movie; myStatus: PersonalMovieStatus | null;
  watchedCount: number; wantCount: number; totalMembers: number; onClick: () => void;
}) {
  const meta = GROUP_MOVIE_STATUS_META[movie.group_status];
  return (
    <button onClick={onClick} className="w-full flex items-center gap-4 p-3 rounded-xl border text-left hover:bg-white/5 transition-colors"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
      <div className="w-8 h-12 rounded overflow-hidden flex-shrink-0" style={{ backgroundColor: "var(--color-surface-elevated)" }}>
        {movie.poster_url ? <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Film size={12} style={{ color: "var(--color-text-muted)" }} /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: "var(--color-text-primary)" }}>{movie.title}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {[movie.release_year, movie.genres.slice(0, 2).join(", ")].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs px-2 py-0.5 rounded-full hidden sm:inline-block" style={{ backgroundColor: meta.bg, color: meta.color }}>{meta.label}</span>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{watchedCount}/{totalMembers}</span>
        {wantCount > 0 && <span className="text-xs" style={{ color: "var(--color-gold)" }}>⭐ {wantCount}</span>}
        {myStatus && myStatus !== "not_interested" && (
          <span className="text-sm">{myStatus === "watched" ? "✅" : myStatus === "watching" ? "👀" : myStatus === "want_to_watch" ? "⭐" : ""}</span>
        )}
      </div>
    </button>
  );
}
