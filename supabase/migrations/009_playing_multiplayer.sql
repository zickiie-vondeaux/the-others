-- Add playing_multiplayer to personal game status check constraint
ALTER TABLE public.user_game_status
  DROP CONSTRAINT IF EXISTS user_game_status_status_check;

ALTER TABLE public.user_game_status
  ADD CONSTRAINT user_game_status_status_check
  CHECK (status IN ('playing_solo','playing_multiplayer','completed','want_to_play','not_interested'));
