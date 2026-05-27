"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { GROUP_STATUS_META, type GroupGameStatus } from "@/lib/supabase/types";
import type { NormalizedGame } from "@/lib/rawg";
import { Search, X, Gamepad2, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Props {
  userId: string;
  onClose: () => void;
  onAdded: () => void;
}

type Tab = "search" | "manual";

const STATUS_OPTIONS: GroupGameStatus[] = ["queue", "playing", "completed", "dropped"];

export function AddGameModal({ userId, onClose, onAdded }: Props) {
  const [tab, setTab] = useState<Tab>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NormalizedGame[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<NormalizedGame | null>(null);
  const [groupStatus, setGroupStatus] = useState<GroupGameStatus>("queue");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [igdbAvailable, setIgdbAvailable] = useState(true);

  // Manual form state
  const [manual, setManual] = useState({
    title: "",
    release_year: "",
    genres: "",
    platforms: "",
    is_multiplayer: false,
    summary: "",
  });

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/games?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(Array.isArray(data) ? data : []);
          if (Array.isArray(data) && data.length === 0) setIgdbAvailable(false);
        }
      } catch {
        setIgdbAvailable(false);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => { if (searchRef.current) clearTimeout(searchRef.current); };
  }, [query]);

  async function save() {
    setError("");
    setSaving(true);
    const supabase = createClient();

    let payload: Record<string, unknown>;

    if (tab === "search" && selected) {
      payload = {
        igdb_id: selected.rawg_id,
        title: selected.title,
        cover_url: selected.cover_url,
        release_year: selected.release_year,
        genres: selected.genres,
        platforms: selected.platforms,
        is_multiplayer: selected.is_multiplayer,
        summary: selected.summary,
        group_status: groupStatus,
        added_by: userId,
      };
    } else {
      const title = manual.title.trim();
      if (!title) { setError("Title is required."); setSaving(false); return; }
      payload = {
        title,
        release_year: manual.release_year ? parseInt(manual.release_year) : null,
        genres: manual.genres ? manual.genres.split(",").map(s => s.trim()).filter(Boolean) : [],
        platforms: manual.platforms ? manual.platforms.split(",").map(s => s.trim()).filter(Boolean) : [],
        is_multiplayer: manual.is_multiplayer,
        summary: manual.summary.trim() || null,
        group_status: groupStatus,
        added_by: userId,
      };
    }

    const { error: err } = await supabase.from("games").insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onAdded();
    onClose();
  }

  const canSave = (tab === "search" && selected != null) || (tab === "manual" && manual.title.trim() !== "");

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
          className="relative w-full max-w-lg rounded-2xl border z-10 flex flex-col max-h-[90vh]"
          style={{ backgroundColor: "var(--color-surface-elevated)", borderColor: "var(--color-border)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Gamepad2 size={20} style={{ color: "var(--color-purple)" }} />
              <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Add a Game</h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: "var(--color-text-muted)" }}>
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-6 pb-4 flex-shrink-0">
            {(["search", "manual"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setSelected(null); setError(""); }}
                className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  tab === t ? "text-white" : "hover:bg-white/5"
                )}
                style={tab === t
                  ? { backgroundColor: "var(--color-purple)" }
                  : { color: "var(--color-text-secondary)" }
                }
              >
                {t === "search" ? "Search IGDB" : "Manual Entry"}
              </button>
            ))}
          </div>

          {/* Body — scrollable */}
          <div className="flex-1 overflow-y-auto px-6 pb-2">

            {tab === "search" ? (
              <div className="space-y-3">
                {/* Search input */}
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--color-text-muted)" }} />
                  <input
                    autoFocus
                    value={query}
                    onChange={e => { setQuery(e.target.value); setSelected(null); }}
                    placeholder="Search for a game..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:border-purple-500"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                  {searching && (
                    <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin"
                      style={{ color: "var(--color-text-muted)" }} />
                  )}
                </div>

                {!igdbAvailable && (
                  <p className="text-xs px-1" style={{ color: "var(--color-amber)" }}>
                    RAWG API key not configured — results unavailable. Use Manual Entry instead.
                  </p>
                )}

                {/* Results */}
                {results.length > 0 && !selected && (
                  <div className="rounded-xl border divide-y overflow-hidden"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                    {results.map(g => (
                      <button
                        key={g.rawg_id}
                        onClick={() => setSelected(g)}
                        className="flex items-center gap-3 w-full p-3 hover:bg-white/5 transition-colors text-left"
                      >
                        {g.cover_url
                          ? <img src={g.cover_url} alt={g.title} className="w-10 h-14 object-cover rounded-md flex-shrink-0" />
                          : <div className="w-10 h-14 rounded-md flex-shrink-0 flex items-center justify-center"
                              style={{ backgroundColor: "var(--color-surface-elevated)" }}>
                              <Gamepad2 size={16} style={{ color: "var(--color-text-muted)" }} />
                            </div>
                        }
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{g.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                            {[g.release_year, g.genres.slice(0, 2).join(", ")].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected preview */}
                {selected && (
                  <div className="rounded-xl border p-4 flex gap-4"
                    style={{ borderColor: "var(--color-purple)", backgroundColor: "rgba(124,58,237,0.08)" }}>
                    {selected.cover_url
                      ? <img src={selected.cover_url} alt={selected.title} className="w-16 h-22 object-cover rounded-lg flex-shrink-0" style={{ height: "88px" }} />
                      : <div className="w-16 rounded-lg flex-shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: "var(--color-surface)", height: "88px" }}>
                          <Gamepad2 size={20} style={{ color: "var(--color-text-muted)" }} />
                        </div>
                    }
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{selected.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                        {[selected.release_year, selected.genres.slice(0, 3).join(", ")].filter(Boolean).join(" · ")}
                      </p>
                      {selected.platforms.length > 0 && (
                        <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                          {selected.platforms.slice(0, 4).join(", ")}
                        </p>
                      )}
                      {selected.is_multiplayer && (
                        <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "rgba(6,182,212,0.15)", color: "var(--color-cyan)" }}>
                          Multiplayer
                        </span>
                      )}
                    </div>
                    <button onClick={() => setSelected(null)} className="self-start p-1 rounded-md hover:bg-white/10 transition-colors flex-shrink-0"
                      style={{ color: "var(--color-text-muted)" }}>
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Manual entry form */
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                    Title <span style={{ color: "var(--color-red)" }}>*</span>
                  </label>
                  <input
                    autoFocus
                    value={manual.title}
                    onChange={e => setManual(m => ({ ...m, title: e.target.value }))}
                    placeholder="e.g. Hollow Knight"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:border-purple-500"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Release Year</label>
                    <input
                      type="number" min="1970" max="2030"
                      value={manual.release_year}
                      onChange={e => setManual(m => ({ ...m, release_year: e.target.value }))}
                      placeholder="2024"
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:border-purple-500"
                      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Platforms (comma-separated)</label>
                    <input
                      value={manual.platforms}
                      onChange={e => setManual(m => ({ ...m, platforms: e.target.value }))}
                      placeholder="PC, PS5, Switch"
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:border-purple-500"
                      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Genres (comma-separated)</label>
                  <input
                    value={manual.genres}
                    onChange={e => setManual(m => ({ ...m, genres: e.target.value }))}
                    placeholder="RPG, Action, Co-op"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:border-purple-500"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Summary</label>
                  <textarea
                    rows={2}
                    value={manual.summary}
                    onChange={e => setManual(m => ({ ...m, summary: e.target.value }))}
                    placeholder="Short description..."
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:border-purple-500 resize-none"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={manual.is_multiplayer}
                    onChange={e => setManual(m => ({ ...m, is_multiplayer: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Multiplayer</span>
                </label>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pt-4 pb-6 flex-shrink-0 space-y-4 border-t" style={{ borderColor: "var(--color-border)" }}>
            {/* Group status selector */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
                Group Status
              </label>
              <div className="flex gap-2 flex-wrap">
                {STATUS_OPTIONS.map(s => {
                  const meta = GROUP_STATUS_META[s];
                  const active = groupStatus === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setGroupStatus(s)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
                      style={{
                        backgroundColor: active ? meta.bg : "transparent",
                        borderColor: active ? meta.color : "var(--color-border)",
                        color: active ? meta.color : "var(--color-text-muted)",
                      }}
                    >
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <p className="text-xs" style={{ color: "var(--color-red)" }}>{error}</p>}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-white/5"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                Cancel
              </button>
              <button
                onClick={save}
                disabled={!canSave || saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--color-purple)", color: "#fff" }}
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                Add to Library
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
