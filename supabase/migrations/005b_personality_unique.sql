-- ============================================================
-- THE OTHERS — Migration 005b: Fix personality_results unique constraint
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE public.personality_results
  ADD CONSTRAINT personality_results_user_slug_unique
  UNIQUE (user_id, test_slug);
