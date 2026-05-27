"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Check, Share2 } from "lucide-react";
import type { Quiz, QuizResult } from "@/lib/personality/types";
import type { AutoCalcResult } from "@/lib/personality/auto-calc";

type AnyResult = QuizResult | AutoCalcResult;

interface Props {
  quiz?: { name: string; icon: string; slug: string };
  result: AnyResult;
  isSaved?: boolean;
  onRetake?: () => void;
  onClose: () => void;
}

function isAutoCalcResult(r: AnyResult): r is AutoCalcResult {
  return "symbol" in r;
}

export function ResultReveal({ quiz, result, isSaved, onRetake, onClose }: Props) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 600);
    return () => clearTimeout(t);
  }, []);

  const symbol = isAutoCalcResult(result) ? result.symbol : undefined;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(
      `${quiz?.icon ?? ""} ${result.label} (${result.code}) — ${quiz?.name ?? "Personality"} \n"${result.description.slice(0, 120)}..."`
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          maxHeight: "90vh",
        }}
      >
        {/* Animated glow bg */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, var(--color-purple), transparent 70%)" }}
        />

        <div className="relative flex flex-col gap-6 p-8 overflow-y-auto">
          {/* Big result code */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="text-center flex flex-col items-center gap-3"
          >
            <div
              className="text-5xl font-black tracking-tight"
              style={{ color: "var(--color-purple)" }}
            >
              {symbol ?? result.code}
            </div>
            {symbol && (
              <div className="text-base font-bold" style={{ color: "var(--color-text-muted)" }}>
                {result.code}
              </div>
            )}
          </motion.div>

          {showContent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-5 text-center"
            >
              {/* Label + quiz tag */}
              <div className="flex flex-col items-center gap-1">
                <div className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {result.label}
                </div>
                {quiz && (
                  <div className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-surface-elevated)", color: "var(--color-text-muted)" }}>
                    {quiz.icon} {quiz.name}
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {result.description}
              </p>

              {/* Characters */}
              {result.characters.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                    Characters like you
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {result.characters.map(c => (
                      <span
                        key={c}
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: "rgba(139,92,246,0.12)", color: "var(--color-purple)", border: "1px solid rgba(139,92,246,0.2)" }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Saved indicator */}
              {isSaved && (
                <div className="flex items-center justify-center gap-1.5 text-xs" style={{ color: "var(--color-green)" }}>
                  <Check size={14} />
                  <span>Saved to your profile</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-center pt-2">
                {onRetake && (
                  <button
                    onClick={onRetake}
                    className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-opacity hover:opacity-70"
                    style={{ backgroundColor: "var(--color-surface-elevated)", color: "var(--color-text-muted)" }}
                  >
                    <RotateCcw size={14} /> Retake
                  </button>
                )}
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-opacity hover:opacity-70"
                  style={{ backgroundColor: "var(--color-surface-elevated)", color: "var(--color-text-muted)" }}
                >
                  <Share2 size={14} /> Share
                </button>
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 text-sm px-5 py-2 rounded-xl font-medium"
                  style={{ backgroundColor: "var(--color-purple)", color: "#fff" }}
                >
                  Done
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
