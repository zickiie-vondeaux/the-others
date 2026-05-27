"use client";

import { Gamepad2, Film, Users, Trophy } from "lucide-react";

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

export function GroupStats({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard
        icon={<Gamepad2 size={18} />}
        label="Games"
        primary={stats.totalGames}
        sub={`${stats.gamesPlaying} playing · ${stats.gamesCompleted} done`}
        color="var(--color-cyan)"
        bg="rgba(6,182,212,0.08)"
      />
      <StatCard
        icon={<Film size={18} />}
        label="Movies"
        primary={stats.totalMovies}
        sub={`${stats.moviesWatched} watched`}
        color="var(--color-purple)"
        bg="rgba(139,92,246,0.08)"
      />
      <StatCard
        icon={<Users size={18} />}
        label="Members"
        primary={stats.activeMembers}
        sub={`of ${stats.totalMembers} total`}
        color="var(--color-green)"
        bg="rgba(16,185,129,0.08)"
      />
      <StatCard
        icon={<Trophy size={18} />}
        label="Most Active"
        primary={stats.topMember?.name ?? "—"}
        sub={stats.topMember ? `${stats.topMember.count} actions` : "no data yet"}
        color="var(--color-gold)"
        bg="rgba(251,191,36,0.08)"
        small
      />
    </div>
  );
}

function StatCard({
  icon, label, primary, sub, color, bg, small,
}: {
  icon: React.ReactNode;
  label: string;
  primary: number | string;
  sub: string;
  color: string;
  bg: string;
  small?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-2 p-4 rounded-xl"
      style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: bg, color }}>
          {icon}
        </div>
        <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{label}</span>
      </div>
      <div>
        <p className={`font-bold leading-none ${small ? "text-base" : "text-2xl"} truncate`} style={{ color: "var(--color-text-primary)" }}>
          {primary}
        </p>
        <p className="text-xs mt-1 leading-tight" style={{ color: "var(--color-text-muted)" }}>{sub}</p>
      </div>
    </div>
  );
}
