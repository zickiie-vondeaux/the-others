-- ============================================================
-- THE OTHERS — Migration 014: Avatar Storage
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Create public avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone authenticated can read avatars
CREATE POLICY "avatars: read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');

-- Users can upload / overwrite their own avatar (file name = user id)
CREATE POLICY "avatars: upload own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND name = auth.uid()::text);

CREATE POLICY "avatars: update own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND name = auth.uid()::text);

CREATE POLICY "avatars: delete own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND name = auth.uid()::text);
