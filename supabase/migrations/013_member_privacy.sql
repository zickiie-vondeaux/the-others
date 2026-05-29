-- ============================================================
-- THE OTHERS — Migration 013: Member Privacy Settings
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Add privacy_settings JSONB column to profiles
-- Defaults all toggles to visible (true) for new and existing users
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS privacy_settings JSONB NOT NULL
  DEFAULT '{"bio":true,"personality":true,"favorites":true,"activity":true,"steam":true}'::jsonb;

-- Update any existing rows that may have gotten a null somehow
UPDATE public.profiles
  SET privacy_settings = '{"bio":true,"personality":true,"favorites":true,"activity":true,"steam":true}'::jsonb
  WHERE privacy_settings IS NULL;
