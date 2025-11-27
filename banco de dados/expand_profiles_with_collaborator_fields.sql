-- =====================================================
-- Script para expandir a tabela profiles com campos de colaborador
-- Este script unifica colaboradores com usuários do sistema
-- =====================================================

-- Adicionar campos de colaborador à tabela profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS collaborator_role TEXT, -- Função/cargo do colaborador (ex: Operador, Ajudante)
  ADD COLUMN IF NOT EXISTS collaborator_status TEXT DEFAULT 'ativo' CHECK (collaborator_status IN ('ativo', 'inativo', 'férias', 'afastado')),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_collaborator_status ON public.profiles(collaborator_status);
CREATE INDEX IF NOT EXISTS idx_profiles_collaborator_role ON public.profiles(collaborator_role);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW 
  EXECUTE PROCEDURE public.set_updated_at();

-- =====================================================
-- Migrar dados de collaborators para profiles (se a tabela collaborators existir)
-- =====================================================

DO $$
BEGIN
  -- Se a tabela collaborators existir, migrar dados
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'collaborators') THEN
    
    -- Atualizar profiles existentes com dados de collaborators pelo email ou nome
    UPDATE public.profiles p
    SET
      photo_url = c.photo_url,
      phone = c.phone,
      collaborator_role = c.role,
      collaborator_status = c.status
    FROM public.collaborators c
    WHERE (p.email = c.email OR p.name = c.name)
      AND (p.photo_url IS NULL OR p.photo_url = '');
    
    -- Nota: Não vamos deletar a tabela collaborators automaticamente
    -- O administrador pode fazer isso manualmente após verificar a migração
    RAISE NOTICE 'Dados migrados de collaborators para profiles. Verifique antes de deletar a tabela collaborators.';
  END IF;
END $$;

-- =====================================================
-- Atualizar referências em team_collaborators para usar profiles
-- =====================================================

-- Se team_collaborators existe e referencia collaborators, precisamos atualizar
-- Por enquanto, vamos apenas documentar que deve referenciar profiles

-- Verificar se a tabela team_collaborators referencia collaborators
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu 
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_schema = 'public' 
      AND tc.table_name = 'team_collaborators'
      AND ccu.table_name = 'collaborators'
  ) THEN
    -- Se houver referência a collaborators, podemos criar uma view ou atualizar
    RAISE NOTICE 'A tabela team_collaborators referencia collaborators. Considere atualizar para referenciar profiles.';
  END IF;
END $$;

-- =====================================================
-- Verificação final
-- =====================================================

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('photo_url', 'phone', 'collaborator_role', 'collaborator_status', 'updated_at')
ORDER BY column_name;

