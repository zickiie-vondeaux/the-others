"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { X, Loader2, Check, Download, Search, AlertCircle } from "lucide-react";
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
  existingSteamIds: Set<number>;
  onClose: () => void;
  onImported: () => void;
}

function formatPlaytime(minutes: number): string {
  if (minutes < 60) return minutes > 0 ? `${minutes}m played` : "Never played";
  const hours = Math.round(minutes / 60);
  return `${hours.toLocaleString()}h played`;
}

export function SteamImportModal({ userId, steamId, existingSteamIds, onClose, onImported }: Props) {
  const [games, setGames] = useState<SteamGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "new" | "played">("new");

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
        if (filter === "played") return g.playtime_minutes > 0;
        return true;
      });
  }, [games, search, filter, existingSteamIds]);

  const newCount = games.filter(g => !existingSteamIds.has(g.steam_app_id)).length;

  function toggleSelect(appId: number) {
    if (existingSteamIds.has(appId)) return;
    setSelected(prev => {
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
  }

  async function importSelected() {
    if (selected.size === 0) return;
    setImporting(true);

    const supabase = createClient();
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

    // Insert in batches of 50 to avoid payload limits
    for (let i = 0; i < rows.length; i += 50) {
      await supabase.from("games").insert(rows.slice(i, i + 50));
    }

    logActivity({
      type: "game_added",
      entityType: "game",
      entityTitle: toImport.length === 1 ? toImport[0].title : `${toImport.length} games from Steam`,
    });

    setImporting(false);
    setImported(true);
    setTimeout(() => {
      onImported();
      onClose();
    }, 800);
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
                  {games.length} games in your library · {newCount} not yet in The Others
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
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Go to Steam → Settings → Privacy → Game Details → set to Public
              </p>
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
                  {(["new", "played", "all"] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                      className="px-3 py-2 transition-colors capitalize"
                      style={{
                        backgroundColor: filter === f ? "var(--color-surface-elevated)" : "transparent",
                        color: filter === f ? "var(--color-text-primary)" : "var(--color-text-muted)",
                      }}>
                      {f === "new" ? "New" : f === "played" ? "Played" : "All"}
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
                {selected.size > 0 && (
                  <>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>·</span>
                    <button onClick={clearSelection}
                      className="text-xs transition-colors"
                      style={{ color: "var(--color-text-muted)" }}>
                      Clear
                    </button>
                    <span className="ml-auto text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                      {selected.size} selected
                    </span>
                  </>
                )}
              </div>

              {/* Game list */}
              <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1.5">
                {filtered.length === 0 ? (
                  <p className="text-center py-8 text-sm" style={{ color: "var(--color-text-muted)" }}>
                    No games match your filter.
                  </p>
                ) : (
                  filtered.map(g => {
                    const inLibrary = existingSteamIds.has(g.steam_app_id);
                    const isSelected = selected.has(g.steam_app_id);
                    return (
                      <button
                        key={g.steam_app_id}
                        onClick={() => toggleSelect(g.steam_app_id)}
                        disabled={inLibrary}
                        className={cn(
                          "w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all",
                          !inLibrary && "hover:bg-white/5",
                          isSelected && "border-purple-500/50",
                          inLibrary && "opacity-60 cursor-default"
                        )}
                        style={{
                          backgroundColor: isSelected ? "rgba(124,58,237,0.08)" : "var(--color-surface)",
                          borderColor: isSelected ? "var(--color-purple)" : "var(--color-border)",
                        }}
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
                          </p>
                        </div>

                        {/* State indicator */}
                        <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: inLibrary
                              ? "color-mix(in srgb, var(--color-green) 15%, transparent)"
                              : isSelected
                              ? "var(--color-purple)"
                              : "var(--color-surface-elevated)",
                            border: inLibrary || isSelected ? "none" : `1px solid var(--color-border)`,
                          }}>
                          {inLibrary
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
                  onClick={importSelected}
                  disabled={selected.size === 0 || importing || imported}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: imported ? "var(--color-green)" : "var(--color-purple)",
                    color: "#fff",
                  }}
                >
                  {importing
                    ? <><Loader2 size={15} className="animate-spin" /> Importing…</>
                    : imported
                    ? <><Check size={15} /> Done!</>
                    : <><Download size={15} /> Import {selected.size > 0 ? `${selected.size} Game${selected.size !== 1 ? "s" : ""}` : "Selected"}</>
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
