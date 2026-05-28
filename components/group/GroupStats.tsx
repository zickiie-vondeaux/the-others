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
      className="flex items-center justify-between gap-4 py-1.5 border-b last:border-b-0"
      style={{ borderColor: "var(--color-border)" }}
    >
      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</span>
      <span className="text-xs font-medium text-right" style={{ color: "var(--color-text-primary)" }}>{value}</span>
    </div>
  );
}

// ── GroupStats ────────────────────────────────────────────────────────────────

export function GroupStats({ stats, quickLook }: GroupStatsProps) {
  const [openPanel, setOpenPanel] = useState<PanelKey | null>(null);

  const toggle = (key: PanelKey) =>
    setOpenPanel(prev => (prev === key ? null : key));

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Gamepad2 size={18} />}
          label="Games"
          primary={stats.totalGames}
          sub={`${stats.gamesPlaying} playing · ${stats.gamesCompleted} done`}
          color="var(--color-cyan)"
          bg="rgba(6,182,212,0.08)"
          onQuickLook={() => toggle("games")}
          quickLookActive={openPanel === "games"}
        />
        <StatCard
          icon={<Film size={18} />}
          label="Movies"
          primary={stats.totalMovies}
          sub={`${stats.moviesWatched} watched`}
          color="var(--color-purple)"
          bg="rgba(139,92,246,0.08)"
          onQuickLook={() => toggle("movies")}
          quickLookActive={openPanel === "movies"}
        />
        <StatCard
          icon={<Users size={18} />}
          label="Members"
          primary={stats.activeMembers}
          sub={`of ${stats.totalMembers} total`}
          color="var(--color-green)"
          bg="rgba(16,185,129,0.08)"
          onQuickLook={() => toggle("members")}
          quickLookActive={openPanel === "members"}
        />
        <StatCard
          icon={<Trophy size={18} />}
          label="Most Active"
          primary={stats.topMember?.name ?? "—"}
          sub={stats.topMember ? `${stats.topMember.count} actions` : "no data yet"}
          color="var(--color-gold)"
          bg="rgba(251,191,36,0.08)"
          small
          disabled
          onQuickLook={() => toggle("most-active")}
          quickLookActive={openPanel === "most-active"}
        />
      </div>

      {/* Inline QuickLook panel */}
      <AnimatePresence mode="wait">
        {openPanel && (
          <motion.div
            key={openPanel}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="cyber-card rounded-xl p-4"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              {openPanel === "games" && (
                <>
                  <QLRow label="Total games" value={stats.totalGames} />
                  <QLRow label="Currently playing" value={stats.gamesPlaying} />
                  <QLRow label="Completed" value={stats.gamesCompleted} />
                  {quickLook.recentlyActiveGame && (
                    <QLRow label="Recently active" value={quickLook.recentlyActiveGame} />
                  )}
                  {quickLook.topGameGenres.length > 0 && (
                    <div className="flex items-center justify-between gap-4 pt-1.5 mt-0.5" style={{ borderTop: "1px solid var(--color-border)" }}>
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Top genres</span>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {quickLook.topGameGenres.map(g => (
                          <span
                            key={g}
                            className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: "rgba(6,182,212,0.15)", color: "var(--color-cyan)" }}
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {openPanel === "movies" && (
                <>
                  <QLRow label="Total movies" value={stats.totalMovies} />
                  <QLRow label="Watched" value={stats.moviesWatched} />
                  <QLRow label="On watchlist" value={quickLook.moviesWatchlist} />
                  {quickLook.recentlyWatchedMovie && (
                    <QLRow label="Last watched" value={quickLook.recentlyWatchedMovie} />
                  )}
                </>
              )}

              {openPanel === "members" && (
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
              )}

              {openPanel === "most-active" && (
                <p className="text-xs text-center py-1" style={{ color: "var(--color-text-muted)" }}>
                  This feature is coming soon
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
      className="cyber-card rounded-xl p-4 flex flex-col gap-2"
      style={{
        backgroundColor: "var(--color-surface)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.62 : 1,
        outline: "none",
      }}
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: bg, color }}>
          {icon}
        </div>
        <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{label}</span>
      </div>
      <div>
        <p
          className={`font-bold leading-none ${small ? "text-base" : "text-2xl"} truncate`}
          style={{ color: "var(--color-text-primary)" }}
        >
          {primary}
        </p>
        <p className="text-xs mt-1 leading-tight" style={{ color: "var(--color-text-muted)" }}>{sub}</p>
      </div>
      {!disabled && (
        <div className="flex justify-end">
          <ChevronDown
            size={12}
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
