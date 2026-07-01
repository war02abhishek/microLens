-- MacroLens core schema
-- Run in the Supabase SQL Editor (or via your migration tool of choice).

create extension if not exists pgcrypto;

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  age int,
  sex text check (sex in ('male', 'female')),
  height_cm numeric,
  weight_kg numeric,
  activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal text check (goal in ('lose_fat', 'maintain', 'build_muscle')),
  target_weight_kg numeric,
  pace_kg_per_week numeric,
  dietary_pref text,
  theme_id text,
  accent_color text,
  updated_at timestamptz not null default now()
);

create table if not exists goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  calories int not null,
  protein_g int not null,
  carbs_g int not null,
  fat_g int not null,
  overridden boolean not null default false,
  computed_at timestamptz not null default now()
);

create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('photo', 'text')),
  photo_url text,
  raw_input text,
  confidence numeric,
  logged_at timestamptz not null default now()
);

create index if not exists idx_meals_user_logged_at on meals (user_id, logged_at desc);

create table if not exists meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references meals(id) on delete cascade,
  food_name text not null,
  quantity_value numeric not null,
  quantity_unit text not null,
  calories numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  matched_food_id text
);

create index if not exists idx_meal_items_meal_id on meal_items (meal_id);

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  meal_item_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_logged_date date
);

create table if not exists themes (
  id text primary key,
  name text not null,
  colors jsonb not null
);

-- Seed a couple of launch themes. DO NOTHING so admin edits in the
-- Supabase dashboard survive redeploys (see dev-playbook seeding pattern).
insert into themes (id, name, colors) values
  ('light-default', 'Fresh Light', '{"background": "#FFFFFF", "accent": "#22C55E", "text": "#111111"}'),
  ('dark-default', 'Midnight', '{"background": "#0B0B0F", "accent": "#22D3EE", "text": "#F5F5F5"}')
on conflict (id) do nothing;

-- Row Level Security: every table above is per-user data.
alter table profiles enable row level security;
alter table goals enable row level security;
alter table meals enable row level security;
alter table meal_items enable row level security;
alter table favorites enable row level security;
alter table streaks enable row level security;

create policy "profiles: owner access" on profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "goals: owner access" on goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "meals: owner access" on meals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "meal_items: owner access via meal" on meal_items
  for all using (exists (select 1 from meals m where m.id = meal_id and m.user_id = auth.uid()))
  with check (exists (select 1 from meals m where m.id = meal_id and m.user_id = auth.uid()));

create policy "favorites: owner access" on favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "streaks: owner access" on streaks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- themes is public read-only reference data — no RLS needed.
