-- ============================================================
-- THE OTHERS — Migration 001: Profiles
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username            TEXT UNIQUE NOT NULL,
  display_name        TEXT NOT NULL,
  real_name           TEXT,
  ign                 TEXT,
  avatar_url          TEXT,
  bio                 TEXT CHECK (char_length(bio) <= 280),
  birthday            DATE,
  city                TEXT,
  timezone            TEXT DEFAULT 'UTC',
  favorite_game       TEXT,
  favorite_movie      TEXT,
  favorite_food       TEXT,
  favorite_color      TEXT,
  favorite_music      TEXT,
  platforms           TEXT[] DEFAULT '{}',
  role                TEXT NOT NULL DEFAULT 'member'
                        CHECK (role IN ('member', 'moderator', 'super_admin')),
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Row Level Security ────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read all profiles
CREATE POLICY "profiles: authenticated can read all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own profile
CREATE POLICY "profiles: users can insert own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles: users can update own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin can update any profile
CREATE POLICY "profiles: admin can update any"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Admin can delete any profile (removes from group)
CREATE POLICY "profiles: admin can delete any"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ── Auto-update last_active_at ────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_last_active();

-- ── Invites table ─────────────────────────────────────────────

CREATE TABLE public.invites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token      TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'base64url'),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Only admin can read/write invites
CREATE POLICY "invites: admin only"
  ON public.invites FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ── Make yourself super_admin (run once, replace with your email) ──
-- After running the full migration, also run:
--
--   UPDATE public.profiles
--   SET role = 'super_admin'
--   WHERE id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE');
--
-- ─────────────────────────────────────────────────────────────
