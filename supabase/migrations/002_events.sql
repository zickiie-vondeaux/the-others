-- ============================================================
-- THE OTHERS — Migration 002: Events & RSVPs
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE public.events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  type             TEXT NOT NULL DEFAULT 'other'
                     CHECK (type IN ('birthday','game_night','movie_night','meetup','online','milestone','other')),
  description      TEXT,
  start_at         TIMESTAMPTZ NOT NULL,
  end_at           TIMESTAMPTZ,
  location_or_link TEXT,
  created_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.event_rsvps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status     TEXT NOT NULL CHECK (status IN ('going','maybe','not_going')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- ── Indexes ───────────────────────────────────────────────────

CREATE INDEX events_start_at_idx ON public.events(start_at);
CREATE INDEX event_rsvps_event_idx ON public.event_rsvps(event_id);

-- ── Row Level Security ────────────────────────────────────────

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read all events
CREATE POLICY "events: authenticated can read"
  ON public.events FOR SELECT TO authenticated USING (true);

-- Any member can create events
CREATE POLICY "events: members can insert"
  ON public.events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Creator can update their own events
CREATE POLICY "events: creator can update"
  ON public.events FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

-- Creator or admin can delete events
CREATE POLICY "events: creator or admin can delete"
  ON public.events FOR DELETE TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- RSVPs: read all
CREATE POLICY "rsvps: authenticated can read"
  ON public.event_rsvps FOR SELECT TO authenticated USING (true);

-- RSVPs: users manage own
CREATE POLICY "rsvps: users manage own"
  ON public.event_rsvps FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
