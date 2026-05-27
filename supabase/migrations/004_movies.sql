-- ============================================================
-- THE OTHERS — Migration 004: Movie Library & Polls
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE public.movies (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  omdb_id         TEXT,                          -- imdbID from OMDb (null if manual entry)
  title           TEXT        NOT NULL,
  poster_url      TEXT,
  release_year    INT,
  genres          TEXT[]      NOT NULL DEFAULT '{}',
  runtime_minutes INT,
  overview        TEXT,
  director        TEXT,
  group_status    TEXT        NOT NULL DEFAULT 'queue'
                    CHECK (group_status IN ('queue','watching','watched','dropped')),
  added_by        UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Personal watch status per member
CREATE TABLE public.user_movie_status (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  movie_id   UUID        NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  status     TEXT        NOT NULL
               CHECK (status IN ('watched','watching','want_to_watch','not_interested')),
  watched_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

-- Movie night polls
CREATE TABLE public.polls (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT        NOT NULL,
  created_by        UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  closes_at         TIMESTAMPTZ,
  is_closed         BOOLEAN     NOT NULL DEFAULT false,
  hide_until_closed BOOLEAN     NOT NULL DEFAULT false,
  winning_movie_id  UUID        REFERENCES public.movies(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Poll movie options
CREATE TABLE public.poll_options (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id  UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  position INT  NOT NULL DEFAULT 0
);

-- Ranked choice votes
CREATE TABLE public.poll_votes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    UUID        NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rankings   JSONB       NOT NULL, -- [{option_id: uuid, rank: 1}, ...]
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- ── Indexes ───────────────────────────────────────────────────

CREATE INDEX movies_group_status_idx  ON public.movies(group_status);
CREATE INDEX movies_omdb_id_idx       ON public.movies(omdb_id);
CREATE INDEX ums_user_idx             ON public.user_movie_status(user_id);
CREATE INDEX ums_movie_idx            ON public.user_movie_status(movie_id);
CREATE INDEX poll_options_poll_idx    ON public.poll_options(poll_id);
CREATE INDEX poll_votes_poll_idx      ON public.poll_votes(poll_id);

-- ── Row Level Security ────────────────────────────────────────

ALTER TABLE public.movies           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_movie_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes       ENABLE ROW LEVEL SECURITY;

-- Movies
CREATE POLICY "movies: authenticated can read"
  ON public.movies FOR SELECT TO authenticated USING (true);

CREATE POLICY "movies: members can insert"
  ON public.movies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = added_by);

CREATE POLICY "movies: members can update"
  ON public.movies FOR UPDATE TO authenticated USING (true);

CREATE POLICY "movies: admin can delete"
  ON public.movies FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'));

-- User movie status
CREATE POLICY "user_movie_status: authenticated can read"
  ON public.user_movie_status FOR SELECT TO authenticated USING (true);

CREATE POLICY "user_movie_status: manage own"
  ON public.user_movie_status FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Polls
CREATE POLICY "polls: authenticated can read"
  ON public.polls FOR SELECT TO authenticated USING (true);

CREATE POLICY "polls: members can create"
  ON public.polls FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "polls: creator or admin can update"
  ON public.polls FOR UPDATE TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "polls: creator or admin can delete"
  ON public.polls FOR DELETE TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Poll options
CREATE POLICY "poll_options: authenticated can read"
  ON public.poll_options FOR SELECT TO authenticated USING (true);

CREATE POLICY "poll_options: poll creator can manage"
  ON public.poll_options FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.polls WHERE id = poll_id AND created_by = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.polls WHERE id = poll_id AND created_by = auth.uid())
  );

-- Poll votes
CREATE POLICY "poll_votes: authenticated can read"
  ON public.poll_votes FOR SELECT TO authenticated USING (true);

CREATE POLICY "poll_votes: members manage own"
  ON public.poll_votes FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
