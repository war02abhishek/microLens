-- MacroLens core schema — local Postgres (Docker) with app-managed auth.
-- Applied automatically on backend startup (see internal/store/migrate.go).
-- All statements are idempotent so re-running on every boot is safe.

create extension if not exists pgcrypto;

-- Each downloaded instance is a private, independent account (PRD §2.1).
-- We run our own bcrypt+JWT auth rather than Supabase Auth, so we own the
-- users table instead of referencing auth.users.
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  user_id uuid primary key references users(id) on delete cascade,
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
  user_id uuid primary key references users(id) on delete cascade,
  calories int not null,
  protein_g int not null,
  carbs_g int not null,
  fat_g int not null,
  overridden boolean not null default false,
  computed_at timestamptz not null default now()
);

create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
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
  user_id uuid not null references users(id) on delete cascade,
  label text not null,
  meal_item_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists streaks (
  user_id uuid primary key references users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_logged_date date
);

create table if not exists themes (
  id text primary key,
  name text not null,
  colors jsonb not null
);

-- Seed a couple of launch themes. DO NOTHING so admin edits survive redeploys
-- (see dev-playbook seeding pattern).
insert into themes (id, name, colors) values
  ('light-default', 'Fresh Light', '{"background": "#FFFFFF", "accent": "#22C55E", "text": "#111111"}'),
  ('dark-default', 'Midnight', '{"background": "#0B0B0F", "accent": "#22D3EE", "text": "#F5F5F5"}')
on conflict (id) do nothing;

-- Per-user data is scoped in application code (WHERE user_id = $1 in
-- internal/store), since auth lives in our Go JWT middleware rather than
-- Postgres — there's no auth.uid() to write RLS policies against here the
-- way there would be on Supabase. If this backend is later pointed at a
-- Supabase project instead of local Postgres, RLS policies keyed on
-- auth.uid() should be added back at that point.
