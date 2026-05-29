"use client";

import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { GameCard } from "@/components/gaming/GameCard";
import { AddGameModal } from "@/components/gaming/AddGameModal";
import { GameDetailModal, type GameReviewWithProfile } from "@/components/gaming/GameDetailModal";
import { SteamImportModal } from "@/components/gaming/SteamImportModal";
import { createClient } from "@/lib/supabase/client";
import { type Game, type GameReview, type Profile } from "@/lib/supabase/types";
import { Plus, LayoutGrid, List, Filter, Gamepad2, Download, Star, Trash2, CheckSquare, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { GridSkeleton } from "@/components/ui/Skeleton";

type Tab = "all" | "rated" | "unrated";
type ViewMode = "grid" | "list";
type DateFilter = "all" | "week" | "month" | "3months";

interface GameReviewRow {
  user_id: string;
  game_id: string;
  rating: number;
  review_text: string | null;
  id: string;
  created_at: string;
  updated_at: string;
}

type DeleteTarget =
  | { type: "single"; game: Game }
  | { type: "bulk"; ids: string[] };

const TABS: { id: Tab; label: string }[] = [
  { id: "all",     label: "All" },
  { id: "rated",   label: "Rated" },
  { id: "unrated", label: "Unrated" },
];

const DATE_OPTIONS: { id: DateFilter; label: string }[] = [
  { id: "all",     label: "All time" },
  { id: "week",    label: "Past week" },
  { id: "month",   label: "Past month" },
  { id: "3months", label: "Past 3 months" },
];

function dateThreshold(filter: DateFilter): Date | null {
  const now = new Date();
  if (filter === "week")    { now.setDate(now.getDate() - 7);   return now; }
  if (filter === "month")   { now.setMonth(now.getMonth() - 1); return now; }
  if (filter === "3months") { now.setMonth(now.getMonth() - 3); return now; }
  return null;
}

export default function GamingPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [allReviews, setAllReviews] = useState<GameReviewRow[]>([]);
  const [profiles, setProfiles] = useState<Pick<Profile, "id" | "display_name" | "avatar_url" | "username">[]>([]);
  const [myUserId, setMyUserId] = useState("");
  const [myRole, setMyRole] = useState<import("@/lib/roles").Role>("unnamed");
  const [mySteamId, setMySteamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [tab, setTab] = useState<Tab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [genreFilter, setGenreFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [addedByFilter, setAddedByFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSteamModal, setShowSteamModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk select
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
        setMyRole(((me as Profile).role ?? "unnamed") as import("@/lib/roles").Role);
        setMySteamId((me as Profile).steam_id ?? null);
      }
    }
    setGames((gamesData ?? []) as Game[]);
    setAllReviews((reviewsData ?? []) as GameReviewRow[]);
    setProfiles((profilesData ?? []) as Pick<Profile, "id" | "display_name" | "avatar_url" | "username">[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  function canDelete(game: Game): boolean {
    return myRole === "watcher" || myRole === "chaos" || game.added_by === myUserId;
  }

  async function runDelete(ids: string[]) {
    setDeleting(true);
    await Promise.all(ids.map(id => fetch(`/api/games?id=${id}`, { method: "DELETE" })));
    setDeleting(false);
    setDeleteTarget(null);
    setSelectedIds(new Set());
    setSelectMode(false);
    fetchData();
  }

  function toggleSelectGame(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  // Importer options — only members who have actually added games
  const importerOptions = profiles.filter(p => games.some(g => g.added_by === p.id));

  const allGenres = Array.from(new Set(games.flatMap(g => g.genres))).sort();
  const allPlatforms = Array.from(new Set(games.flatMap(g => g.platforms))).sort();
  const activeFilterCount = [genreFilter, platformFilter, addedByFilter].filter(f => f !== "all").length
    + (dateFilter !== "all" ? 1 : 0);

  const filteredGames = games.filter(g => {
    const hasRatings = ratingCountForGame(g.id) > 0;
    if (tab === "rated" && !hasRatings) return false;
    if (tab === "unrated" && hasRatings) return false;
    if (genreFilter !== "all" && !g.genres.includes(genreFilter)) return false;
    if (platformFilter !== "all" && !g.platforms.includes(platformFilter)) return false;
    if (addedByFilter !== "all" && g.added_by !== addedByFilter) return false;
    const threshold = dateThreshold(dateFilter);
    if (threshold && new Date(g.created_at) < threshold) return false;
    return true;
  });

  const tabCounts: Record<Tab, number> = {
    all:     games.length,
    rated:   games.filter(g => ratingCountForGame(g.id) > 0).length,
    unrated: games.filter(g => ratingCountForGame(g.id) === 0).length,
  };

  const anyFilterActive = activeFilterCount > 0;
  const selectedCanDelete = [...selectedIds].every(id => {
    const g = games.find(x => x.id === id);
    return g && canDelete(g);
  });

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
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => setShowFilters(v => !v)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors")}
              style={{
                borderColor: showFilters || anyFilterActive ? "var(--color-purple)" : "var(--color-border)",
                color: showFilters || anyFilterActive ? "var(--color-purple-light)" : "var(--color-text-secondary)",
                backgroundColor: showFilters || anyFilterActive ? "rgba(124,58,237,0.08)" : "transparent",
              }}>
              <Filter size={13} />
              Filters
              {activeFilterCount > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{ backgroundColor: "var(--color-purple)", color: "#fff" }}>
                  {activeFilterCount}
                </span>
              )}
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

            {/* Select mode toggle */}
            <button onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors"
              style={{
                borderColor: selectMode ? "var(--color-red)" : "var(--color-border)",
                color: selectMode ? "#ef4444" : "var(--color-text-secondary)",
                backgroundColor: selectMode ? "rgba(239,68,68,0.08)" : "transparent",
              }}>
              <CheckSquare size={13} />
              {selectMode ? "Cancel" : "Select"}
            </button>

            {/* Bulk actions — visible only in select mode */}
            {selectMode && (
              <>
                <button
                  onClick={() => {
                    const allIds = filteredGames.map(g => g.id);
                    const allSelected = allIds.every(id => selectedIds.has(id));
                    setSelectedIds(allSelected ? new Set() : new Set(allIds));
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-cyan)" }}>
                  {filteredGames.every(g => selectedIds.has(g.id)) ? "Deselect all" : "Select all"}
                </button>

                <button
                  onClick={() => selectedIds.size > 0 && selectedCanDelete && setDeleteTarget({ type: "bulk", ids: [...selectedIds] })}
                  disabled={selectedIds.size === 0 || !selectedCanDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40"
                  style={{ backgroundColor: "#ef4444", color: "#fff" }}>
                  <Trash2 size={13} />
                  {selectedIds.size > 0 ? `Delete ${selectedIds.size}` : "Delete"}
                </button>
              </>
            )}

            <span className="ml-auto text-xs" style={{ color: "var(--color-text-muted)" }}>
              {filteredGames.length} result{filteredGames.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>Genre</label>
                <select value={genreFilter} onChange={e => setGenreFilter(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border text-xs outline-none"
                  style={{ backgroundColor: "var(--color-surface-elevated)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>
                  <option value="all">All genres</option>
                  {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>Platform</label>
                <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border text-xs outline-none"
                  style={{ backgroundColor: "var(--color-surface-elevated)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>
                  <option value="all">All platforms</option>
                  {allPlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>Added by</label>
                <select value={addedByFilter} onChange={e => setAddedByFilter(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border text-xs outline-none"
                  style={{ backgroundColor: "var(--color-surface-elevated)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>
                  <option value="all">Anyone</option>
                  {importerOptions.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.id === myUserId ? "Me" : p.display_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>Added on</label>
                <select value={dateFilter} onChange={e => setDateFilter(e.target.value as DateFilter)}
                  className="w-full px-2 py-1.5 rounded-lg border text-xs outline-none"
                  style={{ backgroundColor: "var(--color-surface-elevated)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>
                  {DATE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
              {anyFilterActive && (
                <button
                  onClick={() => { setGenreFilter("all"); setPlatformFilter("all"); setAddedByFilter("all"); setDateFilter("all"); }}
                  className="col-span-2 sm:col-span-4 text-xs text-left"
                  style={{ color: "var(--color-text-muted)" }}>
                  Clear all filters
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
                  onClick={() => !selectMode && setSelectedGame(game)}
                  onDelete={canDelete(game) && !selectMode ? () => setDeleteTarget({ type: "single", game }) : undefined}
                  selectMode={selectMode}
                  isSelected={selectedIds.has(game.id)}
                  onSelect={() => toggleSelectGame(game.id)}
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
                  canDelete={canDelete(game) && !selectMode}
                  selectMode={selectMode}
                  isSelected={selectedIds.has(game.id)}
                  onClick={() => selectMode ? toggleSelectGame(game.id) : setSelectedGame(game)}
                  onDelete={() => setDeleteTarget({ type: "single", game })}
                  onSelect={() => toggleSelectGame(game.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>


      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
            onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border p-6 space-y-4"
            style={{ backgroundColor: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}>
            <button onClick={() => !deleting && setDeleteTarget(null)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: "var(--color-text-muted)" }}>
              <X size={16} />
            </button>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "rgba(239,68,68,0.15)" }}>
                <Trash2 size={18} style={{ color: "#ef4444" }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
                  {deleteTarget.type === "single"
                    ? `Remove "${deleteTarget.game.title}"?`
                    : `Remove ${deleteTarget.ids.length} game${deleteTarget.ids.length !== 1 ? "s" : ""}?`}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                  This will also delete all ratings for {deleteTarget.type === "single" ? "this game" : "these games"}.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-white/5 disabled:opacity-50"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                Cancel
              </button>
              <button
                onClick={() => runDelete(deleteTarget.type === "single" ? [deleteTarget.game.id] : deleteTarget.ids)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#ef4444", color: "#fff" }}>
                {deleting
                  ? <><Loader2 size={14} className="animate-spin" /> Removing…</>
                  : "Remove"
                }
              </button>
            </div>
          </div>
        </div>
      )}

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
          isAdmin={myRole === "watcher" || myRole === "chaos"}
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
  game, myRating, avgRating, ratingCount, totalMembers, canDelete, selectMode, isSelected, onClick, onDelete, onSelect,
}: {
  game: Game;
  myRating: number | null;
  avgRating: number | null;
  ratingCount: number;
  totalMembers: number;
  canDelete: boolean;
  selectMode: boolean;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  onSelect: () => void;
}) {
  return (
    <div role="button" tabIndex={0} onClick={onClick} onKeyDown={e => e.key === "Enter" && onClick()}
      className="w-full flex items-center gap-4 p-3 rounded-xl border text-left transition-colors hover:bg-white/5 cursor-pointer"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: isSelected ? "var(--color-purple)" : "var(--color-border)",
      }}>
      {selectMode && (
        <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors"
          style={{
            backgroundColor: isSelected ? "var(--color-purple)" : "transparent",
            borderColor: isSelected ? "var(--color-purple)" : "var(--color-border)",
          }}>
          {isSelected && <span className="text-white text-xs font-bold">✓</span>}
        </div>
      )}
      <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: "var(--color-surface-elevated)" }}>
        {game.cover_url
          ? <img src={game.cover_url} alt={game.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Gamepad2 size={14} style={{ color: "var(--color-text-muted)" }} /></div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: "var(--color-text-primary)" }}>{game.title}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {[game.release_year, game.genres.slice(0, 2).join(", ")].filter(Boolean).join(" · ")}
        </p>
      </div>
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
        {canDelete && !selectMode && (
          <button onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
            style={{ color: "#ef4444" }}>
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
