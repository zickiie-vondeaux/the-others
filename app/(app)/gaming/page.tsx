"use client";

import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { GameCard } from "@/components/gaming/GameCard";
import { AddGameModal } from "@/components/gaming/AddGameModal";
import { GameDetailModal, type GameReviewWithProfile } from "@/components/gaming/GameDetailModal";
import { SteamImportModal } from "@/components/gaming/SteamImportModal";
import { createClient } from "@/lib/supabase/client";
import { type Game, type GameReview, type Profile } from "@/lib/supabase/types";
import { Plus, LayoutGrid, List, Filter, Gamepad2, Download, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { GridSkeleton } from "@/components/ui/Skeleton";

type Tab = "all" | "rated" | "unrated";
type ViewMode = "grid" | "list";

interface GameReviewRow {
  user_id: string;
  game_id: string;
  rating: number;
  review_text: string | null;
  id: string;
  created_at: string;
  updated_at: string;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "all",     label: "All" },
  { id: "rated",   label: "Rated" },
  { id: "unrated", label: "Unrated" },
];

export default function GamingPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [allReviews, setAllReviews] = useState<GameReviewRow[]>([]);
  const [profiles, setProfiles] = useState<Pick<Profile, "id" | "display_name" | "avatar_url" | "username">[]>([]);
  const [myUserId, setMyUserId] = useState("");
  const [myRole, setMyRole] = useState("member");
  const [mySteamId, setMySteamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<Tab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [genreFilter, setGenreFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSteamModal, setShowSteamModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const [
      { data: { user } },
      { data: gamesData },
      { data: reviewsData },
      { data: profilesData },
    ] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("games").select("*").order("created_at", { ascending: false }),
      supabase.from("game_reviews").select("*"),
      supabase.from("profiles").select("id,display_name,avatar_url,username,role,steam_id"),
    ]);

    if (user) {
      setMyUserId(user.id);
      const me = profilesData?.find(p => p.id === user.id);
      if (me) {
        setMyRole((me as Profile).role ?? "member");
        setMySteamId((me as Profile).steam_id ?? null);
      }
    }
    setGames((gamesData ?? []) as Game[]);
    setAllReviews((reviewsData ?? []) as GameReviewRow[]);
    setProfiles((profilesData ?? []) as Pick<Profile, "id" | "display_name" | "avatar_url" | "username">[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived helpers
  function myReviewForGame(gameId: string): GameReview | null {
    const r = allReviews.find(r => r.user_id === myUserId && r.game_id === gameId);
    return r ? (r as GameReview) : null;
  }

  function memberReviewsForGame(gameId: string): GameReviewWithProfile[] {
    return allReviews
      .filter(r => r.game_id === gameId)
      .map(r => ({
        review: r as GameReview,
        profile: profiles.find(p => p.id === r.user_id) ?? { id: r.user_id, display_name: "Member", avatar_url: null, username: "" },
      }));
  }

  function avgRatingForGame(gameId: string): number | null {
    const reviews = allReviews.filter(r => r.game_id === gameId);
    if (reviews.length === 0) return null;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  }

  function ratingCountForGame(gameId: string): number {
    return allReviews.filter(r => r.game_id === gameId).length;
  }

  async function deleteGame(gameId: string) {
    const supabase = createClient();
    await supabase.from("game_reviews").delete().eq("game_id", gameId);
    await supabase.from("games").delete().eq("id", gameId);
    fetchData();
  }

  const allGenres = Array.from(new Set(games.flatMap(g => g.genres))).sort();
  const allPlatforms = Array.from(new Set(games.flatMap(g => g.platforms))).sort();

  const filteredGames = games.filter(g => {
    const hasRatings = ratingCountForGame(g.id) > 0;
    if (tab === "rated" && !hasRatings) return false;
    if (tab === "unrated" && hasRatings) return false;
    if (genreFilter !== "all" && !g.genres.includes(genreFilter)) return false;
    if (platformFilter !== "all" && !g.platforms.includes(platformFilter)) return false;
    return true;
  });

  const tabCounts: Record<Tab, number> = {
    all:     games.length,
    rated:   games.filter(g => ratingCountForGame(g.id) > 0).length,
    unrated: games.filter(g => ratingCountForGame(g.id) === 0).length,
  };

  return (
    <>
      <TopBar title="Gaming Library" />

      <div className="flex-1 py-6 px-[8%] overflow-y-auto">
        <div className="space-y-5">

          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="neon-heading text-4xl font-black uppercase tracking-widest">Gaming Library</h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                {games.length} game{games.length !== 1 ? "s" : ""} in the library
              </p>
            </div>
            <div className="flex items-center gap-2">
              {mySteamId && (
                <button onClick={() => setShowSteamModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors border"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                  title="Import games from your Steam library">
                  <Download size={15} /> Sync Steam
                </button>
              )}
              <button onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ backgroundColor: "var(--color-purple)", color: "#fff" }}>
                <Plus size={16} /> Add Game
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {TABS.map(t => {
              const count = tabCounts[t.id];
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0")}
                  style={active
                    ? { backgroundColor: "var(--color-purple)", color: "#fff" }
                    : { color: "var(--color-text-secondary)" }}>
                  {t.id === "rated" && <Star size={12} fill="currentColor" />}
                  {t.label}
                  {count > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-mono"
                      style={{
                        backgroundColor: active ? "rgba(255,255,255,0.2)" : "var(--color-surface-elevated)",
                        color: active ? "#fff" : "var(--color-text-muted)",
                      }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-3">
            <button onClick={() => setShowFilters(v => !v)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors")}
              style={{
                borderColor: showFilters ? "var(--color-purple)" : "var(--color-border)",
                color: showFilters ? "var(--color-purple-light)" : "var(--color-text-secondary)",
                backgroundColor: showFilters ? "rgba(124,58,237,0.08)" : "transparent",
              }}>
              <Filter size={13} /> Filters
            </button>

            <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
              {(["grid", "list"] as ViewMode[]).map(v => (
                <button key={v} onClick={() => setViewMode(v)} className="px-3 py-1.5 transition-colors"
                  style={{
                    backgroundColor: viewMode === v ? "var(--color-surface-elevated)" : "transparent",
                    color: viewMode === v ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  }}>
                  {v === "grid" ? <LayoutGrid size={14} /> : <List size={14} />}
                </button>
              ))}
            </div>

            <span className="ml-auto text-xs" style={{ color: "var(--color-text-muted)" }}>
              {filteredGames.length} result{filteredGames.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Filter pills */}
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
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>Platform</label>
                <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)}
                  className="px-2 py-1 rounded-lg border text-xs outline-none"
                  style={{ backgroundColor: "var(--color-surface-elevated)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>
                  <option value="all">All platforms</option>
                  {allPlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {(genreFilter !== "all" || platformFilter !== "all") && (
                <button onClick={() => { setGenreFilter("all"); setPlatformFilter("all"); }}
                  className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <GridSkeleton count={8} />
          ) : filteredGames.length === 0 ? (
            <EmptyState tab={tab} onAdd={() => setShowAddModal(true)} />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredGames.map(game => (
                <GameCard key={game.id} game={game}
                  myRating={myReviewForGame(game.id)?.rating ?? null}
                  avgRating={avgRatingForGame(game.id)}
                  ratingCount={ratingCountForGame(game.id)}
                  onClick={() => setSelectedGame(game)}
                  onDelete={() => deleteGame(game.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredGames.map(game => (
                <ListRow key={game.id} game={game}
                  myRating={myReviewForGame(game.id)?.rating ?? null}
                  avgRating={avgRatingForGame(game.id)}
                  ratingCount={ratingCountForGame(game.id)}
                  totalMembers={profiles.length}
                  onClick={() => setSelectedGame(game)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddGameModal userId={myUserId} onClose={() => setShowAddModal(false)} onAdded={fetchData} />
      )}

      {showSteamModal && mySteamId && (
        <SteamImportModal
          userId={myUserId}
          steamId={mySteamId}
          existingGames={games.filter(g => g.steam_app_id !== null).map(g => ({ id: g.id, steam_app_id: g.steam_app_id! }))}
          onClose={() => setShowSteamModal(false)}
          onImported={fetchData}
        />
      )}

      {selectedGame && (
        <GameDetailModal
          game={selectedGame}
          myUserId={myUserId}
          myReview={myReviewForGame(selectedGame.id)}
          memberReviews={memberReviewsForGame(selectedGame.id)}
          totalMembers={profiles.length}
          isAdmin={myRole === "super_admin" || myRole === "moderator"}
          onClose={() => setSelectedGame(null)}
          onUpdated={() => { fetchData(); }}
          onDelete={() => { setSelectedGame(null); fetchData(); }}
        />
      )}
    </>
  );
}

function EmptyState({ tab, onAdd }: { tab: Tab; onAdd: () => void }) {
  const messages: Record<Tab, string> = {
    all:     "No games yet. Be the first to add one!",
    rated:   "No games have been rated yet. Open a game and leave a review!",
    unrated: "Every game has been rated — nice work!",
  };
  return (
    <div className="py-20 flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "var(--color-surface)" }}>
        <Gamepad2 size={28} style={{ color: "var(--color-text-muted)" }} />
      </div>
      <p className="text-center max-w-xs" style={{ color: "var(--color-text-muted)" }}>{messages[tab]}</p>
      {tab === "all" && (
        <button onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          style={{ backgroundColor: "var(--color-purple)", color: "#fff" }}>
          <Plus size={15} /> Add a Game
        </button>
      )}
    </div>
  );
}

function ListRow({
  game, myRating, avgRating, ratingCount, totalMembers, onClick,
}: {
  game: Game;
  myRating: number | null;
  avgRating: number | null;
  ratingCount: number;
  totalMembers: number;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-4 p-3 rounded-xl border text-left transition-colors hover:bg-white/5"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
      {/* Cover */}
      <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: "var(--color-surface-elevated)" }}>
        {game.cover_url
          ? <img src={game.cover_url} alt={game.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Gamepad2 size={14} style={{ color: "var(--color-text-muted)" }} /></div>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: "var(--color-text-primary)" }}>{game.title}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {[game.release_year, game.genres.slice(0, 2).join(", ")].filter(Boolean).join(" · ")}
        </p>
      </div>

      {/* Rating + stats */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {avgRating !== null ? (
          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-gold)" }}>
            <Star size={11} fill="currentColor" />
            {avgRating.toFixed(1)}
            <span style={{ color: "var(--color-text-muted)" }}>({ratingCount}/{totalMembers})</span>
          </span>
        ) : (
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>No ratings</span>
        )}
        {myRating !== null && (
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(251,191,36,0.2)", color: "var(--color-gold)" }}>
            ★{myRating}
          </span>
        )}
      </div>
    </button>
  );
}
