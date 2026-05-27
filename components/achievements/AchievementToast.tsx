"use client";

import { AnimatePresence, motion } from "framer-motion";
import { RARITY_COLOR, type Achievement } from "@/lib/achievements";

interface Props {
  achievements: Achievement[];
  onDismiss: (id: string) => void;
}

export function AchievementToastStack({ achievements, onDismiss }: Props) {
  return (
    <div className="fixed bottom-24 lg:bottom-6 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence>
        {achievements.map(a => {
          const style = RARITY_COLOR[a.rarity];
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg cursor-pointer"
              style={{
                backgroundColor: "var(--color-surface-elevated)",
                border: `1.5px solid ${style.border}`,
                boxShadow: `0 4px 24px ${style.bg}`,
                maxWidth: 280,
              }}
              onClick={() => onDismiss(a.id)}
            >
              <span className="text-2xl flex-shrink-0">{a.icon}</span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: style.color }}>
                  Achievement Unlocked
                </p>
                <p className="text-sm font-bold leading-tight" style={{ color: "var(--color-text-primary)" }}>
                  {a.name}
                </p>
                <p className="text-xs leading-tight mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {a.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
