-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- PROFILES (Extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  timezone text default 'UTC',
  xp_k integer default 10,
  streak_threshold integer default 1, -- items per day to keep streak
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

-- ACTIONS (Catalog of habits)
create table public.actions (
  id bigserial primary key,
  key text unique not null,
  name text not null,
  category text not null check (category in ('health', 'mind', 'hustle')),
  xp_base integer not null default 10,
  coin_base integer not null default 1,
  cooldown_hours integer default 0,
  max_per_day integer default null,
  is_negative boolean default false,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
alter table public.actions enable row level security;

-- EVENT_LOG (Append-only core loop)
create table public.event_log (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  action_id bigint references public.actions(id) not null,
  ts timestamptz default now() not null,
  day_key date not null, -- Computed logic in app, but stored for simple querying
  value integer default 1, -- Intensity or count
  note text,
  client_id text, -- For deduplication
  created_at timestamptz default now()
);
create unique index idx_event_log_dedupe on public.event_log (user_id, client_id);
create index idx_event_log_user_day on public.event_log (user_id, day_key);
create index idx_event_log_ts on public.event_log (ts);
alter table public.event_log enable row level security;

-- QUESTS (User-specific)
create table public.quests (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text check (type in ('daily', 'weekly', 'monthly', 'boss')),
  title text not null,
  rules jsonb not null default '{}'::jsonb, -- e.g. {"action": "gym", "count": 1}
  reward_xp integer default 0,
  reward_coin integer default 0,
  start_date date not null,
  end_date date not null,
  status text check (status in ('active', 'done', 'expired')) default 'active',
  created_at timestamptz default now()
);
create index idx_quests_user_status on public.quests (user_id, status);
alter table public.quests enable row level security;

-- ACHIEVEMENTS (Static definitions)
create table public.achievements (
  key text primary key,
  name text not null,
  description text,
  rules jsonb not null, -- criteria
  reward_xp integer default 0,
  reward_coin integer default 0,
  icon text
);
alter table public.achievements enable row level security;

-- USER_ACHIEVEMENTS (Progress)
create table public.user_achievements (
  user_id uuid references auth.users(id) on delete cascade not null,
  achievement_key text references public.achievements(key) not null,
  unlocked_at timestamptz default now(),
  primary key (user_id, achievement_key)
);
alter table public.user_achievements enable row level security;

-- WALLET (Currency)
create table public.wallet (
  user_id uuid references auth.users(id) on delete cascade primary key,
  coins_balance integer default 0 check (coins_balance >= 0),
  updated_at timestamptz default now()
);
alter table public.wallet enable row level security;

-- PURCHASES (Shop history / Inventory)
create table public.purchases (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  item_key text not null,
  cost integer not null,
  ts timestamptz default now(),
  active_until timestamptz -- For buffs
);
alter table public.purchases enable row level security;


-- RLS POLICIES

-- Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Actions
create policy "Actions are readable by authenticated users" on public.actions for select to authenticated using (true);

-- Event Log
create policy "Users can CRUD own events" on public.event_log for all using (auth.uid() = user_id);

-- Quests
create policy "Users can CRUD own quests" on public.quests for all using (auth.uid() = user_id);

-- Achievements
create policy "Achievements are readable by all" on public.achievements for select to authenticated using (true);
create policy "Users can CRUD own achievements" on public.user_achievements for all using (auth.uid() = user_id);

-- Wallet
create policy "Users can view own wallet" on public.wallet for select using (auth.uid() = user_id);
create policy "Users can update own wallet" on public.wallet for update using (auth.uid() = user_id); -- Strict backend checks usually better

-- Purchases
create policy "Users can CRUD own purchases" on public.purchases for all using (auth.uid() = user_id);

-- FUNCTION to handle new user signup automatically (Trigger)
create function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  
  insert into public.wallet (user_id, coins_balance)
  values (new.id, 0);
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

