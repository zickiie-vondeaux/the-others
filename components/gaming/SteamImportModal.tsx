"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { X, Loader2, Check, Download, Search, AlertCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { logActivity } from "@/lib/activity";

interface SteamGame {
  steam_app_id: number;
  title: string;
  playtime_minutes: number;
  cover_url: string;
  header_url: string;
}

interface Props {
  userId: string;
  steamId: string;
  existingGames: { id: string; steam_app_id: number }[];
  onClose: () => void;
  onImported: () => void;
}

type Filter = "new" | "imported" | "played" | "all";

function formatPlaytime(minutes: number): string {
  if (minutes < 60) return minutes > 0 ? `${minutes}m played` : "Never played";
  const hours = Math.round(minutes / 60);
  return `${hours.toLocaleString()}h played`;
}

export function SteamImportModal({ userId, steamId, existingGames, onClose, onImported }: Props) {
  const [games, setGames] = useState<SteamGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [toRemove, setToRemove] = useState<Set<number>>(new Set());
  const [applying, setApplying] = useState(false);
  const [done, setDone] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("new");

  const existingSteamIds = useMemo(() => new Set(existingGames.map(g => g.steam_app_id)), [existingGames]);
  const steamIdToDbId = useMemo(() => new Map(existingGames.map(g => [g.steam_app_id, g.id])), [existingGames]);

  useEffect(() => {
    fetch(`/api/steam?action=library&steamid=${steamId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setGames(data.games ?? []);
      })
      .catch(() => setError("Failed to load Steam library. Check your connection."))
      .finally(() => setLoading(false));
  }, [steamId]);

  const filtered = useMemo(() => {
    return games
      .filter(g => g.title.toLowerCase().includes(search.toLowerCase()))
      .filter(g => {
        if (filter === "new") return !existingSteamIds.has(g.steam_app_id);
        if (filter === "imported") return existingSteamIds.has(g.steam_app_id);
        if (filter === "played") return g.playtime_minutes > 0;
        return true;
      });
  }, [games, search, filter, existingSteamIds]);

  const newCount = games.filter(g => !existingSteamIds.has(g.steam_app_id)).length;
  const importedCount = games.filter(g => existingSteamIds.has(g.steam_app_id)).length;
  const totalSelected = selected.size + toRemove.size;

  function toggleSelect(appId: number) {
    if (existingSteamIds.has(appId)) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });
  }

  function toggleRemove(appId: number) {
    if (!existingSteamIds.has(appId)) return;
    setToRemove(prev => {
      const next = new Set(prev);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });
  }

  function selectAllVisible() {
    const newVisible = filtered.filter(g => !existingSteamIds.has(g.steam_app_id));
    setSelected(prev => {
      const next = new Set(prev);
      newVisible.forEach(g => next.add(g.steam_app_id));
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
    setToRemove(new Set());
  }

  async function applyChanges() {
    if (totalSelected === 0) return;
    setApplying(true);

    const supabase = createClient();

    if (selected.size > 0) {
      const toImport = games.filter(g => selected.has(g.steam_app_id));
      const rows = toImport.map(g => ({
        steam_app_id: g.steam_app_id,
        title: g.title,
        cover_url: g.cover_url,
        platforms: ["PC"],
        genres: [] as string[],
        is_multiplayer: false,
        group_status: "queue",
        added_by: userId,
      }));
      for (let i = 0; i < rows.length; i += 50) {
        await supabase.from("games").insert(rows.slice(i, i + 50));
      }
      logActivity({
        type: "game_added",
        entityType: "game",
        entityTitle: toImport.length === 1 ? toImport[0].title : `${toImport.length} games from Steam`,
      });
    }

    if (toRemove.size > 0) {
      const dbIds = [...toRemove]
        .map(steamAppId => steamIdToDbId.get(steamAppId))
        .filter((id): id is string => !!id);
      if (dbIds.length > 0) {
        await supabase.from("game_reviews").delete().in("game_id", dbIds);
        await supabase.from("games").delete().in("id", dbIds);
      }
    }

    setApplying(false);
    setDone(true);
    setTimeout(() => { onImported(); onClose(); }, 800);
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-2xl rounded-2xl border z-10 flex flex-col"
          style={{
            backgroundColor: "var(--color-surface-elevated)",
            borderColor: "var(--color-border)",
            maxHeight: "85vh",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                Import from Steam
              </h2>
              {!loading && !error && (
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {games.length} games in your library · {newCount} new · {importedCount} already imported
                </p>
              )}
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: "var(--color-text-muted)" }}>
              <X size={18} />
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 size={28} className="animate-spin" style={{ color: "var(--color-cyan)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Loading Steam library…</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
              <AlertCircle size={28} style={{ color: "var(--color-red)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{error}</p>
              {!error.toLowerCase().includes("not configured") && (
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Go to Steam → Settings → Privacy → Game Details → set to Public
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Controls */}
              <div className="flex items-center gap-3 px-6 pb-3 flex-shrink-0">
                <div className="relative flex-1">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--color-text-muted)" }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search games…"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border text-xs outline-none"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                </div>
                <div className="flex rounded-lg border overflow-hidden text-xs" style={{ borderColor: "var(--color-border)" }}>
                  {(["new", "imported", "played", "all"] as Filter[]).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                      className="px-3 py-2 transition-colors"
                      style={{
                        backgroundColor: filter === f ? "var(--color-surface-elevated)" : "transparent",
                        color: filter === f ? "var(--color-text-primary)" : "var(--color-text-muted)",
                      }}>
                      {f === "new" ? "New" : f === "imported" ? "Imported" : f === "played" ? "Played" : "All"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selection bar */}
              <div className="flex items-center gap-3 px-6 pb-3 flex-shrink-0 border-b" style={{ borderColor: "var(--color-border)" }}>
                <button onClick={selectAllVisible}
                  className="text-xs transition-colors"
                  style={{ color: "var(--color-cyan)" }}>
                  Select all visible
                </button>
                {totalSelected > 0 && (
                  <>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>·</span>
                    <button onClick={clearSelection}
                      className="text-xs transition-colors"
                      style={{ color: "var(--color-text-muted)" }}>
                      Clear
                    </button>
                    <div className="ml-auto flex items-center gap-2 text-xs font-medium">
                      {selected.size > 0 && (
                        <span style={{ color: "var(--color-purple-light)" }}>+{selected.size} to import</span>
                      )}
                      {toRemove.size > 0 && (
                        <span style={{ color: "var(--color-red)" }}>−{toRemove.size} to remove</span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Game list */}
              <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1.5">
                {filter === "imported" && importedCount === 0 ? (
                  <p className="text-center py-8 text-sm" style={{ color: "var(--color-text-muted)" }}>
                    No Steam games have been imported yet.
                  </p>
                ) : filtered.length === 0 ? (
                  <p className="text-center py-8 text-sm" style={{ color: "var(--color-text-muted)" }}>
                    No games match your filter.
                  </p>
                ) : (
                  filtered.map(g => {
                    const inLibrary = existingSteamIds.has(g.steam_app_id);
                    const isSelected = selected.has(g.steam_app_id);
                    const isRemoving = toRemove.has(g.steam_app_id);

                    let borderColor = "var(--color-border)";
                    let bgColor = "var(--color-surface)";
                    if (isSelected)  { borderColor = "var(--color-purple)"; bgColor = "rgba(124,58,237,0.08)"; }
                    if (isRemoving)  { borderColor = "var(--color-red)";    bgColor = "rgba(239,68,68,0.08)"; }

                    return (
                      <button
                        key={g.steam_app_id}
                        onClick={() => inLibrary ? toggleRemove(g.steam_app_id) : toggleSelect(g.steam_app_id)}
                        className={cn("w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all hover:bg-white/5")}
                        style={{ backgroundColor: bgColor, borderColor }}
                      >
                        {/* Cover */}
                        <div className="w-8 h-11 rounded-md overflow-hidden flex-shrink-0"
                          style={{ backgroundColor: "var(--color-surface-elevated)" }}>
                          <img
                            src={g.cover_url}
                            alt={g.title}
                            className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                            {g.title}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                            {formatPlaytime(g.playtime_minutes)}
                            {inLibrary && !isRemoving && (
                              <span style={{ color: "var(--color-green)" }}> · In library</span>
                            )}
                            {isRemoving && (
                              <span style={{ color: "var(--color-red)" }}> · Will be removed</span>
                            )}
                          </p>
                        </div>

                        {/* State indicator */}
                        <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: isRemoving
                              ? "color-mix(in srgb, var(--color-red) 20%, transparent)"
                              : inLibrary
                              ? "color-mix(in srgb, var(--color-green) 15%, transparent)"
                              : isSelected
                              ? "var(--color-purple)"
                              : "var(--color-surface-elevated)",
                            border: isRemoving || inLibrary || isSelected ? "none" : `1px solid var(--color-border)`,
                          }}>
                          {isRemoving
                            ? <Trash2 size={10} style={{ color: "var(--color-red)" }} />
                            : inLibrary
                            ? <Check size={11} style={{ color: "var(--color-green)" }} />
                            : isSelected
                            ? <Check size={11} color="white" />
                            : null
                          }
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-6 pt-3 pb-6 flex-shrink-0 border-t flex items-center gap-3"
                style={{ borderColor: "var(--color-border)" }}>
                <button onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-white/5"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                  Cancel
                </button>
                <button
                  onClick={applyChanges}
                  disabled={totalSelected === 0 || applying || done}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: done
                      ? "var(--color-green)"
                      : toRemove.size > 0 && selected.size === 0
                      ? "var(--color-red)"
                      : "var(--color-purple)",
                    color: "#fff",
                  }}
                >
                  {applying
                    ? <><Loader2 size={15} className="animate-spin" /> Working…</>
                    : done
                    ? <><Check size={15} /> Done!</>
                    : selected.size > 0 && toRemove.size > 0
                    ? <><Download size={15} /> Import {selected.size} & Remove {toRemove.size}</>
                    : selected.size > 0
                    ? <><Download size={15} /> Import {selected.size} Game{selected.size !== 1 ? "s" : ""}</>
                    : toRemove.size > 0
                    ? <><Trash2 size={15} /> Remove {toRemove.size} Game{toRemove.size !== 1 ? "s" : ""}</>
                    : "Select Games"
                  }
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
