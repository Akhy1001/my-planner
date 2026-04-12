-- =====================================================
-- ÉTAPE 2 : Auth + RLS — À coller dans le SQL Editor
-- =====================================================

-- ① CRÉER LES UTILISATEURS
-- (Copie-colle les deux blocs séparément si besoin)

DO $$
DECLARE
  uid1 uuid := gen_random_uuid();
  uid2 uuid := gen_random_uuid();
BEGIN
  -- Utilisateur 1 : anas.fz1001@gmail.com
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, confirmation_token,
    recovery_token, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', uid1,
    'authenticated', 'authenticated', 'anas.fz1001@gmail.com',
    crypt('130825', gen_salt('bf')), NOW(),
    NOW(), NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    false, '', '', '', ''
  )
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    uid1, uid1,
    json_build_object('sub', uid1::text, 'email', 'anas.fz1001@gmail.com'),
    'email', NOW(), NOW(), NOW()
  )
  ON CONFLICT DO NOTHING;

  -- Utilisateur 2 : rstrpn05@gmail.com
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, confirmation_token,
    recovery_token, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', uid2,
    'authenticated', 'authenticated', 'rstrpn05@gmail.com',
    crypt('130825', gen_salt('bf')), NOW(),
    NOW(), NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    false, '', '', '', ''
  )
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    uid2, uid2,
    json_build_object('sub', uid2::text, 'email', 'rstrpn05@gmail.com'),
    'email', NOW(), NOW(), NOW()
  )
  ON CONFLICT DO NOTHING;

END;
$$;

-- ② AJOUTER user_id À TOUTES LES TABLES
ALTER TABLE tasks            ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE daily_journal    ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE events           ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE habits           ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE habit_completions ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE goals            ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE milestones       ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE notes            ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();

-- ③ ACTIVER LE RLS SUR TOUTES LES TABLES
ALTER TABLE tasks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_journal     ENABLE ROW LEVEL SECURITY;
ALTER TABLE events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits            ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes             ENABLE ROW LEVEL SECURITY;

-- ④ POLICIES : chaque utilisateur voit uniquement ses données
CREATE POLICY IF NOT EXISTS "own_tasks"             ON tasks             FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "own_journal"           ON daily_journal     FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "own_events"            ON events            FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "own_habits"            ON habits            FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "own_habit_completions" ON habit_completions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "own_goals"             ON goals             FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "own_milestones"        ON milestones        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "own_notes"             ON notes             FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
