-- ============================================================
-- THE OTHERS — Migration 010: Steam Integration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Add Steam ID to user profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS steam_id TEXT;

-- Add Steam App ID to games for deduplication
ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS steam_app_id INT;

CREATE INDEX IF NOT EXISTS games_steam_app_id_idx ON public.games(steam_app_id);
