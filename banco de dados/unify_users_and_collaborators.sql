-- =====================================================
-- Script consolidado: Unificar Usuários e Colaboradores
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- 1. Expandir tabela profiles com campos de colaborador
-- =====================================================

-- Adicionar campos de colaborador à tabela profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS collaborator_role TEXT,
  ADD COLUMN IF NOT EXISTS collaborator_status TEXT DEFAULT 'ativo' CHECK (collaborator_status IN ('ativo', 'inativo', 'férias', 'afastado')),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_collaborator_status ON public.profiles(collaborator_status);
CREATE INDEX IF NOT EXISTS idx_profiles_collaborator_role ON public.profiles(collaborator_role);

-- Trigger para atualizar updated_at (criar função se não existir)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $func$
BEGIN
  new.updated_at = now();
  return new;
END;
$func$ language plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW 
  EXECUTE PROCEDURE public.set_updated_at();

-- =====================================================
-- 2. Migrar dados de collaborators para profiles (se existir)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'collaborators') THEN
    
    UPDATE public.profiles p
    SET
      photo_url = COALESCE(p.photo_url, c.photo_url),
      phone = COALESCE(p.phone, c.phone),
      collaborator_role = COALESCE(p.collaborator_role, c.role),
      collaborator_status = COALESCE(p.collaborator_status, c.status)
    FROM public.collaborators c
    WHERE (p.email = c.email OR p.name = c.name)
      AND (p.photo_url IS NULL OR p.photo_url = '');
    
    RAISE NOTICE 'Dados migrados de collaborators para profiles. Verifique antes de deletar a tabela collaborators.';
  END IF;
END $$;

-- =====================================================
-- 3. Atualizar team_collaborators para referenciar profiles
-- =====================================================

-- Se a tabela team_collaborators existe, atualizar a referência
DO $$
BEGIN
  -- Verificar se team_collaborators existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'team_collaborators') THEN
    
    -- Remover constraint antiga se existir
    ALTER TABLE public.team_collaborators
      DROP CONSTRAINT IF EXISTS team_collaborators_collaborator_id_fkey;
    
    -- Adicionar nova constraint referenciando profiles
    ALTER TABLE public.team_collaborators
      ADD CONSTRAINT team_collaborators_collaborator_id_fkey
      FOREIGN KEY (collaborator_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
    
    RAISE NOTICE 'Tabela team_collaborators atualizada para referenciar profiles.';
  ELSE
    -- Se não existe, criar a tabela referenciando profiles diretamente
    CREATE TABLE IF NOT EXISTS public.team_collaborators (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
      collaborator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      role_in_team TEXT,
      assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      UNIQUE(team_id, collaborator_id)
    );
    
    -- Habilitar RLS
    ALTER TABLE public.team_collaborators ENABLE ROW LEVEL SECURITY;
    
    -- Índices
    CREATE INDEX IF NOT EXISTS idx_team_collaborators_team_id ON public.team_collaborators(team_id);
    CREATE INDEX IF NOT EXISTS idx_team_collaborators_collaborator_id ON public.team_collaborators(collaborator_id);
    
    -- Políticas RLS
    DROP POLICY IF EXISTS "team_collaborators_select_authenticated" ON public.team_collaborators;
    CREATE POLICY "team_collaborators_select_authenticated"
      ON public.team_collaborators
      FOR SELECT
      USING (auth.uid() IS NOT NULL);

    DROP POLICY IF EXISTS "team_collaborators_insert_admin" ON public.team_collaborators;
    CREATE POLICY "team_collaborators_insert_admin"
      ON public.team_collaborators
      FOR INSERT
      WITH CHECK (public.is_admin(auth.uid()));

    DROP POLICY IF EXISTS "team_collaborators_update_admin" ON public.team_collaborators;
    CREATE POLICY "team_collaborators_update_admin"
      ON public.team_collaborators
      FOR UPDATE
      USING (public.is_admin(auth.uid()));

    DROP POLICY IF EXISTS "team_collaborators_delete_admin" ON public.team_collaborators;
    CREATE POLICY "team_collaborators_delete_admin"
      ON public.team_collaborators
      FOR DELETE
      USING (public.is_admin(auth.uid()));
    
    RAISE NOTICE 'Tabela team_collaborators criada referenciando profiles.';
  END IF;
END $$;

-- =====================================================
-- 4. Verificação final
-- =====================================================

-- Verificar colunas adicionadas à tabela profiles
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('photo_url', 'phone', 'collaborator_role', 'collaborator_status', 'updated_at')
ORDER BY column_name;

-- Verificar referências de team_collaborators
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'team_collaborators'
  AND kcu.column_name = 'collaborator_id';

