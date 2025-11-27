-- =====================================================
-- Script para criar bucket de fotos de colaboradores no Supabase Storage
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- IMPORTANTE: Primeiro, crie o bucket manualmente na interface do Supabase:
-- 1. Vá em Storage (menu lateral do Supabase)
-- 2. Clique em "New bucket"
-- 3. Nome: collaborator-photos
-- 4. Marque "Public bucket" (para permitir acesso público às fotos)
-- 5. File size limit: 5242880 (5MB)
-- 6. Allowed MIME types: image/jpeg, image/png, image/webp
-- 7. Clique em "Create bucket"

-- OU tente criar via SQL (pode não funcionar dependendo das permissões):
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'collaborator-photos',
  'collaborator-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- =====================================================
-- Políticas RLS para o bucket collaborator-photos
-- =====================================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir acesso público às fotos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de fotos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização de fotos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão de fotos" ON storage.objects;

-- Política 1: Qualquer pessoa pode ver as fotos (bucket público)
CREATE POLICY "Permitir acesso público às fotos"
ON storage.objects FOR SELECT
USING (bucket_id = 'collaborator-photos');

-- Política 2: Usuários autenticados podem fazer upload
CREATE POLICY "Permitir upload de fotos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'collaborator-photos'
  AND auth.uid() IS NOT NULL
  AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp'))
);

-- Política 3: Usuários autenticados podem atualizar
CREATE POLICY "Permitir atualização de fotos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'collaborator-photos' AND auth.uid() IS NOT NULL)
WITH CHECK (bucket_id = 'collaborator-photos' AND auth.uid() IS NOT NULL);

-- Política 4: Usuários autenticados podem deletar
CREATE POLICY "Permitir exclusão de fotos"
ON storage.objects FOR DELETE
USING (bucket_id = 'collaborator-photos' AND auth.uid() IS NOT NULL);

-- =====================================================
-- Verificação
-- =====================================================

-- Verificar se o bucket foi criado
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'collaborator-photos';
