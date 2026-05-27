"use client";

import { useState } from "react";
import { RARITY_COLOR, type Achievement } from "@/lib/achievements";

interface BadgeProps {
  achievement: Achievement;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

export function AchievementBadge({ achievement, size = "md", showTooltip = true }: BadgeProps) {
  const [tip, setTip] = useState(false);
  const style = RARITY_COLOR[achievement.rarity];
  const dim = size === "sm" ? "w-9 h-9 text-lg" : size === "lg" ? "w-14 h-14 text-3xl" : "w-11 h-11 text-xl";

  return (
    <div className="relative flex-shrink-0">
      <div
        className={`${dim} rounded-xl flex items-center justify-center cursor-default`}
        style={{ backgroundColor: style.bg, border: `1.5px solid ${style.border}` }}
        onMouseEnter={() => showTooltip && setTip(true)}
        onMouseLeave={() => setTip(false)}
      >
        {achievement.icon}
      </div>
      {tip && (
        <div
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap max-w-[200px] text-center"
          style={{
            backgroundColor: "var(--color-surface-elevated)",
            border: `1px solid ${style.border}`,
            pointerEvents: "none",
          }}
        >
          <p className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>{achievement.name}</p>
          <p className="text-[10px] mt-0.5 whitespace-normal" style={{ color: "var(--color-text-muted)" }}>{achievement.description}</p>
          <p className="text-[10px] mt-0.5 capitalize font-medium" style={{ color: style.color }}>{achievement.rarity}</p>
        </div>
      )}
    </div>
  );
}

interface GridProps {
  earned: Achievement[];
  locked: Achievement[];
}

export function AchievementGrid({ earned, locked }: GridProps) {
  return (
    <div className="flex flex-col gap-4">
      {earned.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
            Earned · {earned.length}
          </p>
          <div className="flex flex-wrap gap-2">
            {earned.map(a => <AchievementBadge key={a.id} achievement={a} />)}
          </div>
        </div>
      )}
      {locked.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
            Locked · {locked.length}
          </p>
          <div className="flex flex-wrap gap-2">
            {locked.map(a => (
              <div
                key={a.id}
                className="relative w-11 h-11 rounded-xl flex items-center justify-center text-xl grayscale opacity-30 cursor-default"
                style={{ backgroundColor: "var(--color-surface-elevated)", border: "1.5px solid var(--color-border)" }}
                title={a.name}
              >
                {a.icon}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
