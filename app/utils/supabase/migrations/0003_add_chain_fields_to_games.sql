-- Añade columnas para guardar el contexto on-chain y estado VRF del juego.
-- Ejecuta este script en tu base Supabase/Postgres antes de refrescar types.

ALTER TABLE public.games
  ADD COLUMN IF NOT EXISTS ai_players jsonb,
  ADD COLUMN IF NOT EXISTS board_state jsonb,
  ADD COLUMN IF NOT EXISTS chain_deposit text,
  ADD COLUMN IF NOT EXISTS chain_end_time text,
  ADD COLUMN IF NOT EXISTS chain_payload jsonb,
  ADD COLUMN IF NOT EXISTS chain_random_ready boolean,
  ADD COLUMN IF NOT EXISTS chain_request_id text,
  ADD COLUMN IF NOT EXISTS chain_start_time text,
  ADD COLUMN IF NOT EXISTS chain_status integer,
  ADD COLUMN IF NOT EXISTS chain_winner integer;

-- Índices útiles para lecturas rápidas
CREATE INDEX IF NOT EXISTS games_status_idx ON public.games (status);
CREATE INDEX IF NOT EXISTS games_game_id_idx ON public.games (game_id);
