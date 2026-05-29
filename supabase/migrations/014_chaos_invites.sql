-- ============================================================
-- THE OTHERS — Migration 014: Chaos rename + Invite System
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Rename 'origin' → 'chaos' ─────────────────────────────

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

UPDATE public.profiles SET role = 'chaos' WHERE role = 'origin';

ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'unnamed',
  ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('chaos', 'watcher', 'ascended', 'wanderer', 'unnamed'));

DROP INDEX IF EXISTS profiles_unique_origin;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_unique_chaos
  ON public.profiles (role)
  WHERE role = 'chaos';

-- ── 2. Update RLS policies: 'origin' → 'chaos' ───────────────

DROP POLICY IF EXISTS "profiles: admin can update any" ON public.profiles;
CREATE POLICY "profiles: admin can update any"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('watcher', 'chaos')
    )
  );

DROP POLICY IF EXISTS "profiles: admin can delete any" ON public.profiles;
CREATE POLICY "profiles: admin can delete any"
  ON public.profiles FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('watcher', 'chaos')
    )
  );

DROP POLICY IF EXISTS "invites: admin only" ON public.invites;
CREATE POLICY "invites: admin only"
  ON public.invites FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('watcher', 'chaos')
    )
  );

DROP POLICY IF EXISTS "games: delete own or watcher+" ON public.games;
CREATE POLICY "games: delete own or watcher+"
  ON public.games FOR DELETE TO authenticated
  USING (
    auth.uid() = added_by
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('watcher', 'chaos')
    )
  );

DROP POLICY IF EXISTS "movies: delete own or watcher+" ON public.movies;
CREATE POLICY "movies: delete own or watcher+"
  ON public.movies FOR DELETE TO authenticated
  USING (
    auth.uid() = added_by
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('watcher', 'chaos')
    )
  );

DROP POLICY IF EXISTS "polls: creator or admin can update" ON public.polls;
CREATE POLICY "polls: creator or admin can update"
  ON public.polls FOR UPDATE TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('watcher', 'chaos'))
  );

DROP POLICY IF EXISTS "polls: creator or admin can delete" ON public.polls;
CREATE POLICY "polls: creator or admin can delete"
  ON public.polls FOR DELETE TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('watcher', 'chaos'))
  );

-- ── 3. Invite codes table ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.invite_codes (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT        NOT NULL UNIQUE,
  generated_by UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_by      UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at      TIMESTAMPTZ,
  status       TEXT        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'used', 'revoked'))
);

CREATE INDEX IF NOT EXISTS invite_codes_code_idx   ON public.invite_codes (code);
CREATE INDEX IF NOT EXISTS invite_codes_gen_by_idx ON public.invite_codes (generated_by);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own codes
DROP POLICY IF EXISTS "invite_codes: view own" ON public.invite_codes;
CREATE POLICY "invite_codes: view own"
  ON public.invite_codes FOR SELECT TO authenticated
  USING (auth.uid() = generated_by);

-- Watcher+ can view all codes (filtered further in application layer)
DROP POLICY IF EXISTS "invite_codes: watcher can view all" ON public.invite_codes;
CREATE POLICY "invite_codes: watcher can view all"
  ON public.invite_codes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('watcher', 'chaos')
    )
  );

-- Inserts and updates are service-role only
-- No INSERT/UPDATE policy = only service_role can write

-- ── 4. Member badges table ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.member_badges (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_slug  TEXT        NOT NULL,
  badge_label TEXT        NOT NULL,
  assigned_by UUID        NOT NULL REFERENCES public.profiles(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_slug)
);

ALTER TABLE public.member_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member_badges: read all" ON public.member_badges;
CREATE POLICY "member_badges: read all"
  ON public.member_badges FOR SELECT TO authenticated
  USING (true);

-- Inserts and deletes are service-role only

-- ── 5. Profile edit log (for profile override audit) ──────────

CREATE TABLE IF NOT EXISTS public.profile_edit_log (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  edited_by  UUID        NOT NULL REFERENCES public.profiles(id),
  edited_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  field_name TEXT        NOT NULL,
  old_value  TEXT,
  new_value  TEXT
);

ALTER TABLE public.profile_edit_log ENABLE ROW LEVEL SECURITY;

-- Chaos only
DROP POLICY IF EXISTS "profile_edit_log: chaos only" ON public.profile_edit_log;
CREATE POLICY "profile_edit_log: chaos only"
  ON public.profile_edit_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'chaos'
    )
  );

-- ── 6. Content flags table ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.content_flags (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT        NOT NULL CHECK (content_type IN ('game', 'movie', 'game_review', 'movie_review')),
  content_id   UUID        NOT NULL,
  reported_by  UUID        NOT NULL REFERENCES public.profiles(id),
  reported_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason       TEXT,
  status       TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'dismissed', 'actioned'))
);

ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;

-- Watcher+ can view flags
DROP POLICY IF EXISTS "content_flags: watcher can view" ON public.content_flags;
CREATE POLICY "content_flags: watcher can view"
  ON public.content_flags FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('watcher', 'chaos')
    )
  );

-- Ascended+ can flag content (insert)
DROP POLICY IF EXISTS "content_flags: ascended can flag" ON public.content_flags;
CREATE POLICY "content_flags: ascended can flag"
  ON public.content_flags FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = reported_by AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('ascended', 'watcher', 'chaos')
    )
  );

-- Updates (dismiss/action) are service-role only

-- ── 7. Add moderation fields to profiles ──────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_banned   BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS muted_until TIMESTAMPTZ;

-- ── Set yourself as chaos (run once, replace email) ──────────
--
--   UPDATE public.profiles
--   SET role = 'chaos'
--   WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE');
--
-- ─────────────────────────────────────────────────────────────
