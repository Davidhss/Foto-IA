-- ============================================================
-- ATUALIZAÇÃO PARA MULTI-USUÁRIO (EQUIPE)
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Criar tabela de perfis vinculada ao Auth
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  role TEXT DEFAULT 'vendedor' CHECK (role IN ('admin', 'vendedor', 'editor')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS em profiles (mas como as tabelas antigas estavam abertas, vamos deixar simples por enquanto)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO authenticated;

-- 2. Trigger para criar perfil automaticamente ao cadastrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'nome', 'Usuário ' || substr(new.id::text, 1, 5)),
    COALESCE(new.raw_user_meta_data->>'role', 'vendedor')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop se já existir e cria o trigger no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Adicionar colunas na tabela de leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS editor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. Adicionar colunas na tabela de metas (para termos metas individuais no dia)
ALTER TABLE metas ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Como a chave primária de metas era apenas 'data', precisamos alterá-la para permitir uma meta por usuário por dia
ALTER TABLE metas DROP CONSTRAINT IF EXISTS metas_pkey;
ALTER TABLE metas ADD CONSTRAINT metas_pkey PRIMARY KEY (data, vendedor_id);

-- Caso existam metas antigas com vendedor_id nulo, e o comando acima falhar,
-- delete as metas antigas antes (descomente abaixo se necessário):
-- DELETE FROM metas WHERE vendedor_id IS NULL;

-- ============================================================
-- AVISO: 
-- Você precisará criar a primeira conta Admin diretamente no 
-- painel do Supabase (Authentication -> Add user) 
-- ou via código na página de Cadastro.
-- ============================================================
