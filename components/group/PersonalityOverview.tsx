"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { PersonalityResult } from "@/lib/supabase/types";
import { ALL_QUIZZES } from "@/lib/personality";

interface Props {
  results: PersonalityResult[];
  totalMembers: number;
}

const PALETTE = [
  "var(--color-purple)", "var(--color-cyan)", "var(--color-green)",
  "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#10b981",
  "#f97316", "#ec4899", "#6366f1", "#14b8a6", "#84cc16",
  "#a855f7", "#3b82f6", "#e11d48",
];

export function PersonalityOverview({ results, totalMembers }: Props) {
  const [open, setOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState(ALL_QUIZZES[0].slug);

  const quiz = ALL_QUIZZES.find(q => q.slug === activeSlug);
  const quizResults = results.filter(r => r.test_slug === activeSlug);
  const participantCount = new Set(quizResults.map(r => r.user_id)).size;

  // Aggregate result_code counts
  const counts: Record<string, number> = {};
  quizResults.forEach(r => { counts[r.result_code] = (counts[r.result_code] ?? 0) + 1; });
  const chartData = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([code, count], i) => ({
      code,
      count,
      label: results.find(r => r.test_slug === activeSlug && r.result_code === code)?.result_label ?? code,
      fill: PALETTE[i % PALETTE.length],
    }));

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Personality Overview
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(139,92,246,0.12)", color: "var(--color-purple)" }}>
            {participantCount}/{totalMembers} members
          </span>
        </div>
        {open ? <ChevronUp size={16} style={{ color: "var(--color-text-muted)" }} /> : <ChevronDown size={16} style={{ color: "var(--color-text-muted)" }} />}
      </button>

      {open && (
        <div className="px-5 pb-5 flex flex-col gap-4">
          {/* Quiz selector tabs */}
          <div className="flex gap-2 flex-wrap">
            {ALL_QUIZZES.map(q => (
              <button
                key={q.slug}
                onClick={() => setActiveSlug(q.slug)}
                className="text-xs px-3 py-1 rounded-full transition-all font-medium"
                style={{
                  backgroundColor: activeSlug === q.slug ? "var(--color-purple)" : "var(--color-surface-elevated)",
                  color: activeSlug === q.slug ? "#fff" : "var(--color-text-muted)",
                  border: `1px solid ${activeSlug === q.slug ? "var(--color-purple)" : "var(--color-border)"}`,
                }}
              >
                {q.icon} {q.shortName}
              </button>
            ))}
          </div>

          {chartData.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm" style={{ color: "var(--color-text-muted)" }}>
              No results yet — be the first to take the {quiz?.name} quiz.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="code"
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{
                      backgroundColor: "var(--color-surface-elevated)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      color: "var(--color-text-primary)",
                      fontSize: 12,
                    }}
                    formatter={(value, _: unknown, entry: any) => [
                      `${Number(value)} member${Number(value) !== 1 ? "s" : ""}`,
                      entry.payload.label,
                    ]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {chartData.map((entry, i) => (
                      <Cell key={entry.code} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex flex-wrap gap-2">
                {chartData.map(d => (
                  <div key={d.code} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.fill }} />
                    <span><strong style={{ color: "var(--color-text-secondary)" }}>{d.code}</strong> {d.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
