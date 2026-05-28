"use client";

import { useState } from "react";
import { Gamepad2, Trash2, Star } from "lucide-react";
import type { Game } from "@/lib/supabase/types";

interface Props {
  game: Game;
  myRating: number | null;
  avgRating: number | null;
  ratingCount: number;
  onClick: () => void;
  onDelete?: () => void;
}

function StarRow({ value, size = 11 }: { value: number; size?: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={size}
          fill={s <= Math.round(value) ? "currentColor" : "none"}
          style={{ color: s <= Math.round(value) ? "var(--color-gold)" : "var(--color-border)" }}
        />
      ))}
    </span>
  );
}

export function GameCard({ game, myRating, avgRating, ratingCount, onClick, onDelete }: Props) {
  const [pendingDelete, setPendingDelete] = useState(false);

  return (
    <div
      role="button" tabIndex={0}
      onClick={onClick}
      onKeyDown={e => e.key === "Enter" && onClick()}
      className="group relative rounded-xl border overflow-hidden text-left transition-all duration-200 hover:scale-[1.02] cursor-pointer"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "none" }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 20px rgba(124,58,237,0.25)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,58,237,0.5)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)";
      }}
    >
      {/* Cover art */}
      <div className="relative aspect-[3/4] overflow-hidden" style={{ backgroundColor: "var(--color-surface-elevated)" }}>
        {game.cover_url
          ? <img src={game.cover_url} alt={game.title} referrerPolicy="no-referrer" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          : <div className="w-full h-full flex items-center justify-center"><Gamepad2 size={36} style={{ color: "var(--color-text-muted)" }} /></div>
        }

        {/* My rating badge */}
        {myRating !== null && (
          <div className="absolute top-2 right-2">
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(251,191,36,0.25)", color: "var(--color-gold)" }}>
              ★{myRating}
            </span>
          </div>
        )}

        {/* Multiplayer badge */}
        {game.is_multiplayer && (
          <div className="absolute bottom-2 right-2">
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: "rgba(6,182,212,0.2)", color: "var(--color-cyan)" }}>
              Co-op
            </span>
          </div>
        )}

        {/* Delete button / confirmation */}
        {onDelete && (
          pendingDelete ? (
            <div className="absolute inset-x-0 bottom-0 flex gap-1.5 p-2"
              style={{ backgroundColor: "rgba(0,0,0,0.88)" }}
              onClick={e => e.stopPropagation()}>
              <button onClick={e => { e.stopPropagation(); setPendingDelete(false); }}
                className="flex-1 py-1 rounded-md text-xs font-medium transition-colors hover:bg-white/10"
                style={{ color: "var(--color-text-secondary)" }}>
                Cancel
              </button>
              <button onClick={e => { e.stopPropagation(); onDelete(); }}
                className="flex-1 py-1 rounded-md text-xs font-semibold"
                style={{ backgroundColor: "#ef4444", color: "#fff" }}>
                Remove
              </button>
            </div>
          ) : (
            <button onClick={e => { e.stopPropagation(); setPendingDelete(true); }}
              className="absolute bottom-2 left-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: "rgba(0,0,0,0.7)", color: "#ef4444" }}
              aria-label="Remove game">
              <Trash2 size={12} />
            </button>
          )
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-semibold text-sm leading-tight truncate" style={{ color: "var(--color-text-primary)" }}>{game.title}</p>
        {game.release_year && <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{game.release_year}</p>}

        {game.genres.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {game.genres.slice(0, 2).map(g => (
              <span key={g} className="text-xs px-1.5 py-0.5 rounded-md"
                style={{ backgroundColor: "var(--color-surface-elevated)", color: "var(--color-text-muted)" }}>{g}</span>
            ))}
          </div>
        )}

        {/* Rating row */}
        <div className="mt-2.5 pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
          {avgRating !== null ? (
            <div className="flex items-center gap-1.5">
              <StarRow value={avgRating} />
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {avgRating.toFixed(1)} ({ratingCount})
              </span>
            </div>
          ) : (
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>No ratings yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
