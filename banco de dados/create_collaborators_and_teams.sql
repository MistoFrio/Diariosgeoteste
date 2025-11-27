-- =====================================================
-- Script de criação de tabelas para Colaboradores e Equipes
-- Pode ser executado múltiplas vezes sem erros
-- =====================================================

-- =====================================================
-- 1. Tabela de Colaboradores
-- =====================================================

CREATE TABLE IF NOT EXISTS public.collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  photo_url TEXT, -- URL da foto no Supabase Storage
  phone TEXT,
  email TEXT,
  role TEXT, -- Ex: "Operador", "Ajudante", "Encarregado", etc.
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'férias', 'afastado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_collaborators_name ON public.collaborators USING gin (to_tsvector('portuguese', name));
CREATE INDEX IF NOT EXISTS idx_collaborators_status ON public.collaborators(status);
CREATE INDEX IF NOT EXISTS idx_collaborators_created_at ON public.collaborators(created_at);

-- Políticas RLS: usuários autenticados podem ler todos os colaboradores
DROP POLICY IF EXISTS "collaborators_select_authenticated" ON public.collaborators;
CREATE POLICY "collaborators_select_authenticated"
  ON public.collaborators
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Apenas admins podem inserir/atualizar/deletar colaboradores
DROP POLICY IF EXISTS "collaborators_insert_admin" ON public.collaborators;
CREATE POLICY "collaborators_insert_admin"
  ON public.collaborators
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "collaborators_update_admin" ON public.collaborators;
CREATE POLICY "collaborators_update_admin"
  ON public.collaborators
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "collaborators_delete_admin" ON public.collaborators;
CREATE POLICY "collaborators_delete_admin"
  ON public.collaborators
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trg_collaborators_updated ON public.collaborators;
CREATE TRIGGER trg_collaborators_updated
  BEFORE UPDATE ON public.collaborators
  FOR EACH ROW 
  EXECUTE PROCEDURE public.set_updated_at();

-- =====================================================
-- 2. Tabela de Equipes
-- =====================================================

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX IF NOT EXISTS idx_teams_name ON public.teams(name);
CREATE INDEX IF NOT EXISTS idx_teams_status ON public.teams(status);

-- Políticas RLS: usuários autenticados podem ler todas as equipes
DROP POLICY IF EXISTS "teams_select_authenticated" ON public.teams;
CREATE POLICY "teams_select_authenticated"
  ON public.teams
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Apenas admins podem inserir/atualizar/deletar equipes
DROP POLICY IF EXISTS "teams_insert_admin" ON public.teams;
CREATE POLICY "teams_insert_admin"
  ON public.teams
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "teams_update_admin" ON public.teams;
CREATE POLICY "teams_update_admin"
  ON public.teams
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "teams_delete_admin" ON public.teams;
CREATE POLICY "teams_delete_admin"
  ON public.teams
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trg_teams_updated ON public.teams;
CREATE TRIGGER trg_teams_updated
  BEFORE UPDATE ON public.teams
  FOR EACH ROW 
  EXECUTE PROCEDURE public.set_updated_at();

-- =====================================================
-- 3. Tabela de Associação Colaborador-Equipe (muitos para muitos)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.team_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  role_in_team TEXT, -- Ex: "Líder", "Membro", etc.
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(team_id, collaborator_id)
);

-- Habilitar RLS
ALTER TABLE public.team_collaborators ENABLE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX IF NOT EXISTS idx_team_collaborators_team_id ON public.team_collaborators(team_id);
CREATE INDEX IF NOT EXISTS idx_team_collaborators_collaborator_id ON public.team_collaborators(collaborator_id);

-- Políticas RLS: usuários autenticados podem ler todas as associações
DROP POLICY IF EXISTS "team_collaborators_select_authenticated" ON public.team_collaborators;
CREATE POLICY "team_collaborators_select_authenticated"
  ON public.team_collaborators
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Apenas admins podem inserir/atualizar/deletar associações
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

-- =====================================================
-- 4. Tabela de Associação Equipe-Equipamento
-- =====================================================

-- Primeiro, verificar se a tabela equipment_locations existe
-- Se não existir, criar uma referência genérica

CREATE TABLE IF NOT EXISTS public.team_equipment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL, -- Referência para equipment_locations (FK opcional se a tabela existir)
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_until TIMESTAMP WITH TIME ZONE, -- NULL = sem data de término (atualmente ativo)
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'finalizado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.team_equipment_assignments ENABLE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX IF NOT EXISTS idx_team_equipment_team_id ON public.team_equipment_assignments(team_id);
CREATE INDEX IF NOT EXISTS idx_team_equipment_equipment_id ON public.team_equipment_assignments(equipment_id);
CREATE INDEX IF NOT EXISTS idx_team_equipment_status ON public.team_equipment_assignments(status);
CREATE INDEX IF NOT EXISTS idx_team_equipment_active ON public.team_equipment_assignments(equipment_id, status) WHERE status = 'ativo';

-- Políticas RLS: usuários autenticados podem ler todas as associações
DROP POLICY IF EXISTS "team_equipment_select_authenticated" ON public.team_equipment_assignments;
CREATE POLICY "team_equipment_select_authenticated"
  ON public.team_equipment_assignments
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Apenas admins podem inserir/atualizar/deletar associações
DROP POLICY IF EXISTS "team_equipment_insert_admin" ON public.team_equipment_assignments;
CREATE POLICY "team_equipment_insert_admin"
  ON public.team_equipment_assignments
  FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "team_equipment_update_admin" ON public.team_equipment_assignments;
CREATE POLICY "team_equipment_update_admin"
  ON public.team_equipment_assignments
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "team_equipment_delete_admin" ON public.team_equipment_assignments;
CREATE POLICY "team_equipment_delete_admin"
  ON public.team_equipment_assignments
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trg_team_equipment_updated ON public.team_equipment_assignments;
CREATE TRIGGER trg_team_equipment_updated
  BEFORE UPDATE ON public.team_equipment_assignments
  FOR EACH ROW 
  EXECUTE PROCEDURE public.set_updated_at();

-- =====================================================
-- 5. Criar bucket no Storage para fotos de colaboradores
-- =====================================================

-- Nota: O bucket deve ser criado manualmente no painel do Supabase Storage
-- Nome sugerido: 'collaborator-photos'
-- Configuração: Público: Sim, File size limit: 5MB, Allowed MIME types: image/jpeg, image/png, image/webp

-- Políticas do Storage (se o bucket já existir)
-- Execute separadamente no SQL Editor do Supabase:

/*
-- Política para permitir que usuários vejam fotos de colaboradores
CREATE POLICY "Permitir acesso público às fotos de colaboradores"
ON storage.objects FOR SELECT
USING (bucket_id = 'collaborator-photos');

-- Política para permitir que admins façam upload de fotos
CREATE POLICY "Admins podem fazer upload de fotos de colaboradores"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'collaborator-photos' 
  AND public.is_admin(auth.uid())
  AND (storage.extension(name) = 'jpg' OR storage.extension(name) = 'jpeg' OR storage.extension(name) = 'png' OR storage.extension(name) = 'webp')
);

-- Política para permitir que admins atualizem fotos
CREATE POLICY "Admins podem atualizar fotos de colaboradores"
ON storage.objects FOR UPDATE
USING (bucket_id = 'collaborator-photos' AND public.is_admin(auth.uid()))
WITH CHECK (bucket_id = 'collaborator-photos' AND public.is_admin(auth.uid()));

-- Política para permitir que admins deletem fotos
CREATE POLICY "Admins podem deletar fotos de colaboradores"
ON storage.objects FOR DELETE
USING (bucket_id = 'collaborator-photos' AND public.is_admin(auth.uid()));
*/

-- =====================================================
-- Verificação das tabelas criadas
-- =====================================================

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('collaborators', 'teams', 'team_collaborators', 'team_equipment_assignments')
ORDER BY table_name;

