"use client";

import { useState } from "react";
import { Gamepad2, Film, Users, Trophy, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Stats {
  totalGames: number;
  gamesPlaying: number;
  gamesCompleted: number;
  totalMovies: number;
  moviesWatched: number;
  activeMembers: number;
  totalMembers: number;
  topMember: { name: string; count: number } | null;
}

export interface QuickLookData {
  topGameGenres: string[];
  recentlyActiveGame: string | null;
  moviesWatchlist: number;
  recentlyWatchedMovie: string | null;
  mostActiveThisWeek: { name: string } | null;
  newestMember: { name: string; joinDate: string } | null;
}

export interface GroupStatsProps {
  stats: Stats;
  quickLook: QuickLookData;
}

type PanelKey = "games" | "movies" | "members" | "most-active";

// ── Helpers ───────────────────────────────────────────────────────────────────

function QLRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="flex items-center justify-between gap-2 py-0.5 border-b last:border-b-0"
      style={{ borderColor: "var(--color-border)" }}
    >
      <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>{label}</span>
      <span className="text-sm font-medium text-right" style={{ color: "var(--color-text-primary)" }}>{value}</span>
    </div>
  );
}

// ── GroupStats ────────────────────────────────────────────────────────────────

export function GroupStats({ stats, quickLook }: GroupStatsProps) {
  const [openPanel, setOpenPanel] = useState<PanelKey | null>(null);

  const toggle = (key: PanelKey) =>
    setOpenPanel(prev => (prev === key ? null : key));

  const panelContent: Record<PanelKey, React.ReactNode> = {
    games: (
      <>
        <QLRow label="Total games" value={stats.totalGames} />
        <QLRow label="Currently playing" value={stats.gamesPlaying} />
        <QLRow label="Completed" value={stats.gamesCompleted} />
        {quickLook.recentlyActiveGame && (
          <QLRow label="Recently active" value={quickLook.recentlyActiveGame} />
        )}
        {quickLook.topGameGenres.length > 0 && (
          <div className="flex items-center justify-between gap-2 pt-0.5 mt-0.5" style={{ borderTop: "1px solid var(--color-border)" }}>
            <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>Top genres</span>
            <div className="flex gap-1 flex-wrap justify-end">
              {quickLook.topGameGenres.map(g => (
                <span
                  key={g}
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: "rgba(6,182,212,0.15)", color: "var(--color-cyan)" }}
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}
      </>
    ),
    movies: (
      <>
        <QLRow label="Total movies" value={stats.totalMovies} />
        <QLRow label="Watched" value={stats.moviesWatched} />
        <QLRow label="On watchlist" value={quickLook.moviesWatchlist} />
        {quickLook.recentlyWatchedMovie && (
          <QLRow label="Last watched" value={quickLook.recentlyWatchedMovie} />
        )}
      </>
    ),
    members: (
      <>
        <QLRow label="Total members" value={stats.totalMembers} />
        {quickLook.mostActiveThisWeek && (
          <QLRow label="Most active this week" value={quickLook.mostActiveThisWeek.name} />
        )}
        {quickLook.newestMember && (
          <QLRow
            label="Newest member"
            value={`${quickLook.newestMember.name} · joined ${new Date(quickLook.newestMember.joinDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
          />
        )}
      </>
    ),
    "most-active": (
      <p className="text-sm text-center py-1" style={{ color: "var(--color-text-muted)" }}>
        This feature is coming soon
      </p>
    ),
  };

  const cards: { key: PanelKey; icon: React.ReactNode; label: string; primary: number | string; sub: string; color: string; bg: string; small?: boolean; disabled?: boolean }[] = [
    { key: "games", icon: <Gamepad2 size={30} />, label: "Games", primary: stats.totalGames, sub: `${stats.gamesPlaying} playing · ${stats.gamesCompleted} done`, color: "var(--color-cyan)", bg: "rgba(6,182,212,0.08)" },
    { key: "movies", icon: <Film size={30} />, label: "Movies", primary: stats.totalMovies, sub: `${stats.moviesWatched} watched`, color: "var(--color-purple)", bg: "rgba(139,92,246,0.08)" },
    { key: "members", icon: <Users size={30} />, label: "Members", primary: stats.activeMembers, sub: `of ${stats.totalMembers} total`, color: "var(--color-green)", bg: "rgba(16,185,129,0.08)" },
    { key: "most-active", icon: <Trophy size={30} />, label: "Most Active", primary: stats.topMember?.name ?? "—", sub: stats.topMember ? `${stats.topMember.count} actions` : "no data yet", color: "var(--color-gold)", bg: "rgba(251,191,36,0.08)", small: true, disabled: true },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-start">
      {cards.map(({ key, icon, label, primary, sub, color, bg, small, disabled }) => (
        <div key={key} className="flex flex-col gap-2">
          <StatCard
            icon={icon}
            label={label}
            primary={primary}
            sub={sub}
            color={color}
            bg={bg}
            small={small}
            disabled={disabled}
            onQuickLook={() => toggle(key)}
            quickLookActive={openPanel === key}
          />
          <AnimatePresence>
            {openPanel === key && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                <div
                  className="cyber-card rounded-xl p-2.5"
                  style={{ backgroundColor: "var(--color-surface)" }}
                >
                  {panelContent[key]}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({
  icon, label, primary, sub, color, bg, small,
  disabled, onQuickLook, quickLookActive,
}: {
  icon: React.ReactNode;
  label: string;
  primary: number | string;
  sub: string;
  color: string;
  bg: string;
  small?: boolean;
  disabled?: boolean;
  onQuickLook: () => void;
  quickLookActive?: boolean;
}) {
  return (
    <div
      role={disabled ? undefined : "button"}
      tabIndex={disabled ? undefined : 0}
      onClick={disabled ? undefined : onQuickLook}
      onKeyDown={disabled ? undefined : e => e.key === "Enter" && onQuickLook()}
      className="cyber-card rounded-xl p-4 flex flex-col justify-between min-h-[200px] overflow-hidden"
      style={{
        backgroundColor: "var(--color-surface)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.62 : 1,
        outline: "none",
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="rounded-lg p-1 flex-shrink-0" style={{ backgroundColor: bg, color }}>
          {icon}
        </div>
        <span className="font-semibold leading-tight truncate" style={{ fontSize: "clamp(0.875rem, 2.5vw, 1.875rem)", color: "var(--color-text-muted)" }}>{label}</span>
      </div>
      <div>
        <p
          className="font-bold leading-none truncate overflow-hidden"
          style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)", color: "var(--color-text-primary)" }}
        >
          {primary}
        </p>
        <p className="text-xs mt-1 leading-tight" style={{ color: "var(--color-text-muted)" }}>{sub}</p>
      </div>
      {!disabled && (
        <div className="flex justify-end">
          <ChevronDown
            size={20}
            style={{
              color: quickLookActive ? color : "var(--color-text-muted)",
              transform: quickLookActive ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </div>
      )}
    </div>
  );
}
