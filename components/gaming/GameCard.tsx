"use client";

import { Gamepad2, Trash2, Star, Check } from "lucide-react";
import type { Game } from "@/lib/supabase/types";

interface Props {
  game: Game;
  myRating: number | null;
  avgRating: number | null;
  ratingCount: number;
  onClick: () => void;
  onDelete?: () => void;
  selectMode?: boolean;
  isSelected?: boolean;
  onSelect?: (e: React.MouseEvent) => void;
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

export function GameCard({ game, myRating, avgRating, ratingCount, onClick, onDelete, selectMode, isSelected, onSelect }: Props) {
  return (
    <div
      role="button" tabIndex={0}
      onClick={selectMode ? onSelect : onClick}
      onKeyDown={e => e.key === "Enter" && (selectMode ? onSelect?.(e as unknown as React.MouseEvent) : onClick())}
      className="group relative rounded-xl border overflow-hidden text-left transition-all duration-200 hover:scale-[1.02] cursor-pointer"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: isSelected ? "var(--color-purple)" : "var(--color-border)",
        boxShadow: isSelected ? "0 0 20px rgba(124,58,237,0.35)" : "none",
      }}
      onMouseEnter={e => {
        if (isSelected) return;
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 20px rgba(124,58,237,0.25)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,58,237,0.5)";
      }}
      onMouseLeave={e => {
        if (isSelected) return;
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

        {/* Select checkbox */}
        {selectMode && (
          <div className="absolute top-2 left-2 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors"
            style={{
              backgroundColor: isSelected ? "var(--color-purple)" : "rgba(0,0,0,0.6)",
              borderColor: isSelected ? "var(--color-purple)" : "rgba(255,255,255,0.4)",
            }}>
            {isSelected && <Check size={12} color="white" strokeWidth={3} />}
          </div>
        )}

        {/* My rating badge */}
        {myRating !== null && !selectMode && (
          <div className="absolute top-2 right-2">
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(251,191,36,0.25)", color: "var(--color-gold)" }}>
              ★{myRating}
            </span>
          </div>
        )}

        {/* Multiplayer badge */}
        {game.is_multiplayer && !selectMode && (
          <div className="absolute bottom-2 right-2">
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: "rgba(6,182,212,0.2)", color: "var(--color-cyan)" }}>
              Co-op
            </span>
          </div>
        )}

        {/* Delete button */}
        {onDelete && !selectMode && (
          <button onClick={e => { e.stopPropagation(); onDelete(); }}
            className="absolute bottom-2 left-2 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: "rgba(0,0,0,0.75)", color: "#ef4444" }}
            aria-label="Remove game">
            <Trash2 size={18} />
          </button>
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
