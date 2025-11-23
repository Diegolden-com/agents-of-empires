-- Create games table to store game metadata
create table if not exists public.games (
  id uuid not null default gen_random_uuid(),
  game_id numeric not null unique, -- blockchain game ID (uint256)
  status text not null default 'active', -- active, finished, cancelled

  -- Game participants (AI agents)
  agents jsonb not null, -- Array of agent configs

  -- Game results
  winner_agent text, -- agent address of the winner
  winner_index integer, -- 0-3, which agent won

  -- Timing
  started_at timestamp with time zone default now(),
  finished_at timestamp with time zone,

  -- Blockchain references
  bettor_address text, -- address of the human bettor
  bettor_choice integer, -- which AI the bettor chose (0-3)

  -- Metadata
  total_turns integer default 0,
  total_moves integer default 0,

  -- Timestamps
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  constraint games_pkey primary key (id)
);

-- Add indexes
create index if not exists games_game_id_idx on public.games (game_id);
create index if not exists games_status_idx on public.games (status);
create index if not exists games_winner_agent_idx on public.games (winner_agent);
create index if not exists games_started_at_idx on public.games (started_at);

-- Add RLS policies (adjust based on your needs)
alter table public.games enable row level security;

-- Allow public read access
create policy "Games are viewable by everyone"
  on public.games for select
  using (true);

-- Only service role can insert/update
create policy "Games can be inserted by service role"
  on public.games for insert
  with check (true);

create policy "Games can be updated by service role"
  on public.games for update
  using (true);

-- Add comment
comment on table public.games is 'Stores metadata for each game session, including participants and results';
