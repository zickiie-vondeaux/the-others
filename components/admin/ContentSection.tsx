"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Trash2, CheckCircle, Flag, Film, Gamepad2, Star, MessageSquare } from "lucide-react";

type TabId = "flagged" | "all";

interface FlagRow {
  id: string;
  content_type: string;
  content_id: string;
  reason: string | null;
  status: "pending" | "dismissed" | "actioned";
  reported_at: string;
  reporter: { display_name: string; username: string } | null;
}

interface GameRow    { id: string; title: string; cover_url: string | null; created_at: string; profiles: { display_name: string } | null }
interface MovieRow   { id: string; title: string; poster_url: string | null; created_at: string; profiles: { display_name: string } | null }
interface ReviewRow  { id: string; rating: number; review_text: string | null; created_at: string; user_id: string;
  game_id?: string; movie_id?: string;
  games?: { title: string } | null; movies?: { title: string } | null;
  profiles: { display_name: string } | null }

const STATUS_COLOR: Record<string, string> = {
  pending:   "#BA7517",
  dismissed: "#888780",
  actioned:  "#D4537E",
};

const CONTENT_ICONS: Record<string, React.ElementType> = {
  game:         Gamepad2,
  movie:        Film,
  game_review:  Star,
  movie_review: MessageSquare,
};

export function ContentSection() {
  const [tab, setTab]         = useState<TabId>("flagged");
  const [flags, setFlags]     = useState<FlagRow[]>([]);
  const [allContent, setAll]  = useState<{ games: GameRow[]; movies: MovieRow[]; gReviews: ReviewRow[]; mReviews: ReviewRow[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/content?tab=${tab}`);
    const data = await res.json();
    if (tab === "flagged") setFlags(Array.isArray(data) ? data : []);
    else setAll(data);
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function deleteItem(type: string, id: string) {
    if (!confirm(`Delete this ${type}?`)) return;
    setActing(id);
    await fetch(`/api/admin/content?type=${type}&id=${id}`, { method: "DELETE" });
    await load();
    setActing(null);
  }

  async function updateFlag(flagId: string, newStatus: "dismissed" | "actioned") {
    setActing(flagId);
    await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flag_id: flagId, new_status: newStatus }),
    });
    setFlags(prev => prev.map(f => f.id === flagId ? { ...f, status: newStatus } : f));
    setActing(null);
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--color-surface)" }}>
        {(["flagged", "all"] as TabId[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors capitalize"
            style={{
              backgroundColor: tab === t ? "var(--color-surface-elevated)" : "transparent",
              color: tab === t ? "var(--color-text-primary)" : "var(--color-text-muted)",
            }}>
            {t === "flagged" ? "Flagged Content" : "All Content"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin" style={{ color: "var(--color-text-muted)" }} /></div>
      ) : tab === "flagged" ? (
        flags.length === 0 ? (
          <div className="py-10 text-center">
            <CheckCircle size={28} className="mx-auto mb-2" style={{ color: "var(--color-text-muted)", opacity: 0.4 }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No flagged content.</p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: "480px" }}>
            {flags.map(f => {
              const Icon = CONTENT_ICONS[f.content_type] ?? Flag;
              return (
                <div key={f.id} className="flex items-start gap-3 p-3 rounded-xl border"
                  style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                  <Icon size={16} className="mt-0.5 shrink-0" style={{ color: "var(--color-text-muted)" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                        {f.content_type.replace("_", " ")}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: `${STATUS_COLOR[f.status]}20`, color: STATUS_COLOR[f.status] }}>
                        {f.status}
                      </span>
                    </div>
                    {f.reason && <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>{f.reason}</p>}
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      Reported by {f.reporter?.display_name ?? "Unknown"} · {new Date(f.reported_at).toLocaleDateString()}
                    </p>
                  </div>
                  {f.status === "pending" && (
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => updateFlag(f.id, "dismissed")} disabled={acting === f.id}
                        className="px-2 py-1 rounded-lg text-xs font-medium disabled:opacity-50"
                        style={{ backgroundColor: "rgba(136,135,128,0.2)", color: "#888780" }}>
                        Dismiss
                      </button>
                      <button onClick={() => deleteItem(f.content_type, f.content_id)} disabled={acting === f.id}
                        className="px-2 py-1 rounded-lg text-xs font-medium disabled:opacity-50"
                        style={{ backgroundColor: "rgba(212,83,126,0.15)", color: "#D4537E" }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="space-y-4 overflow-y-auto" style={{ maxHeight: "480px" }}>
          {/* Games */}
          <ContentGroup label="Games" icon={Gamepad2} items={(allContent?.games ?? []).map(g => ({
            id: g.id, type: "game",
            title: g.title, subtitle: `Added by ${g.profiles?.display_name ?? "?"}`,
            date: g.created_at, thumb: g.cover_url,
          }))} onDelete={deleteItem} acting={acting} />
          {/* Movies */}
          <ContentGroup label="Movies" icon={Film} items={(allContent?.movies ?? []).map(m => ({
            id: m.id, type: "movie",
            title: m.title, subtitle: `Added by ${m.profiles?.display_name ?? "?"}`,
            date: m.created_at, thumb: m.poster_url,
          }))} onDelete={deleteItem} acting={acting} />
          {/* Game reviews */}
          <ContentGroup label="Game Reviews" icon={Star} items={(allContent?.gReviews ?? []).map(r => ({
            id: r.id, type: "game_review",
            title: r.games?.title ?? "Game Review",
            subtitle: `${r.rating}★ by ${r.profiles?.display_name ?? "?"}${r.review_text ? ` — "${r.review_text.slice(0, 40)}…"` : ""}`,
            date: r.created_at,
          }))} onDelete={deleteItem} acting={acting} />
          {/* Movie reviews */}
          <ContentGroup label="Movie Reviews" icon={MessageSquare} items={(allContent?.mReviews ?? []).map(r => ({
            id: r.id, type: "movie_review",
            title: r.movies?.title ?? "Movie Review",
            subtitle: `${r.rating}★ by ${r.profiles?.display_name ?? "?"}${r.review_text ? ` — "${r.review_text.slice(0, 40)}…"` : ""}`,
            date: r.created_at,
          }))} onDelete={deleteItem} acting={acting} />
        </div>
      )}
    </div>
  );
}

function ContentGroup({ label, icon: Icon, items, onDelete, acting }: {
  label: string;
  icon: React.ElementType;
  items: { id: string; type: string; title: string; subtitle: string; date: string; thumb?: string | null }[];
  onDelete: (type: string, id: string) => void;
  acting: string | null;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} style={{ color: "var(--color-text-muted)" }} />
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>{label}</span>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>({items.length})</span>
      </div>
      <div className="space-y-1">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border"
            style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            {item.thumb && (
              <img src={item.thumb} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{item.title}</p>
              <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{item.subtitle}</p>
            </div>
            <span className="text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>
              {new Date(item.date).toLocaleDateString()}
            </span>
            <button onClick={() => onDelete(item.type, item.id)} disabled={acting === item.id}
              className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-50 transition-colors"
              style={{ color: "#D4537E" }}>
              {acting === item.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
