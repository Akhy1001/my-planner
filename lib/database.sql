-- =====================================================
-- Mon Planner — Schéma Supabase
-- À coller dans : Supabase Dashboard → SQL Editor → New query
-- =====================================================

-- 1. TÂCHES DU JOUR
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  done boolean not null default false,
  priority text not null default 'medium',
  category text not null default 'Personnel',
  time text,
  date date not null default current_date,
  created_at timestamptz not null default now()
);
alter table tasks disable row level security;

-- 2. JOURNAL QUOTIDIEN (humeur, gratitude, intention, eau)
create table if not exists daily_journal (
  id uuid primary key default gen_random_uuid(),
  date date unique not null default current_date,
  mood int2,
  gratitude text[] not null default array['', '', ''],
  water_glasses int2 not null default 0
);
alter table daily_journal disable row level security;

-- 3. ÉVÉNEMENTS (agenda)
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  time text not null default '09:00',
  duration text not null default '1h',
  color text not null default 'var(--sage)',
  category text not null default 'Personnel',
  created_at timestamptz not null default now()
);
alter table events disable row level security;

-- 4. HABITUDES
create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null default '⭐',
  color text not null default 'var(--sage)',
  target int2 not null default 7,
  created_at timestamptz not null default now()
);
alter table habits disable row level security;

-- 5. COMPLÉTIONS D'HABITUDES
create table if not exists habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  completed_date date not null,
  unique(habit_id, completed_date)
);
alter table habit_completions disable row level security;

-- 6. OBJECTIFS
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'Personnel',
  progress int2 not null default 0,
  deadline date,
  color text not null default 'var(--sage)',
  created_at timestamptz not null default now()
);
alter table goals disable row level security;

-- 7. ÉTAPES (milestones)
create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references goals(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
alter table milestones disable row level security;

-- 8. NOTES
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Nouvelle note',
  content text not null default '',
  tag text not null default 'Personnel',
  color text not null default '#FAF7F2',
  pinned boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table notes disable row level security;
