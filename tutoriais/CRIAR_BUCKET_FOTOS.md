# Como Criar o Bucket de Fotos de Colaboradores

## Método 1: Via Interface do Supabase (Recomendado)

1. **Acesse o Supabase Dashboard**
   - Acesse https://supabase.com/dashboard
   - Selecione seu projeto

2. **Navegue até Storage**
   - No menu lateral esquerdo, clique em **"Storage"**

3. **Criar Novo Bucket**
   - Clique no botão **"New bucket"** ou **"Create bucket"**

4. **Configurar o Bucket**
   - **Nome**: `collaborator-photos` (exatamente assim, sem espaços)
   - **Public bucket**: ✅ **Marque esta opção** (importante para permitir acesso público às fotos)
   - **File size limit**: `5242880` (5MB em bytes)
   - **Allowed MIME types**: Adicione:
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `image/webp`
   - Clique em **"Create bucket"**

5. **Executar Script SQL de Políticas**
   - Após criar o bucket, execute o script SQL: `banco de dados/create_collaborator_photos_bucket.sql`
   - Este script cria as políticas de segurança necessárias

## Método 2: Via SQL (Pode não funcionar dependendo das permissões)

Execute o script: `banco de dados/create_collaborator_photos_bucket.sql` no SQL Editor do Supabase.

## Verificação

Após criar o bucket, você pode verificar se está funcionando:

1. Vá em **Storage** > **collaborator-photos**
2. Deve aparecer uma lista vazia (ou com arquivos se já houver uploads)
3. Tente fazer upload de uma foto no sistema

## Solução de Problemas

### Erro: "Bucket not found"
- Certifique-se de que o bucket foi criado com o nome exato: `collaborator-photos`
- Verifique se você está no projeto correto do Supabase
- Tente recarregar a página

### Erro: "Permission denied"
- Execute o script SQL de políticas: `create_collaborator_photos_bucket.sql`
- Verifique se o bucket está marcado como **público**

### Erro: "File too large"
- Verifique se o limite está configurado para 5MB (5242880 bytes)

## Estrutura Final

Após a configuração, você terá:
- ✅ Bucket `collaborator-photos` criado e público
- ✅ Políticas RLS configuradas para permitir upload/download
- ✅ Sistema pronto para receber fotos de colaboradores

