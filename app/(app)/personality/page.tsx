"use client";

import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { QuizEngine } from "@/components/personality/QuizEngine";
import { QuizStartModal } from "@/components/personality/QuizStartModal";
import { ResultReveal } from "@/components/personality/ResultReveal";
import { PersonalityCard, MemberPersonalityChips } from "@/components/personality/PersonalityCard";
import { createClient } from "@/lib/supabase/client";
import {
  ALL_QUIZZES, AUTO_CALC_META, AUTO_CALC_SLUGS, type AutoCalcSlug,
  calcZodiac, calcChineseZodiac, calcLifePath, calcHumanDesign,
  type AutoCalcResult,
} from "@/lib/personality";
import type { Quiz, QuizResult } from "@/lib/personality/types";
import type { PersonalityResult, Profile } from "@/lib/supabase/types";
import { logActivity } from "@/lib/activity";
import { useAchievements } from "@/components/achievements/AchievementProvider";
import { CalendarDays, Users, ChevronDown, ChevronUp } from "lucide-react";

type PendingResult = { quizResult: QuizResult | AutoCalcResult; slug: string; saved: boolean };

export default function PersonalityPage() {
  const [myUserId, setMyUserId] = useState("");
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [myResults, setMyResults] = useState<PersonalityResult[]>([]);
  const [allResults, setAllResults] = useState<PersonalityResult[]>([]);
  const [profiles, setProfiles] = useState<Pick<Profile,"id"|"display_name"|"avatar_url">[]>([]);
  const [loading, setLoading] = useState(true);

  // Birthday state for auto-calc (pre-filled from profile)
  const [birthday, setBirthday] = useState("");
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);

  // Quiz flow
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [pending, setPending] = useState<PendingResult | null>(null);

  // Group view
  const [showGroup, setShowGroup] = useState(false);
  const { triggerCheck } = useAchievements();

  const supabase = createClient();

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setMyUserId(user.id);

    const [{ data: profile }, { data: myRes }, { data: allRes }, { data: allProfiles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("personality_results").select("*").eq("user_id", user.id),
      supabase.from("personality_results").select("*").eq("is_shared", true),
      supabase.from("profiles").select("id,display_name,avatar_url"),
    ]);

    if (profile) {
      setMyProfile(profile as Profile);
      if (profile.birthday) setBirthday(profile.birthday);
    }
    setMyResults((myRes ?? []) as PersonalityResult[]);
    setAllResults((allRes ?? []) as PersonalityResult[]);
    setProfiles((allProfiles ?? []) as Pick<Profile,"id"|"display_name"|"avatar_url">[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveResult = useCallback(async (slug: string, result: QuizResult | AutoCalcResult) => {
    const { error } = await supabase.from("personality_results").upsert({
      user_id: myUserId,
      test_slug: slug,
      result_code: result.code,
      result_label: result.label,
      result_data: (result as QuizResult).data ?? null,
      is_shared: true,
      taken_at: new Date().toISOString(),
    }, { onConflict: "user_id,test_slug" });
    if (!error) {
      loadData();
      const quizMeta = ALL_QUIZZES.find(q => q.slug === slug);
      const label = quizMeta
        ? `${result.code} (${quizMeta.shortName})`
        : result.code;
      logActivity({ type: "personality_taken", entityType: "personality", entityId: slug, entityTitle: label });
      triggerCheck();
    }
    return !error;
  }, [myUserId, supabase, loadData, triggerCheck]);

  const handleQuizComplete = useCallback(async (result: QuizResult, _answers: Record<string, number>) => {
    if (!activeQuiz) return;
    setActiveQuiz(null);
    const saved = await saveResult(activeQuiz.slug, result);
    setPending({ quizResult: result, slug: activeQuiz.slug, saved });
  }, [activeQuiz, saveResult]);

  const handleManualResult = useCallback(async (quiz: Quiz, code: string, label: string) => {
    setPreviewQuiz(null);
    const result: QuizResult = { code, label, description: "", characters: [] };
    const saved = await saveResult(quiz.slug, result);
    setPending({ quizResult: result, slug: quiz.slug, saved });
  }, [saveResult]);

  const handleAutoCalc = useCallback(async (slug: AutoCalcSlug) => {
    if (!birthday) { setShowBirthdayPicker(true); return; }
    const [yearStr, monthStr, dayStr] = birthday.split("-");
    const year = parseInt(yearStr), month = parseInt(monthStr), day = parseInt(dayStr);
    let result: AutoCalcResult;
    if      (slug === "zodiac")         result = calcZodiac(month, day);
    else if (slug === "chinese_zodiac") result = calcChineseZodiac(year);
    else if (slug === "life_path")      result = calcLifePath(year, month, day);
    else                                result = calcHumanDesign(year, month, day);
    const saved = await saveResult(slug, result);
    setPending({ quizResult: result, slug, saved });
  }, [birthday, saveResult]);

  const myResultMap = Object.fromEntries(myResults.map(r => [r.test_slug, r]));
  const ALL_SLUGS = [...ALL_QUIZZES.map(q => q.slug), ...AUTO_CALC_SLUGS];

  if (loading) {
    return (
      <>
        <TopBar title="Personality Corner" />
        <div className="flex-1 flex items-center justify-center" style={{ color: "var(--color-text-muted)" }}>
          Loading…
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Personality Corner" />

      {previewQuiz && (
        <QuizStartModal
          quiz={previewQuiz}
          onTakeTest={() => { setActiveQuiz(previewQuiz); setPreviewQuiz(null); }}
          onEnterResult={(code, label) => handleManualResult(previewQuiz, code, label)}
          onClose={() => setPreviewQuiz(null)}
        />
      )}

      {activeQuiz && (
        <QuizEngine
          quiz={activeQuiz}
          onComplete={handleQuizComplete}
          onClose={() => setActiveQuiz(null)}
        />
      )}

      {pending && (
        <ResultReveal
          quiz={pending.slug in AUTO_CALC_META
            ? { name: AUTO_CALC_META[pending.slug as AutoCalcSlug].name, icon: AUTO_CALC_META[pending.slug as AutoCalcSlug].icon, slug: pending.slug }
            : ALL_QUIZZES.find(q => q.slug === pending.slug) && { name: ALL_QUIZZES.find(q => q.slug === pending.slug)!.name, icon: ALL_QUIZZES.find(q => q.slug === pending.slug)!.icon, slug: pending.slug }
              || undefined}
          result={pending.quizResult}
          isSaved={pending.saved}
          onRetake={ALL_QUIZZES.find(q => q.slug === pending.slug) ? () => {
            setPending(null);
            setActiveQuiz(ALL_QUIZZES.find(q => q.slug === pending.slug) ?? null);
          } : undefined}
          onClose={() => setPending(null)}
        />
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="px-[8%] py-6 flex flex-col gap-8">

          {/* Header */}
          <div>
            <h1 className="neon-heading text-4xl font-black mb-1 uppercase tracking-widest">
              Personality Corner
            </h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              10 lenses to see who you are. Take a quiz, see how the group compares.
            </p>
          </div>

          {/* Quizzes */}
          <section>
            <h2 className="text-base font-semibold mb-3" style={{ color: "var(--color-cyan)", textShadow: "0 0 8px rgba(0,255,234,0.45)" }}>
              Personality Quizzes
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ALL_QUIZZES.map(quiz => (
                <PersonalityCard
                  key={quiz.slug}
                  result={myResultMap[quiz.slug] ?? null}
                  slug={quiz.slug}
                  onTake={() => setPreviewQuiz(quiz)}
                />
              ))}
            </div>
          </section>

          {/* Auto-Calc */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold" style={{ color: "var(--color-cyan)", textShadow: "0 0 8px rgba(0,255,234,0.45)" }}>
                Auto-Calculated
              </h2>
              <button
                onClick={() => setShowBirthdayPicker(v => !v)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
                style={{ backgroundColor: "var(--color-surface-elevated)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
              >
                <CalendarDays size={13} />
                {birthday ? birthday : "Set birthday"}
              </button>
            </div>

            {showBirthdayPicker && (
              <div
                className="mb-4 p-4 rounded-xl flex flex-col gap-3"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
              >
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Your birthday is used only to calculate your cosmic profile — it's not stored separately.
                </p>
                <input
                  type="date"
                  value={birthday}
                  onChange={e => setBirthday(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: "var(--color-surface-elevated)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                />
                <button
                  onClick={() => setShowBirthdayPicker(false)}
                  disabled={!birthday}
                  className="self-end text-sm px-4 py-1.5 rounded-lg font-medium disabled:opacity-40 transition-opacity"
                  style={{ backgroundColor: "var(--color-purple)", color: "#fff" }}
                >
                  Calculate all
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {AUTO_CALC_SLUGS.map(slug => (
                <PersonalityCard
                  key={slug}
                  result={myResultMap[slug] ?? null}
                  slug={slug}
                  onTake={() => handleAutoCalc(slug)}
                />
              ))}
            </div>
          </section>

          {/* Group view */}
          <section>
            <button
              onClick={() => setShowGroup(v => !v)}
              className="flex items-center gap-2 text-base font-semibold mb-3 hover:opacity-70 transition-opacity"
              style={{ color: "var(--color-cyan)", textShadow: "0 0 8px rgba(0,255,234,0.45)" }}
            >
              <Users size={16} />
              Group Results
              {showGroup ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {showGroup && (
              <div
                className="rounded-xl p-5 flex flex-col gap-5"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
              >
                <div className="flex flex-wrap gap-2">
                  {ALL_SLUGS.map(slug => {
                    const meta = ALL_QUIZZES.find(q=>q.slug===slug) ?? AUTO_CALC_META[slug as AutoCalcSlug];
                    return (
                      <span key={slug} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-surface-elevated)", color: "var(--color-text-muted)" }}>
                        {meta?.icon} {meta?.shortName ?? slug}
                      </span>
                    );
                  })}
                </div>
                <div className="flex flex-col divide-y" style={{ borderColor: "var(--color-border)" }}>
                  {profiles.map(p => {
                    const memberResults = allResults.filter(r => r.user_id === p.id);
                    return (
                      <div key={p.id} className="py-4 first:pt-0 last:pb-0">
                        <MemberPersonalityChips
                          displayName={p.display_name}
                          avatarUrl={p.avatar_url}
                          results={memberResults}
                          slugs={ALL_SLUGS}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

        </div>
      </div>
    </>
  );
}
