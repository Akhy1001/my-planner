-- =====================================================
-- Migration DEV2-7 — Séparation des données par compte
-- À coller dans : Supabase Dashboard → SQL Editor → New query
-- =====================================================

-- -------------------------------------------------------
-- ÉTAPE 1 : Ajouter user_id sur toutes les tables
-- -------------------------------------------------------

alter table tasks          add column if not exists user_id uuid references auth.users(id);
alter table daily_journal  add column if not exists user_id uuid references auth.users(id);
alter table events         add column if not exists user_id uuid references auth.users(id);
alter table habits         add column if not exists user_id uuid references auth.users(id);
alter table habit_completions add column if not exists user_id uuid references auth.users(id);
alter table goals          add column if not exists user_id uuid references auth.users(id);
alter table milestones     add column if not exists user_id uuid references auth.users(id);
alter table notes          add column if not exists user_id uuid references auth.users(id);

-- -------------------------------------------------------
-- ÉTAPE 2 : Corriger la contrainte unique de daily_journal
-- (remplacer unique(date) par unique(date, user_id))
-- -------------------------------------------------------

alter table daily_journal drop constraint if exists daily_journal_date_key;
alter table daily_journal add constraint daily_journal_date_user_id_key unique (date, user_id);

-- -------------------------------------------------------
-- ÉTAPE 3 : Rattacher les données existantes au bon compte
-- Remplace les deux UUIDs ci-dessous par les vrais user_id
-- visibles dans : Supabase Dashboard → Authentication → Users
-- -------------------------------------------------------

-- UPDATE tasks          SET user_id = '<UUID_COMPTE_1>' WHERE user_id IS NULL;
-- UPDATE daily_journal  SET user_id = '<UUID_COMPTE_1>' WHERE user_id IS NULL;
-- UPDATE events         SET user_id = '<UUID_COMPTE_1>' WHERE user_id IS NULL;
-- UPDATE habits         SET user_id = '<UUID_COMPTE_1>' WHERE user_id IS NULL;
-- UPDATE habit_completions SET user_id = '<UUID_COMPTE_1>' WHERE user_id IS NULL;
-- UPDATE goals          SET user_id = '<UUID_COMPTE_1>' WHERE user_id IS NULL;
-- UPDATE milestones     SET user_id = '<UUID_COMPTE_1>' WHERE user_id IS NULL;
-- UPDATE notes          SET user_id = '<UUID_COMPTE_1>' WHERE user_id IS NULL;

-- -------------------------------------------------------
-- ÉTAPE 4 : Activer le RLS
-- -------------------------------------------------------

alter table tasks             enable row level security;
alter table daily_journal     enable row level security;
alter table events            enable row level security;
alter table habits            enable row level security;
alter table habit_completions enable row level security;
alter table goals             enable row level security;
alter table milestones        enable row level security;
alter table notes             enable row level security;

-- -------------------------------------------------------
-- ÉTAPE 5 : Créer les policies RLS
-- -------------------------------------------------------

-- tasks
create policy "tasks: select own"  on tasks for select using (auth.uid() = user_id);
create policy "tasks: insert own"  on tasks for insert with check (auth.uid() = user_id);
create policy "tasks: update own"  on tasks for update using (auth.uid() = user_id);
create policy "tasks: delete own"  on tasks for delete using (auth.uid() = user_id);

-- daily_journal
create policy "journal: select own" on daily_journal for select using (auth.uid() = user_id);
create policy "journal: insert own" on daily_journal for insert with check (auth.uid() = user_id);
create policy "journal: update own" on daily_journal for update using (auth.uid() = user_id);
create policy "journal: delete own" on daily_journal for delete using (auth.uid() = user_id);

-- events
create policy "events: select own" on events for select using (auth.uid() = user_id);
create policy "events: insert own" on events for insert with check (auth.uid() = user_id);
create policy "events: update own" on events for update using (auth.uid() = user_id);
create policy "events: delete own" on events for delete using (auth.uid() = user_id);

-- habits
create policy "habits: select own" on habits for select using (auth.uid() = user_id);
create policy "habits: insert own" on habits for insert with check (auth.uid() = user_id);
create policy "habits: update own" on habits for update using (auth.uid() = user_id);
create policy "habits: delete own" on habits for delete using (auth.uid() = user_id);

-- habit_completions
create policy "completions: select own" on habit_completions for select using (auth.uid() = user_id);
create policy "completions: insert own" on habit_completions for insert with check (auth.uid() = user_id);
create policy "completions: update own" on habit_completions for update using (auth.uid() = user_id);
create policy "completions: delete own" on habit_completions for delete using (auth.uid() = user_id);

-- goals
create policy "goals: select own" on goals for select using (auth.uid() = user_id);
create policy "goals: insert own" on goals for insert with check (auth.uid() = user_id);
create policy "goals: update own" on goals for update using (auth.uid() = user_id);
create policy "goals: delete own" on goals for delete using (auth.uid() = user_id);

-- milestones
create policy "milestones: select own" on milestones for select using (auth.uid() = user_id);
create policy "milestones: insert own" on milestones for insert with check (auth.uid() = user_id);
create policy "milestones: update own" on milestones for update using (auth.uid() = user_id);
create policy "milestones: delete own" on milestones for delete using (auth.uid() = user_id);

-- notes
create policy "notes: select own" on notes for select using (auth.uid() = user_id);
create policy "notes: insert own" on notes for insert with check (auth.uid() = user_id);
create policy "notes: update own" on notes for update using (auth.uid() = user_id);
create policy "notes: delete own" on notes for delete using (auth.uid() = user_id);
