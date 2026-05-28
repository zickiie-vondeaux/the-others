"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { OMDbSearchResult, NormalizedMovie } from "@/lib/omdb";
import { Search, X, Film, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { logActivity } from "@/lib/activity";
import { useAchievements } from "@/components/achievements/AchievementProvider";

interface Props {
  userId: string;
  onClose: () => void;
  onAdded: () => void;
}

type Tab = "search" | "manual";

export function AddMovieModal({ userId, onClose, onAdded }: Props) {
  const { triggerCheck } = useAchievements();
  const [tab, setTab] = useState<Tab>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OMDbSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selected, setSelected] = useState<NormalizedMovie | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [omdbAvailable, setOmdbAvailable] = useState(true);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [manual, setManual] = useState({
    title: "", release_year: "", genres: "", runtime: "", overview: "", director: "",
  });

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/omdb?s=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(Array.isArray(data) ? data : []);
          if (Array.isArray(data) && data.length === 0) setOmdbAvailable(false);
        }
      } catch { setOmdbAvailable(false); }
      finally { setSearching(false); }
    }, 400);
    return () => { if (searchRef.current) clearTimeout(searchRef.current); };
  }, [query]);

  async function selectResult(r: OMDbSearchResult) {
    setLoadingDetail(true);
    setResults([]);
    try {
      const res = await fetch(`/api/omdb?i=${r.imdbID}`);
      if (res.ok) {
        const detail: NormalizedMovie = await res.json();
        setSelected(detail ?? { omdb_id: r.imdbID, title: r.Title, poster_url: r.Poster !== "N/A" ? r.Poster : null, release_year: parseInt(r.Year) || null, genres: [], runtime_minutes: null, overview: null, director: null });
      }
    } catch { /* fall back to basic info */
      setSelected({ omdb_id: r.imdbID, title: r.Title, poster_url: r.Poster !== "N/A" ? r.Poster : null, release_year: parseInt(r.Year) || null, genres: [], runtime_minutes: null, overview: null, director: null });
    }
    setLoadingDetail(false);
  }

  async function save() {
    setError(""); setSaving(true);
    const supabase = createClient();
    let payload: Record<string, unknown>;

    if (tab === "search" && selected) {
      payload = { omdb_id: selected.omdb_id, title: selected.title, poster_url: selected.poster_url, release_year: selected.release_year, genres: selected.genres, runtime_minutes: selected.runtime_minutes, overview: selected.overview, director: selected.director, added_by: userId };
    } else {
      const title = manual.title.trim();
      if (!title) { setError("Title is required."); setSaving(false); return; }
      payload = { title, release_year: manual.release_year ? parseInt(manual.release_year) : null, genres: manual.genres ? manual.genres.split(",").map(s => s.trim()).filter(Boolean) : [], runtime_minutes: manual.runtime ? parseInt(manual.runtime) : null, overview: manual.overview.trim() || null, director: manual.director.trim() || null, added_by: userId };
    }

    const { error: err } = await supabase.from("movies").insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    logActivity({ type: "movie_added", entityType: "movie", entityTitle: (payload as any).title as string });
    triggerCheck();
    onAdded(); onClose();
  }

  const canSave = (tab === "search" && selected != null) || (tab === "manual" && manual.title.trim() !== "");

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
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Film size={20} style={{ color: "var(--color-cyan)" }} />
              <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Add a Movie</h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "var(--color-text-muted)" }}>
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-6 pb-4 flex-shrink-0">
            {(["search", "manual"] as Tab[]).map(t => (
              <button key={t} onClick={() => { setTab(t); setSelected(null); setError(""); }}
                className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-colors", tab === t ? "text-white" : "hover:bg-white/5")}
                style={tab === t ? { backgroundColor: "var(--color-cyan)", color: "#000" } : { color: "var(--color-text-secondary)" }}>
                {t === "search" ? "Search OMDb" : "Manual Entry"}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 pb-2">
            {tab === "search" ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
                  <input autoFocus value={query} onChange={e => { setQuery(e.target.value); setSelected(null); }}
                    placeholder="Search movies and series..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:border-cyan-500"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
                  {(searching || loadingDetail) && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin" style={{ color: "var(--color-text-muted)" }} />}
                </div>

                {!omdbAvailable && <p className="text-xs px-1" style={{ color: "var(--color-amber)" }}>OMDb API key not configured — use Manual Entry instead.</p>}

                {results.length > 0 && !selected && !loadingDetail && (
                  <div className="rounded-xl border divide-y overflow-hidden" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                    {results.map(r => (
                      <button key={r.imdbID} onClick={() => selectResult(r)}
                        className="flex items-center gap-3 w-full p-3 hover:bg-white/5 transition-colors text-left">
                        {r.Poster && r.Poster !== "N/A"
                          ? <img src={r.Poster} alt={r.Title} className="w-8 h-12 object-cover rounded flex-shrink-0" />
                          : <div className="w-8 h-12 rounded flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: "var(--color-surface-elevated)" }}><Film size={14} style={{ color: "var(--color-text-muted)" }} /></div>}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{r.Title}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{r.Year} · {r.Type}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selected && (
                  <div className="rounded-xl border p-4 flex gap-4" style={{ borderColor: "var(--color-cyan)", backgroundColor: "rgba(6,182,212,0.06)" }}>
                    {selected.poster_url
                      ? <img src={selected.poster_url} alt={selected.title} className="w-16 rounded-lg flex-shrink-0 object-cover shadow-md" style={{ height: "96px" }} />
                      : <div className="w-16 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: "var(--color-surface)", height: "96px" }}><Film size={20} style={{ color: "var(--color-text-muted)" }} /></div>}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{selected.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                        {[selected.release_year, selected.genres.slice(0, 2).join(", ")].filter(Boolean).join(" · ")}
                      </p>
                      {selected.director && <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Dir. {selected.director}</p>}
                      {selected.runtime_minutes && <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{selected.runtime_minutes} min</p>}
                    </div>
                    <button onClick={() => { setSelected(null); setQuery(""); }} className="self-start p-1 rounded-md hover:bg-white/10 flex-shrink-0" style={{ color: "var(--color-text-muted)" }}><X size={14} /></button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Title <span style={{ color: "var(--color-red)" }}>*</span></label>
                  <input autoFocus value={manual.title} onChange={e => setManual(m => ({ ...m, title: e.target.value }))} placeholder="e.g. Parasite"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:border-cyan-500"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Year</label>
                    <input type="number" value={manual.release_year} onChange={e => setManual(m => ({ ...m, release_year: e.target.value }))} placeholder="2024"
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Runtime (min)</label>
                    <input type="number" value={manual.runtime} onChange={e => setManual(m => ({ ...m, runtime: e.target.value }))} placeholder="120"
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Genres (comma-separated)</label>
                  <input value={manual.genres} onChange={e => setManual(m => ({ ...m, genres: e.target.value }))} placeholder="Horror, Comedy"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Director</label>
                  <input value={manual.director} onChange={e => setManual(m => ({ ...m, director: e.target.value }))} placeholder="e.g. Bong Joon-ho"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Overview</label>
                  <textarea rows={2} value={manual.overview} onChange={e => setManual(m => ({ ...m, overview: e.target.value }))} placeholder="Short description..."
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                    style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }} />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pt-4 pb-6 flex-shrink-0 space-y-4 border-t" style={{ borderColor: "var(--color-border)" }}>
            {error && <p className="text-xs" style={{ color: "var(--color-red)" }}>{error}</p>}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium hover:bg-white/5"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>Cancel</button>
              <button onClick={save} disabled={!canSave || saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--color-cyan)", color: "#000" }}>
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
