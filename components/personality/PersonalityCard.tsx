"use client";

import type { PersonalityResult } from "@/lib/supabase/types";
import { ALL_QUIZZES, AUTO_CALC_META, type AutoCalcSlug } from "@/lib/personality";
import { RotateCcw } from "lucide-react";

interface Props {
  result: PersonalityResult | null;
  slug: string;
  onTake: () => void;
  compact?: boolean;
}

function getMeta(slug: string): { name: string; shortName: string; icon: string } {
  const quiz = ALL_QUIZZES.find(q => q.slug === slug);
  if (quiz) return quiz;
  const auto = AUTO_CALC_META[slug as AutoCalcSlug];
  if (auto) return auto;
  return { name: slug, shortName: slug, icon: "?" };
}

export function PersonalityCard({ result, slug, onTake, compact }: Props) {
  const meta = getMeta(slug);

  if (!result) {
    return (
      <button
        onClick={onTake}
        className="flex flex-col items-center justify-center gap-2 rounded-xl p-4 text-center transition-all hover:scale-[1.02]"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1.5px dashed var(--color-border)",
          minHeight: compact ? 80 : 120,
        }}
      >
        {slug === "zodiac"
          ? <span className="text-2xl font-black" style={{ color: "var(--color-purple)", textShadow: "0 0 10px rgba(139,92,246,0.8), 0 0 20px rgba(139,92,246,0.4)" }}>?</span>
          : <span className="text-2xl">{meta.icon}</span>
        }
        <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
          {compact ? meta.shortName : meta.name}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(139,92,246,0.12)", color: "var(--color-purple)" }}>
          Take quiz
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onTake}
      className="group relative flex flex-col items-center justify-center gap-1.5 rounded-xl p-4 text-center transition-all hover:scale-[1.02]"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1.5px solid var(--color-border)",
        minHeight: compact ? 80 : 120,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(139,92,246,0.2)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.4)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
      }}
    >
      {slug === "zodiac" ? (
        <img
          src={`/${result.result_code}.svg`}
          alt={result.result_code}
          className={compact ? "w-7 h-7" : "w-10 h-10"}
          style={{ filter: "drop-shadow(0 0 6px rgba(139,92,246,0.55))" }}
        />
      ) : slug === "mbti" ? (
        <img
          src={`/MBTI%20icons/${result.result_code}.svg`}
          alt={result.result_code}
          className={compact ? "w-9 h-9" : "w-[72px] h-[72px]"}
          style={{ filter: "drop-shadow(0 0 6px rgba(139,92,246,0.45))" }}
        />
      ) : (
        <span className="text-xl">{meta.icon}</span>
      )}
      {slug !== "mbti" && (
        <div
          className="text-lg font-black tracking-tight"
          style={{ color: "var(--color-purple)" }}
        >
          {result.result_code}
        </div>
      )}
      {result.result_label && (
        <div
          className="text-xs font-medium leading-tight"
          style={{ color: slug === "mbti" ? "var(--color-purple)" : "var(--color-text-secondary)" }}
        >
          {result.result_label}
        </div>
      )}
      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        {compact ? meta.shortName : meta.name}
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <RotateCcw size={12} style={{ color: "var(--color-text-muted)" }} />
      </div>
    </button>
  );
}

// Avatar-sized chip for profile pages / group view
interface MemberChipProps {
  displayName: string;
  avatarUrl?: string | null;
  results: PersonalityResult[];
  slugs: string[];
}

export function MemberPersonalityChips({ displayName, avatarUrl, results, slugs }: MemberChipProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {avatarUrl
          ? <img src={avatarUrl} alt={displayName} className="w-7 h-7 rounded-full object-cover" />
          : <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "var(--color-surface-elevated)", color: "var(--color-purple)" }}>
              {displayName[0]?.toUpperCase()}
            </div>}
        <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{displayName}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 pl-9">
        {slugs.map(slug => {
          const r = results.find(x => x.test_slug === slug);
          const meta = getMeta(slug);
          if (!r) return (
            <span key={slug} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-surface-elevated)", color: "var(--color-text-muted)" }}>
              {slug === "zodiac"
                ? <span className="font-black text-[11px]" style={{ color: "var(--color-purple)", textShadow: "0 0 6px rgba(139,92,246,0.8)" }}>?</span>
                : meta.icon} —
            </span>
          );
          return (
            <span key={slug} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "rgba(139,92,246,0.12)", color: "var(--color-purple)", border: "1px solid rgba(139,92,246,0.2)" }}>
              {slug === "zodiac"
                ? <img src={`/${r.result_code}.svg`} alt={r.result_code} className="w-3.5 h-3.5" style={{ filter: "drop-shadow(0 0 3px rgba(139,92,246,0.7))" }} />
                : slug === "mbti"
                  ? <img src={`/MBTI%20icons/${r.result_code}.svg`} alt={r.result_code} className="w-3.5 h-3.5" style={{ filter: "drop-shadow(0 0 3px rgba(139,92,246,0.6))" }} />
                  : meta.icon} {r.result_code}
            </span>
          );
        })}
      </div>
    </div>
  );
}
