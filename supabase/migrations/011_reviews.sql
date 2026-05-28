-- ============================================================
-- THE OTHERS — Migration 011: Ratings & Reviews
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Allow group_status to be omitted on insert (DB default 'queue' stays intact)
ALTER TABLE public.games  ALTER COLUMN group_status DROP NOT NULL;
ALTER TABLE public.movies ALTER COLUMN group_status DROP NOT NULL;

-- Per-user game reviews (1–5 stars + optional text)
CREATE TABLE public.game_reviews (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_id     UUID        NOT NULL REFERENCES public.games(id)    ON DELETE CASCADE,
  rating      SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_id)
);

-- Per-user movie reviews (1–5 stars + optional text)
CREATE TABLE public.movie_reviews (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  movie_id    UUID        NOT NULL REFERENCES public.movies(id)   ON DELETE CASCADE,
  rating      SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, movie_id)
);

CREATE INDEX game_reviews_game_idx  ON public.game_reviews(game_id);
CREATE INDEX game_reviews_user_idx  ON public.game_reviews(user_id);
CREATE INDEX movie_reviews_movie_idx ON public.movie_reviews(movie_id);
CREATE INDEX movie_reviews_user_idx  ON public.movie_reviews(user_id);

ALTER TABLE public.game_reviews  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_reviews: authenticated can read"
  ON public.game_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "game_reviews: manage own"
  ON public.game_reviews FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "movie_reviews: authenticated can read"
  ON public.movie_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "movie_reviews: manage own"
  ON public.movie_reviews FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
