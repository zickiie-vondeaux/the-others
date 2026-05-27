-- ============================================================
-- THE OTHERS — Migration 005: Personality Corner
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE public.personality_results (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  test_slug   TEXT        NOT NULL,  -- 'mbti','enneagram','big_five','love_languages','attachment','disc','zodiac','chinese_zodiac','life_path','human_design'
  result_code TEXT        NOT NULL,  -- e.g. 'INFJ', '4w5', 'Scorpio', '7'
  result_label TEXT,                 -- e.g. 'The Advocate'
  result_data JSONB,                 -- raw scores or dimension breakdown
  is_shared   BOOLEAN     NOT NULL DEFAULT true,
  taken_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────

CREATE INDEX personality_results_user_idx ON public.personality_results(user_id);
CREATE INDEX personality_results_slug_idx ON public.personality_results(test_slug);

-- ── Row Level Security ────────────────────────────────────────

ALTER TABLE public.personality_results ENABLE ROW LEVEL SECURITY;

-- All authenticated members can read shared results
CREATE POLICY "personality_results: read shared"
  ON public.personality_results FOR SELECT TO authenticated
  USING (is_shared = true OR auth.uid() = user_id);

-- Members manage their own results
CREATE POLICY "personality_results: manage own"
  ON public.personality_results FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
