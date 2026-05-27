"use client";

import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { GameCard } from "@/components/gaming/GameCard";
import { AddGameModal } from "@/components/gaming/AddGameModal";
import { GameDetailModal } from "@/components/gaming/GameDetailModal";
import { createClient } from "@/lib/supabase/client";
import {
  GROUP_STATUS_META,
  type Game, type GroupGameStatus, type PersonalGameStatus, type Profile,
} from "@/lib/supabase/types";
import { Plus, LayoutGrid, List, Filter, Gamepad2, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { GridSkeleton } from "@/components/ui/Skeleton";

type Tab = "all" | GroupGameStatus | "wishlist";
type ViewMode = "grid" | "list";

interface UserGameRow {
  user_id: string;
  game_id: string;
  status: PersonalGameStatus;
}

interface MemberStatus {
  profile: Pick<Profile, "id" | "display_name" | "avatar_url" | "username">;
  status: PersonalGameStatus;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "all",       label: "All" },
  { id: "playing",   label: "Playing" },
  { id: "queue",     label: "Queue" },
  { id: "completed", label: "Completed" },
  { id: "dropped",   label: "Dropped" },
  { id: "wishlist",  label: "⭐ Wishlist" },
];

export default function GamingPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [allStatuses, setAllStatuses] = useState<UserGameRow[]>([]);
  const [profiles, setProfiles] = useState<Pick<Profile, "id" | "display_name" | "avatar_url" | "username">[]>([]);
  const [myUserId, setMyUserId] = useState("");
  const [myRole, setMyRole] = useState("member");
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<Tab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [genreFilter, setGenreFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const [
      { data: { user } },
      { data: gamesData },
      { data: statusData },
      { data: profilesData },
    ] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("games").select("*").order("created_at", { ascending: false }),
      supabase.from("user_game_status").select("user_id,game_id,status"),
      supabase.from("profiles").select("id,display_name,avatar_url,username,role"),
    ]);

    if (user) {
      setMyUserId(user.id);
      const me = profilesData?.find(p => p.id === user.id);
      if (me) setMyRole((me as Profile).role ?? "member");
    }
    setGames((gamesData ?? []) as Game[]);
    setAllStatuses((statusData ?? []) as UserGameRow[]);
    setProfiles((profilesData ?? []) as Pick<Profile, "id" | "display_name" | "avatar_url" | "username">[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived helpers
  function myStatusForGame(gameId: string): PersonalGameStatus | null {
    return allStatuses.find(r => r.user_id === myUserId && r.game_id === gameId)?.status ?? null;
  }

  function memberStatusesForGame(gameId: string): MemberStatus[] {
    return allStatuses
      .filter(r => r.game_id === gameId && r.status !== "not_interested")
      .map(r => ({
        profile: profiles.find(p => p.id === r.user_id) ?? { id: r.user_id, display_name: "Member", avatar_url: null, username: "" },
        status: r.status,
      }));
  }

  function playedCountForGame(gameId: string): number {
    return allStatuses.filter(r => r.game_id === gameId && (r.status === "completed" || r.status === "playing_solo")).length;
  }

  function wantCountForGame(gameId: string): number {
    return allStatuses.filter(r => r.game_id === gameId && r.status === "want_to_play").length;
  }

  async function deleteGame(gameId: string) {
    const supabase = createClient();
    await supabase.from("games").delete().eq("id", gameId);
    fetchData();
  }

  // All genres and platforms from library
  const allGenres = Array.from(new Set(games.flatMap(g => g.genres))).sort();
  const allPlatforms = Array.from(new Set(games.flatMap(g => g.platforms))).sort();

  // Filter games
  const filteredGames = games.filter(g => {
    if (tab === "wishlist") {
      // Show games where at least one member wants to play
      if (wantCountForGame(g.id) === 0) return false;
    } else if (tab !== "all") {
      if (g.group_status !== tab) return false;
    }
    if (genreFilter !== "all" && !g.genres.includes(genreFilter)) return false;
    if (platformFilter !== "all" && !g.platforms.includes(platformFilter)) return false;
    return true;
  });

  const tabCounts: Partial<Record<Tab, number>> = {
    all: games.length,
    playing: games.filter(g => g.group_status === "playing").length,
    queue: games.filter(g => g.group_status === "queue").length,
    completed: games.filter(g => g.group_status === "completed").length,
    dropped: games.filter(g => g.group_status === "dropped").length,
    wishlist: games.filter(g => wantCountForGame(g.id) > 0).length,
  };

  return (
    <>
      <TopBar title="Gaming Library" />

      <div className="flex-1 py-6 px-[8%] overflow-y-auto">
        <div className="space-y-5">

          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>Gaming Library</h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                {games.length} game{games.length !== 1 ? "s" : ""} in the library
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ backgroundColor: "var(--color-purple)", color: "#fff" }}
            >
              <Plus size={16} />
              Add Game
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {TABS.map(t => {
              const count = tabCounts[t.id] ?? 0;
              const active = tab === t.id;
              const isWishlist = t.id === "wishlist";
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0")}
                  style={active
                    ? { backgroundColor: isWishlist ? "rgba(251,191,36,0.15)" : "var(--color-purple)", color: isWishlist ? "var(--color-gold)" : "#fff" }
                    : { color: "var(--color-text-secondary)" }
                  }
                >
                  {t.label}
                  {count > 0 && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-mono"
                      style={{
                        backgroundColor: active ? "rgba(255,255,255,0.2)" : "var(--color-surface-elevated)",
                        color: active ? "#fff" : "var(--color-text-muted)",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-3">
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors")}
              style={{
                borderColor: showFilters ? "var(--color-purple)" : "var(--color-border)",
                color: showFilters ? "var(--color-purple-light)" : "var(--color-text-secondary)",
                backgroundColor: showFilters ? "rgba(124,58,237,0.08)" : "transparent",
              }}
            >
              <Filter size={13} /> Filters
            </button>

            {/* View toggle */}
            <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
              {(["grid", "list"] as ViewMode[]).map(v => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className="px-3 py-1.5 transition-colors"
                  style={{
                    backgroundColor: viewMode === v ? "var(--color-surface-elevated)" : "transparent",
                    color: viewMode === v ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  }}
                >
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
                <select
                  value={genreFilter}
                  onChange={e => setGenreFilter(e.target.value)}
                  className="px-2 py-1 rounded-lg border text-xs outline-none"
                  style={{ backgroundColor: "var(--color-surface-elevated)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                >
                  <option value="all">All genres</option>
                  {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>Platform</label>
                <select
                  value={platformFilter}
                  onChange={e => setPlatformFilter(e.target.value)}
                  className="px-2 py-1 rounded-lg border text-xs outline-none"
                  style={{ backgroundColor: "var(--color-surface-elevated)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                >
                  <option value="all">All platforms</option>
                  {allPlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {(genreFilter !== "all" || platformFilter !== "all") && (
                <button
                  onClick={() => { setGenreFilter("all"); setPlatformFilter("all"); }}
                  className="text-xs transition-colors"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Wishlist callout */}
          {tab === "wishlist" && filteredGames.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl border"
              style={{ borderColor: "rgba(251,191,36,0.3)", backgroundColor: "rgba(251,191,36,0.05)" }}>
              <Star size={16} className="flex-shrink-0 mt-0.5" style={{ color: "var(--color-gold)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                These are games The Others want to play. Mark <strong>Want to play</strong> on any game to add it here and let others pile on.
              </p>
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
                <GameCard
                  key={game.id}
                  game={game}
                  myStatus={myStatusForGame(game.id)}
                  playedCount={playedCountForGame(game.id)}
                  wantCount={wantCountForGame(game.id)}
                  totalMembers={profiles.length}
                  onClick={() => setSelectedGame(game)}
                  onDelete={() => deleteGame(game.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredGames.map(game => (
                <ListRow
                  key={game.id}
                  game={game}
                  myStatus={myStatusForGame(game.id)}
                  playedCount={playedCountForGame(game.id)}
                  wantCount={wantCountForGame(game.id)}
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
        <AddGameModal
          userId={myUserId}
          onClose={() => setShowAddModal(false)}
          onAdded={fetchData}
        />
      )}

      {selectedGame && (
        <GameDetailModal
          game={selectedGame}
          myUserId={myUserId}
          myStatus={myStatusForGame(selectedGame.id)}
          memberStatuses={memberStatusesForGame(selectedGame.id)}
          totalMembers={profiles.length}
          isAdmin={true}
          onClose={() => setSelectedGame(null)}
          onUpdated={() => { fetchData(); }}
          onDelete={() => { setSelectedGame(null); fetchData(); }}
        />
      )}
    </>
  );
}

function EmptyState({ tab, onAdd }: { tab: Tab; onAdd: () => void }) {
  const messages: Partial<Record<Tab, string>> = {
    all:       "No games yet. Be the first to add one!",
    playing:   "No games currently being played. Start one!",
    queue:     "Nothing in the queue. Add something to play next!",
    completed: "No completed games yet. Get grinding!",
    dropped:   "Nothing dropped. Good discipline!",
    wishlist:  "No wishlist games. Mark 'Want to play' on any game to add it here.",
  };

  return (
    <div className="py-20 flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: "var(--color-surface)" }}>
        <Gamepad2 size={28} style={{ color: "var(--color-text-muted)" }} />
      </div>
      <p className="text-center max-w-xs" style={{ color: "var(--color-text-muted)" }}>
        {messages[tab] ?? "Nothing here yet."}
      </p>
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
  game, myStatus, playedCount, wantCount, totalMembers, onClick,
}: {
  game: Game;
  myStatus: PersonalGameStatus | null;
  playedCount: number;
  wantCount: number;
  totalMembers: number;
  onClick: () => void;
}) {
  const meta = GROUP_STATUS_META[game.group_status];
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-3 rounded-xl border text-left transition-colors hover:bg-white/5"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      {/* Cover */}
      <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0"
        style={{ backgroundColor: "var(--color-surface-elevated)" }}>
        {game.cover_url
          ? <img src={game.cover_url} alt={game.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <Gamepad2 size={14} style={{ color: "var(--color-text-muted)" }} />
            </div>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: "var(--color-text-primary)" }}>{game.title}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          {[game.release_year, game.genres.slice(0, 2).join(", ")].filter(Boolean).join(" · ")}
        </p>
      </div>

      {/* Status + stats */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-xs px-2 py-0.5 rounded-full hidden sm:inline-block"
          style={{ backgroundColor: meta.bg, color: meta.color }}>
          {meta.label}
        </span>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {playedCount}/{totalMembers}
        </span>
        {wantCount > 0 && (
          <span className="text-xs flex items-center gap-0.5" style={{ color: "var(--color-gold)" }}>
            <Star size={10} /> {wantCount}
          </span>
        )}
        {myStatus && myStatus !== "not_interested" && (
          <span className="text-sm">{
            myStatus === "completed" ? "✅" :
            myStatus === "playing_solo" ? "🎮" :
            myStatus === "want_to_play" ? "⭐" : ""
          }</span>
        )}
      </div>
    </button>
  );
}
