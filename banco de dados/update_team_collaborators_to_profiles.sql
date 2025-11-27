-- =====================================================
-- Script para atualizar team_collaborators para referenciar profiles
-- ao invés de collaborators (unificação de usuários e colaboradores)
-- =====================================================

-- Verificar se a tabela team_collaborators existe e referencia collaborators
DO $$
BEGIN
  -- Se a tabela team_collaborators existe e tem referência a collaborators
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu 
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_schema = 'public' 
      AND tc.table_name = 'team_collaborators'
      AND ccu.table_name = 'collaborators'
  ) THEN
    -- Remover constraint antiga
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
    -- Se a tabela não existe ou não tem a referência, criar/atualizar
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'team_collaborators') THEN
      CREATE TABLE IF NOT EXISTS public.team_collaborators (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
        collaborator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        role_in_team TEXT,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        UNIQUE(team_id, collaborator_id)
      );
      
      RAISE NOTICE 'Tabela team_collaborators criada referenciando profiles.';
    END IF;
  END IF;
END $$;

-- Verificar se a estrutura está correta
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

