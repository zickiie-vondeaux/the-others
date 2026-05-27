-- ============================================================
-- THE OTHERS — Migration 003: Gaming Library
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE public.games (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  igdb_id        INT,
  title          TEXT        NOT NULL,
  cover_url      TEXT,
  release_year   INT,
  genres         TEXT[]      NOT NULL DEFAULT '{}',
  platforms      TEXT[]      NOT NULL DEFAULT '{}',
  is_multiplayer BOOLEAN     NOT NULL DEFAULT false,
  summary        TEXT,
  group_status   TEXT        NOT NULL DEFAULT 'queue'
                   CHECK (group_status IN ('queue','playing','completed','dropped')),
  added_by       UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Personal status each member sets on any game
CREATE TABLE public.user_game_status (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id    UUID        NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  status     TEXT        NOT NULL
               CHECK (status IN ('playing_solo','completed','want_to_play','not_interested')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- ── Indexes ───────────────────────────────────────────────────

CREATE INDEX games_group_status_idx    ON public.games(group_status);
CREATE INDEX games_igdb_id_idx         ON public.games(igdb_id);
CREATE INDEX ugs_user_idx              ON public.user_game_status(user_id);
CREATE INDEX ugs_game_idx              ON public.user_game_status(game_id);

-- ── Row Level Security ────────────────────────────────────────

ALTER TABLE public.games            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_game_status ENABLE ROW LEVEL SECURITY;

-- Games: all authenticated members can read
CREATE POLICY "games: authenticated can read"
  ON public.games FOR SELECT TO authenticated USING (true);

-- Games: any member can add a game
CREATE POLICY "games: members can insert"
  ON public.games FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = added_by);

-- Games: any member can change the group status (collaborative library)
CREATE POLICY "games: members can update"
  ON public.games FOR UPDATE TO authenticated USING (true);

-- Games: only admin can delete
CREATE POLICY "games: admin can delete"
  ON public.games FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- User game status: all authenticated members can read (drives group progress display)
-- Note: 'not_interested' rows are also readable but the UI hides them from others
CREATE POLICY "user_game_status: authenticated can read"
  ON public.user_game_status FOR SELECT TO authenticated USING (true);

-- User game status: members manage only their own rows
CREATE POLICY "user_game_status: manage own"
  ON public.user_game_status FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
