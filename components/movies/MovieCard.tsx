"use client";

import { Film, Users, Star, Clock, Trash2 } from "lucide-react";
import { GROUP_MOVIE_STATUS_META, type Movie, type PersonalMovieStatus } from "@/lib/supabase/types";

interface Props {
  movie: Movie;
  myStatus: PersonalMovieStatus | null;
  watchedCount: number;
  wantCount: number;
  totalMembers: number;
  onClick: () => void;
  onDelete?: () => void;
}

export function MovieCard({ movie, myStatus, watchedCount, wantCount, totalMembers, onClick, onDelete }: Props) {
  const statusMeta = GROUP_MOVIE_STATUS_META[movie.group_status];

  return (
    <button
      onClick={onClick}
      className="group relative rounded-xl border overflow-hidden text-left transition-all duration-200 hover:scale-[1.02]"
      style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(6,182,212,0.2)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(6,182,212,0.4)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
      }}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden" style={{ backgroundColor: "var(--color-surface-elevated)" }}>
        {movie.poster_url
          ? <img src={movie.poster_url} alt={movie.title} referrerPolicy="no-referrer" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          : <div className="w-full h-full flex items-center justify-center"><Film size={36} style={{ color: "var(--color-text-muted)" }} /></div>}

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="absolute bottom-2 left-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#ef4444" }}
            aria-label="Remove movie"
          >
            <Trash2 size={12} />
          </button>
        )}

        <div className="absolute top-2 left-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: statusMeta.bg, color: statusMeta.color }}>
            {statusMeta.label}
          </span>
        </div>

        {myStatus === "watched" && <div className="absolute top-2 right-2"><span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(16,185,129,0.2)", color: "var(--color-green)" }}>✅</span></div>}
        {myStatus === "want_to_watch" && <div className="absolute top-2 right-2"><span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(251,191,36,0.2)", color: "var(--color-gold)" }}>⭐</span></div>}
        {myStatus === "watching" && <div className="absolute top-2 right-2"><span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(6,182,212,0.2)", color: "var(--color-cyan)" }}>👀</span></div>}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-semibold text-sm leading-tight truncate" style={{ color: "var(--color-text-primary)" }}>{movie.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {movie.release_year && <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{movie.release_year}</p>}
          {movie.runtime_minutes && (
            <p className="text-xs flex items-center gap-0.5" style={{ color: "var(--color-text-muted)" }}>
              <Clock size={9} /> {movie.runtime_minutes}m
            </p>
          )}
        </div>

        {movie.genres.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {movie.genres.slice(0, 2).map(g => (
              <span key={g} className="text-xs px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "var(--color-surface-elevated)", color: "var(--color-text-muted)" }}>{g}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-2.5 pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <Users size={11} /><span>{watchedCount}/{totalMembers}</span>
          </div>
          {wantCount > 0 && (
            <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-gold)" }}>
              <Star size={11} /><span>{wantCount}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
