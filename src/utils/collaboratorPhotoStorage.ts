import { supabase } from '../lib/supabaseClient';

// Função para comprimir a imagem da foto do colaborador
export const compressCollaboratorPhoto = (file: File, maxWidth: number = 500, quality: number = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Não foi possível obter contexto do canvas'));
          return;
        }
        
        // Calcular dimensões mantendo proporção
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Converter para blob JPEG
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Erro ao converter imagem para blob'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
};

// Função para fazer upload da foto do colaborador para o Supabase Storage
export const uploadCollaboratorPhoto = async (
  file: File,
  collaboratorId: string
): Promise<string | null> => {
  try {
    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Formato de arquivo não suportado. Use apenas imagens JPG, PNG ou WEBP.');
    }
    
    // Validar tamanho (máximo 5MB antes da compressão)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. O tamanho máximo permitido é 5MB.');
    }
    
    // Comprimir a imagem
    const compressedBlob = await compressCollaboratorPhoto(file, 500, 0.8);
    
    // Gerar nome único para o arquivo
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${collaboratorId}_${Date.now()}_photo.${fileExtension === 'jpg' ? 'jpg' : 'jpg'}`;
    
    // Fazer upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from('collaborator-photos')
      .upload(fileName, compressedBlob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true // Permitir sobrescrever
      });
    
    if (error) {
      console.error('Erro ao fazer upload da foto:', error);
      
      // Mensagem mais amigável para erro de bucket não encontrado
      if (error.message?.includes('not found') || error.message?.includes('Bucket not found')) {
        throw new Error('Configuração de armazenamento não encontrada. Entre em contato com o suporte técnico.');
      }
      
      throw error;
    }
    
    // Retornar URL pública da imagem
    const { data: { publicUrl } } = supabase.storage
      .from('collaborator-photos')
      .getPublicUrl(fileName);
    
    return publicUrl;
  } catch (error: any) {
    console.error('Erro ao processar foto do colaborador:', error);
    throw error;
  }
};

// Função para deletar foto antiga do storage
export const deleteOldCollaboratorPhoto = async (oldUrl: string): Promise<void> => {
  try {
    if (!oldUrl) return;
    
    // Extrair o nome do arquivo da URL
    const urlParts = oldUrl.split('/');
    const fileName = urlParts[urlParts.length - 1].split('?')[0]; // Remover query params
    
    if (!fileName) return;
    
    await supabase.storage
      .from('collaborator-photos')
      .remove([fileName]);
  } catch (error) {
    console.error('Erro ao deletar foto antiga:', error);
    // Não lançar erro para não bloquear outras operações
  }
};

