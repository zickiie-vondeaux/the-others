-- ============================================================
-- THE OTHERS — Migration 008: Gamification / Achievements
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE public.user_achievements (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id TEXT        NOT NULL,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX user_achievements_user_idx ON public.user_achievements(user_id);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- All authenticated members can see each other's achievements
CREATE POLICY "user_achievements: read all"
  ON public.user_achievements FOR SELECT TO authenticated
  USING (true);

-- Server / triggers insert; also allow authenticated inserts for client-side unlock
CREATE POLICY "user_achievements: insert own"
  ON public.user_achievements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
