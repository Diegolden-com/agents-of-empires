-- Create game_moves table
create table if not exists public.game_moves (
  id uuid not null default gen_random_uuid(),
  game_id numeric not null, -- uint256 can be large, numeric handles it
  agent text not null, -- address
  move_type text not null,
  data text not null, -- hex string
  nonce numeric not null,
  signature text not null,
  priority_fee_evvm numeric not null,
  nonce_evvm numeric not null,
  priority_flag_evvm boolean not null,
  signature_evvm text not null,
  status text not null default 'pending', -- pending, processing, completed, failed
  tx_hash text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint game_moves_pkey primary key (id)
);

-- Add indexes
create index if not exists game_moves_status_idx on public.game_moves (status);
create index if not exists game_moves_game_id_idx on public.game_moves (game_id);
create index if not exists game_moves_agent_idx on public.game_moves (agent);
