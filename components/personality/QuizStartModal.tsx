"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, ClipboardList, Pencil } from "lucide-react";
import type { Quiz } from "@/lib/personality/types";

interface Props {
  quiz: Quiz;
  onTakeTest: () => void;
  onEnterResult: (code: string, label: string) => void;
  onClose: () => void;
}

const QUIZ_OPTIONS: Record<string, { code: string; label: string }[]> = {
  mbti: [
    { code: "INTJ", label: "INTJ — The Architect" },
    { code: "INTP", label: "INTP — The Logician" },
    { code: "ENTJ", label: "ENTJ — The Commander" },
    { code: "ENTP", label: "ENTP — The Debater" },
    { code: "INFJ", label: "INFJ — The Advocate" },
    { code: "INFP", label: "INFP — The Mediator" },
    { code: "ENFJ", label: "ENFJ — The Protagonist" },
    { code: "ENFP", label: "ENFP — The Campaigner" },
    { code: "ISTJ", label: "ISTJ — The Logistician" },
    { code: "ISFJ", label: "ISFJ — The Defender" },
    { code: "ESTJ", label: "ESTJ — The Executive" },
    { code: "ESFJ", label: "ESFJ — The Consul" },
    { code: "ISTP", label: "ISTP — The Virtuoso" },
    { code: "ISFP", label: "ISFP — The Adventurer" },
    { code: "ESTP", label: "ESTP — The Entrepreneur" },
    { code: "ESFP", label: "ESFP — The Entertainer" },
  ],
  enneagram: [
    { code: "1", label: "Type 1 — The Reformer" },
    { code: "2", label: "Type 2 — The Helper" },
    { code: "3", label: "Type 3 — The Achiever" },
    { code: "4", label: "Type 4 — The Individualist" },
    { code: "5", label: "Type 5 — The Investigator" },
    { code: "6", label: "Type 6 — The Loyalist" },
    { code: "7", label: "Type 7 — The Enthusiast" },
    { code: "8", label: "Type 8 — The Challenger" },
    { code: "9", label: "Type 9 — The Peacemaker" },
  ],
  big_five: [
    { code: "The Visionary Architect", label: "The Visionary Architect" },
    { code: "The Creative Connector",  label: "The Creative Connector" },
    { code: "The Natural Leader",      label: "The Natural Leader" },
    { code: "The Passionate Performer",label: "The Passionate Performer" },
    { code: "The Turbulent Thinker",   label: "The Turbulent Thinker" },
    { code: "The Dependable Guardian", label: "The Dependable Guardian" },
    { code: "The Deep Observer",       label: "The Deep Observer" },
    { code: "The Strategic Operator",  label: "The Strategic Operator" },
    { code: "The Explorer",            label: "The Explorer" },
    { code: "The Architect",           label: "The Architect" },
    { code: "The Connector",           label: "The Connector" },
    { code: "The Empath",              label: "The Empath" },
    { code: "The Sensitive",           label: "The Sensitive" },
  ],
  love_languages: [
    { code: "W", label: "Words of Affirmation" },
    { code: "S", label: "Acts of Service" },
    { code: "G", label: "Receiving Gifts" },
    { code: "Q", label: "Quality Time" },
    { code: "T", label: "Physical Touch" },
  ],
  attachment: [
    { code: "SEC", label: "Secure" },
    { code: "ANX", label: "Anxious (Preoccupied)" },
    { code: "AVD", label: "Avoidant (Dismissive)" },
    { code: "FEA", label: "Fearful-Avoidant (Disorganized)" },
  ],
  disc: [
    { code: "D", label: "D — Dominance" },
    { code: "I", label: "I — Influence" },
    { code: "S", label: "S — Steadiness" },
    { code: "C", label: "C — Conscientiousness" },
  ],
};

export function QuizStartModal({ quiz, onTakeTest, onEnterResult, onClose }: Props) {
  const [mode, setMode] = useState<"choose" | "enter">("choose");
  const [selected, setSelected] = useState("");

  const options = QUIZ_OPTIONS[quiz.slug] ?? [];
  const selectedOption = options.find(o => o.code === selected);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        className="relative w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:opacity-70 transition-opacity"
          style={{ color: "var(--color-text-muted)" }}
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-3xl">{quiz.icon}</span>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{quiz.name}</h2>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{quiz.questionCount} questions</p>
        </div>

        {mode === "choose" ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={onTakeTest}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all hover:brightness-110"
              style={{ backgroundColor: "var(--color-purple)", color: "#fff" }}
            >
              <ClipboardList size={18} className="shrink-0" />
              <div>
                <p className="text-sm font-semibold">Take the test</p>
                <p className="text-xs opacity-70">{quiz.questionCount} questions</p>
              </div>
            </button>

            <button
              onClick={() => setMode("enter")}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all hover:opacity-80"
              style={{
                backgroundColor: "var(--color-surface-elevated)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            >
              <Pencil size={18} className="shrink-0" style={{ color: "var(--color-text-muted)" }} />
              <div>
                <p className="text-sm font-medium">I already know my result</p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Enter it directly</p>
              </div>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              What&apos;s your {quiz.shortName} result?
            </p>

            <select
              autoFocus
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none appearance-none cursor-pointer focus:border-purple-500/60"
              style={{
                backgroundColor: "var(--color-bg)",
                borderColor: "var(--color-border)",
                color: selected ? "var(--color-text-primary)" : "var(--color-text-muted)",
              }}
            >
              <option value="" disabled>Select your result…</option>
              {options.map(o => (
                <option key={o.code} value={o.code}>{o.label}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => { setMode("choose"); setSelected(""); }}
                className="flex-1 py-2 rounded-xl text-sm transition-opacity hover:opacity-70"
                style={{ color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
              >
                Back
              </button>
              <button
                onClick={() => { if (selectedOption) onEnterResult(selectedOption.code, selectedOption.label); }}
                disabled={!selected}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                style={{ backgroundColor: "var(--color-purple)", color: "#fff" }}
              >
                Save Result
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
