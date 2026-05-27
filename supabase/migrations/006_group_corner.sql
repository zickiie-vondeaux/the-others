-- ============================================================
-- THE OTHERS — Migration 006: Group Corner
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Activity Feed ─────────────────────────────────────────────

CREATE TABLE public.activity_feed (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL,
  -- e.g. 'game_added','game_status','movie_added','movie_watched',
  --      'poll_created','poll_closed','personality_taken','event_created','member_joined'
  entity_type  TEXT,       -- 'game','movie','poll','personality','event'
  entity_id    TEXT,       -- UUID or slug of the thing
  entity_title TEXT,       -- human-readable name for display
  metadata     JSONB,      -- extra context (old_status → new_status, result_code, etc.)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX activity_feed_created_idx ON public.activity_feed(created_at DESC);
CREATE INDEX activity_feed_user_idx    ON public.activity_feed(user_id);

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_feed: all authenticated can read"
  ON public.activity_feed FOR SELECT TO authenticated USING (true);

CREATE POLICY "activity_feed: users insert own"
  ON public.activity_feed FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "activity_feed: users delete own"
  ON public.activity_feed FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ── Reactions ─────────────────────────────────────────────────

CREATE TABLE public.reactions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id UUID        NOT NULL REFERENCES public.activity_feed(id) ON DELETE CASCADE,
  emoji       TEXT        NOT NULL CHECK (char_length(emoji) <= 8),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, activity_id, emoji)
);

CREATE INDEX reactions_activity_idx ON public.reactions(activity_id);

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reactions: all authenticated can read"
  ON public.reactions FOR SELECT TO authenticated USING (true);

CREATE POLICY "reactions: users manage own"
  ON public.reactions FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Notifications ─────────────────────────────────────────────

CREATE TABLE public.notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL,
  -- 'reaction','poll_closed','event_reminder','birthday','achievement'
  title      TEXT        NOT NULL,
  body       TEXT,
  link       TEXT,       -- internal route to navigate to on click
  is_read    BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_idx     ON public.notifications(user_id, created_at DESC);
CREATE INDEX notifications_unread_idx   ON public.notifications(user_id, is_read) WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications: users read own"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "notifications: users update own"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications: service can insert"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);
