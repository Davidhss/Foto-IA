-- ============================================================
-- SISTEMA DE TIMES / ISOLAMENTO DE DADOS
-- Execute este script no SQL Editor do Supabase
-- Após o setup-equipe.sql já ter sido executado
-- ============================================================

-- 1. Criar tabela de times
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
GRANT ALL ON teams TO anon;
GRANT ALL ON teams TO authenticated;

-- 2. Adicionar team_id na tabela de profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- 3. Atualizar o trigger de criação de usuário para incluir team_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_team_id UUID;
BEGIN
  -- Cria o perfil básico
  INSERT INTO public.profiles (id, nome, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', 'Usuário ' || substr(new.id::text, 1, 5)),
    COALESCE(new.raw_user_meta_data->>'role', 'vendedor')
  );

  -- Se vier um team_id no metadata, associa ao time
  IF new.raw_user_meta_data->>'team_id' IS NOT NULL THEN
    UPDATE public.profiles
    SET team_id = (new.raw_user_meta_data->>'team_id')::uuid
    WHERE id = new.id;
  ELSE
    -- Cria um time novo para o admin (caso seja o primeiro usuário / admin)
    IF COALESCE(new.raw_user_meta_data->>'role', 'vendedor') = 'admin' THEN
      INSERT INTO public.teams (name, owner_id)
      VALUES ('Meu Time', new.id)
      RETURNING id INTO v_team_id;

      UPDATE public.profiles
      SET team_id = v_team_id
      WHERE id = new.id;
    END IF;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- CONFIGURAÇÃO MANUAL DO TIME: DAVID + GABRIEL
-- Substitua os emails reais dos dois usuários abaixo
-- ============================================================

-- Passo 1: Cria um time chamado "FotoIA" para o David (admin)
-- (ajuste o email do David aqui)
DO $$
DECLARE
  v_david_id UUID;
  v_gabriel_id UUID;
  v_team_id UUID;
BEGIN
  -- Busca o ID do David pelo email (ajuste o email)
  SELECT p.id INTO v_david_id
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email ILIKE '%david%'
  LIMIT 1;

  -- Busca o ID do Gabriel pelo email (ajuste o email)
  SELECT p.id INTO v_gabriel_id
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email ILIKE '%gabriel%'
  LIMIT 1;

  IF v_david_id IS NOT NULL THEN
    -- Verifica se o David já tem um time
    SELECT team_id INTO v_team_id FROM profiles WHERE id = v_david_id;

    IF v_team_id IS NULL THEN
      -- Cria o time
      INSERT INTO teams (name, owner_id) VALUES ('Time FotoIA', v_david_id)
      RETURNING id INTO v_team_id;
    END IF;

    -- Associa David ao time
    UPDATE profiles SET team_id = v_team_id WHERE id = v_david_id;

    -- Associa Gabriel ao mesmo time (se encontrado)
    IF v_gabriel_id IS NOT NULL THEN
      UPDATE profiles SET team_id = v_team_id WHERE id = v_gabriel_id;
      RAISE NOTICE 'David e Gabriel adicionados ao time %', v_team_id;
    ELSE
      RAISE NOTICE 'David adicionado ao time %. Gabriel não encontrado — verifique o email.', v_team_id;
    END IF;
  ELSE
    RAISE NOTICE 'David não encontrado. Verifique o email no script.';
  END IF;
END $$;

-- ============================================================
-- VERIFICAÇÃO: rode para ver o resultado
-- ============================================================
SELECT
  p.nome,
  u.email,
  p.role,
  t.name AS time,
  p.team_id
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
LEFT JOIN teams t ON t.id = p.team_id
ORDER BY t.name, p.nome;
