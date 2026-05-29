-- ============================================================
-- THE OTHERS — Migration 012: Roles & Notifications
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Update role column ─────────────────────────────────────

-- Drop the old check constraint (name matches 001_profiles.sql definition)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Map existing roles to new slugs before changing the constraint
UPDATE public.profiles SET role = 'wanderer' WHERE role = 'member';
UPDATE public.profiles SET role = 'watcher'  WHERE role = 'moderator';
UPDATE public.profiles SET role = 'origin'   WHERE role = 'super_admin';

-- Apply new constraint and default
ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'unnamed',
  ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('origin', 'watcher', 'ascended', 'wanderer', 'unnamed'));

-- Enforce at most one origin across the entire table
CREATE UNIQUE INDEX IF NOT EXISTS profiles_unique_origin
  ON public.profiles (role)
  WHERE role = 'origin';

-- ── 2. Update RLS policies that referenced old role slugs ─────

-- profiles
DROP POLICY IF EXISTS "profiles: admin can update any" ON public.profiles;
CREATE POLICY "profiles: admin can update any"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('watcher', 'origin')
    )
  );

DROP POLICY IF EXISTS "profiles: admin can delete any" ON public.profiles;
CREATE POLICY "profiles: admin can delete any"
  ON public.profiles FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('watcher', 'origin')
    )
  );

-- invites
DROP POLICY IF EXISTS "invites: admin only" ON public.invites;
CREATE POLICY "invites: admin only"
  ON public.invites FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('watcher', 'origin')
    )
  );

-- games
DROP POLICY IF EXISTS "games: admin can delete" ON public.games;
CREATE POLICY "games: delete own or watcher+"
  ON public.games FOR DELETE TO authenticated
  USING (
    auth.uid() = added_by
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('watcher', 'origin')
    )
  );

-- movies
DROP POLICY IF EXISTS "movies: admin can delete" ON public.movies;
CREATE POLICY "movies: delete own or watcher+"
  ON public.movies FOR DELETE TO authenticated
  USING (
    auth.uid() = added_by
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('watcher', 'origin')
    )
  );

-- polls
DROP POLICY IF EXISTS "polls: creator or admin can update" ON public.polls;
CREATE POLICY "polls: creator or admin can update"
  ON public.polls FOR UPDATE TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('watcher', 'origin'))
  );

DROP POLICY IF EXISTS "polls: creator or admin can delete" ON public.polls;
CREATE POLICY "polls: creator or admin can delete"
  ON public.polls FOR DELETE TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('watcher', 'origin'))
  );

-- ── 3. Notifications table ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  is_read    BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx
  ON public.notifications (user_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read and mark their own notifications
CREATE POLICY "notifications: read own"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "notifications: update own"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Inserts are service-role only (admin client bypasses RLS)
-- No INSERT policy = only service_role can insert

-- ── Set yourself as origin (run once, replace email) ─────────
--
--   UPDATE public.profiles
--   SET role = 'origin'
--   WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE');
--
-- ─────────────────────────────────────────────────────────────
