"use client";

import { Gamepad2, Users, Star, Trash2 } from "lucide-react";
import { GROUP_STATUS_META, type Game, type PersonalGameStatus } from "@/lib/supabase/types";

interface Props {
  game: Game;
  myStatus: PersonalGameStatus | null;
  playedCount: number;
  wantCount: number;
  totalMembers: number;
  onClick: () => void;
  onDelete?: () => void;
}

export function GameCard({ game, myStatus, playedCount, wantCount, totalMembers, onClick, onDelete }: Props) {
  const statusMeta = GROUP_STATUS_META[game.group_status];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => e.key === "Enter" && onClick()}
      className="group relative rounded-xl border overflow-hidden text-left transition-all duration-200 hover:scale-[1.02] cursor-pointer"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
        boxShadow: "none",
      }}
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
          : <div className="w-full h-full flex items-center justify-center">
              <Gamepad2 size={36} style={{ color: "var(--color-text-muted)" }} />
            </div>
        }

        {/* Group status badge */}
        <div className="absolute top-2 left-2">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: statusMeta.bg, color: statusMeta.color }}
          >
            {statusMeta.label}
          </span>
        </div>

        {/* My status badge */}
        {myStatus === "want_to_play" && (
          <div className="absolute top-2 right-2">
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(251,191,36,0.2)", color: "var(--color-gold)" }}>⭐</span>
          </div>
        )}
        {myStatus === "playing_solo" && (
          <div className="absolute top-2 right-2">
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(6,182,212,0.2)", color: "var(--color-cyan)" }}>🎮</span>
          </div>
        )}
        {myStatus === "playing_multiplayer" && (
          <div className="absolute top-2 right-2">
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(6,182,212,0.2)", color: "var(--color-cyan)" }}>👾</span>
          </div>
        )}
        {myStatus === "completed" && (
          <div className="absolute top-2 right-2">
            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(16,185,129,0.2)", color: "var(--color-green)" }}>✅</span>
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

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="absolute bottom-2 left-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#ef4444" }}
            aria-label="Remove game"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-semibold text-sm leading-tight truncate" style={{ color: "var(--color-text-primary)" }}>
          {game.title}
        </p>
        {game.release_year && (
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{game.release_year}</p>
        )}

        {/* Genre tags */}
        {game.genres.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {game.genres.slice(0, 2).map(g => (
              <span key={g} className="text-xs px-1.5 py-0.5 rounded-md"
                style={{ backgroundColor: "var(--color-surface-elevated)", color: "var(--color-text-muted)" }}>
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Group progress */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <Users size={11} />
            <span>{playedCount}/{totalMembers}</span>
          </div>
          {wantCount > 0 && (
            <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-gold)" }}>
              <Star size={11} />
              <span>{wantCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
