-- ============================================================
-- THE OTHERS — Migration 007: Birthday System
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE public.birthday_messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  for_user_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_user_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message      TEXT        NOT NULL CHECK (char_length(message) <= 500),
  year         INT         NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (for_user_id, from_user_id, year)  -- one message per person per year
);

CREATE INDEX birthday_messages_for_idx ON public.birthday_messages(for_user_id, year);

ALTER TABLE public.birthday_messages ENABLE ROW LEVEL SECURITY;

-- All authenticated members can read messages (birthday wall is public in the group)
CREATE POLICY "birthday_messages: read all"
  ON public.birthday_messages FOR SELECT TO authenticated
  USING (true);

-- Members can write messages for others (not for themselves)
CREATE POLICY "birthday_messages: insert for others"
  ON public.birthday_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user_id AND auth.uid() != for_user_id);

-- Writers can delete their own messages
CREATE POLICY "birthday_messages: delete own"
  ON public.birthday_messages FOR DELETE TO authenticated
  USING (auth.uid() = from_user_id);
