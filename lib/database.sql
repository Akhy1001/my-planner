-- =====================================================
-- Mon Planner — Schéma Supabase
-- À coller dans : Supabase Dashboard → SQL Editor → New query
-- =====================================================

-- 1. TÂCHES DU JOUR
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  text text not null,
  done boolean not null default false,
  priority text not null default 'medium',
  category text not null default 'Personnel',
  time text,
  date date not null default current_date,
  created_at timestamptz not null default now()
);
alter table tasks enable row level security;
create policy "tasks: select own"  on tasks for select using (auth.uid() = user_id);
create policy "tasks: insert own"  on tasks for insert with check (auth.uid() = user_id);
create policy "tasks: update own"  on tasks for update using (auth.uid() = user_id);
create policy "tasks: delete own"  on tasks for delete using (auth.uid() = user_id);

-- 2. JOURNAL QUOTIDIEN (humeur, gratitude, eau)
create table if not exists daily_journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  date date not null default current_date,
  mood int2,
  gratitude text[] not null default array['', '', ''],
  water_glasses int2 not null default 0,
  unique (date, user_id)
);
alter table daily_journal enable row level security;
create policy "journal: select own" on daily_journal for select using (auth.uid() = user_id);
create policy "journal: insert own" on daily_journal for insert with check (auth.uid() = user_id);
create policy "journal: update own" on daily_journal for update using (auth.uid() = user_id);
create policy "journal: delete own" on daily_journal for delete using (auth.uid() = user_id);

-- 3. ÉVÉNEMENTS (agenda)
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  title text not null,
  date date not null,
  time text not null default '09:00',
  duration text not null default '1h',
  color text not null default 'var(--sage)',
  category text not null default 'Personnel',
  recurrence text not null default 'none',
  created_at timestamptz not null default now()
);
-- Migration si la table existe déjà :
-- alter table events add column if not exists recurrence text not null default 'none';
alter table events enable row level security;
create policy "events: select own" on events for select using (auth.uid() = user_id);
create policy "events: insert own" on events for insert with check (auth.uid() = user_id);
create policy "events: update own" on events for update using (auth.uid() = user_id);
create policy "events: delete own" on events for delete using (auth.uid() = user_id);

-- 4. HABITUDES
create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  icon text not null default '⭐',
  color text not null default 'var(--sage)',
  target int2 not null default 7,
  created_at timestamptz not null default now()
);
alter table habits enable row level security;
create policy "habits: select own" on habits for select using (auth.uid() = user_id);
create policy "habits: insert own" on habits for insert with check (auth.uid() = user_id);
create policy "habits: update own" on habits for update using (auth.uid() = user_id);
create policy "habits: delete own" on habits for delete using (auth.uid() = user_id);

-- 5. COMPLÉTIONS D'HABITUDES
create table if not exists habit_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  habit_id uuid not null references habits(id) on delete cascade,
  completed_date date not null,
  unique(habit_id, completed_date)
);
alter table habit_completions enable row level security;
create policy "completions: select own" on habit_completions for select using (auth.uid() = user_id);
create policy "completions: insert own" on habit_completions for insert with check (auth.uid() = user_id);
create policy "completions: update own" on habit_completions for update using (auth.uid() = user_id);
create policy "completions: delete own" on habit_completions for delete using (auth.uid() = user_id);

-- 6. OBJECTIFS
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  title text not null,
  description text not null default '',
  category text not null default 'Personnel',
  progress int2 not null default 0,
  deadline date,
  color text not null default 'var(--sage)',
  created_at timestamptz not null default now()
);
alter table goals enable row level security;
create policy "goals: select own" on goals for select using (auth.uid() = user_id);
create policy "goals: insert own" on goals for insert with check (auth.uid() = user_id);
create policy "goals: update own" on goals for update using (auth.uid() = user_id);
create policy "goals: delete own" on goals for delete using (auth.uid() = user_id);

-- 7. ÉTAPES (milestones)
create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  goal_id uuid not null references goals(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
alter table milestones enable row level security;
create policy "milestones: select own" on milestones for select using (auth.uid() = user_id);
create policy "milestones: insert own" on milestones for insert with check (auth.uid() = user_id);
create policy "milestones: update own" on milestones for update using (auth.uid() = user_id);
create policy "milestones: delete own" on milestones for delete using (auth.uid() = user_id);

-- 8. NOTES
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  title text not null default 'Nouvelle note',
  content text not null default '',
  tag text not null default 'Personnel',
  color text not null default '#FAF7F2',
  pinned boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table notes enable row level security;
create policy "notes: select own" on notes for select using (auth.uid() = user_id);
create policy "notes: insert own" on notes for insert with check (auth.uid() = user_id);
create policy "notes: update own" on notes for update using (auth.uid() = user_id);
create policy "notes: delete own" on notes for delete using (auth.uid() = user_id);

-- 9. CYCLE MENSTRUEL
create table if not exists menstrual_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  start_date date not null,
  cycle_length int2 not null default 28,
  period_duration int2 not null default 5,
  updated_at timestamptz not null default now(),
  unique (user_id)
);
alter table menstrual_cycles enable row level security;
create policy "cycle: select own" on menstrual_cycles for select using (auth.uid() = user_id);
create policy "cycle: insert own" on menstrual_cycles for insert with check (auth.uid() = user_id);
create policy "cycle: update own" on menstrual_cycles for update using (auth.uid() = user_id);
create policy "cycle: delete own" on menstrual_cycles for delete using (auth.uid() = user_id);
