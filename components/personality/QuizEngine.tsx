"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Quiz, QuizResult, BinaryQuestion, LikertQuestion, ChoiceQuestion } from "@/lib/personality/types";

interface Props {
  quiz: Quiz;
  onComplete: (result: QuizResult, answers: Record<string, number>) => void;
  onClose: () => void;
}

const LIKERT_LABELS = ["Strongly\nDisagree", "Disagree", "Neutral", "Agree", "Strongly\nAgree"];

export function QuizEngine({ quiz, onComplete, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [direction, setDirection] = useState(1);
  const [pendingLikert, setPendingLikert] = useState<number | null>(null);

  const question = quiz.questions[step];
  const progress = (step / quiz.questions.length) * 100;
  const isLast = step === quiz.questions.length - 1;

  const advance = useCallback((newAnswers: Record<string, number>) => {
    if (isLast) {
      onComplete(quiz.calculate(newAnswers), newAnswers);
    } else {
      setDirection(1);
      setPendingLikert(null);
      setStep(s => s + 1);
    }
  }, [isLast, onComplete, quiz]);

  const handleAnswer = useCallback((value: number) => {
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    if (question.type !== "likert") {
      setTimeout(() => advance(next), 160);
    } else {
      setPendingLikert(value);
    }
  }, [answers, question, advance]);

  const handleBack = () => {
    if (step === 0) return;
    setDirection(-1);
    setPendingLikert(answers[quiz.questions[step - 1]?.id] !== undefined ? (answers[quiz.questions[step - 1].id] ?? null) : null);
    setStep(s => s - 1);
  };

  const handleNext = () => {
    if (pendingLikert === null) return;
    const next = { ...answers, [question.id]: pendingLikert };
    setAnswers(next);
    advance(next);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl flex flex-col overflow-hidden"
        style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{quiz.icon}</span>
            <span className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>{quiz.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {step + 1} / {quiz.questions.length}
            </span>
            <button onClick={onClose} className="p-1 rounded-lg hover:opacity-70 transition-opacity">
              <X size={18} style={{ color: "var(--color-text-muted)" }} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full" style={{ backgroundColor: "var(--color-border)" }}>
          <motion.div
            className="h-full"
            style={{ backgroundColor: "var(--color-purple)" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={question.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6"
            >
              <p
                className="text-lg font-medium leading-relaxed text-center"
                style={{ color: "var(--color-text-primary)" }}
              >
                {question.text}
              </p>

              {question.type === "binary" && (
                <BinaryOptions
                  question={question as BinaryQuestion}
                  selected={answers[question.id]}
                  onSelect={handleAnswer}
                />
              )}

              {question.type === "likert" && (
                <LikertOptions
                  selected={pendingLikert ?? answers[question.id]}
                  onSelect={v => setPendingLikert(v)}
                />
              )}

              {question.type === "choice" && (
                <ChoiceOptions
                  question={question as ChoiceQuestion}
                  selected={answers[question.id]}
                  onSelect={handleAnswer}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between px-5 pb-5 pt-2">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="flex items-center gap-1 text-sm px-3 py-2 rounded-lg transition-opacity disabled:opacity-30"
            style={{ color: "var(--color-text-muted)" }}
          >
            <ChevronLeft size={16} /> Back
          </button>

          {question.type === "likert" ? (
            <button
              onClick={handleNext}
              disabled={pendingLikert === null}
              className="flex items-center gap-1 text-sm px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-30"
              style={{
                backgroundColor: pendingLikert !== null ? "var(--color-purple)" : "var(--color-surface-elevated)",
                color: pendingLikert !== null ? "#fff" : "var(--color-text-muted)",
              }}
            >
              {isLast ? "See My Result" : "Next"} <ChevronRight size={16} />
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}

function BinaryOptions({ question, selected, onSelect }: { question: BinaryQuestion; selected: number | undefined; onSelect: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {question.options.map((opt, i) => (
        <button
          key={i}
          onClick={() => onSelect(opt.value)}
          className="w-full rounded-xl px-5 py-4 text-left text-sm font-medium transition-all duration-150"
          style={{
            backgroundColor: selected === opt.value ? "rgba(139,92,246,0.15)" : "var(--color-surface-elevated)",
            border: `1.5px solid ${selected === opt.value ? "var(--color-purple)" : "var(--color-border)"}`,
            color: selected === opt.value ? "var(--color-purple)" : "var(--color-text-primary)",
          }}
        >
          {opt.text}
        </button>
      ))}
    </div>
  );
}

function LikertOptions({ selected, onSelect }: { selected: number | undefined; onSelect: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 justify-center">
        {[1,2,3,4,5].map(v => (
          <button
            key={v}
            onClick={() => onSelect(v)}
            className="flex-1 h-12 rounded-xl font-bold text-base transition-all duration-150"
            style={{
              backgroundColor: selected === v ? "rgba(139,92,246,0.15)" : "var(--color-surface-elevated)",
              border: `1.5px solid ${selected === v ? "var(--color-purple)" : "var(--color-border)"}`,
              color: selected === v ? "var(--color-purple)" : "var(--color-text-muted)",
            }}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="flex justify-between px-1">
        <span className="text-xs text-center max-w-[70px] leading-tight" style={{ color: "var(--color-text-muted)" }}>Strongly Disagree</span>
        <span className="text-xs text-center max-w-[70px] leading-tight" style={{ color: "var(--color-text-muted)" }}>Strongly Agree</span>
      </div>
    </div>
  );
}

function ChoiceOptions({ question, selected, onSelect }: { question: ChoiceQuestion; selected: number | undefined; onSelect: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {question.options.map((opt, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className="w-full rounded-xl px-5 py-4 text-left text-sm font-medium transition-all duration-150"
          style={{
            backgroundColor: selected === i ? "rgba(6,182,212,0.12)" : "var(--color-surface-elevated)",
            border: `1.5px solid ${selected === i ? "var(--color-cyan)" : "var(--color-border)"}`,
            color: selected === i ? "var(--color-cyan)" : "var(--color-text-primary)",
          }}
        >
          {opt.text}
        </button>
      ))}
    </div>
  );
}
