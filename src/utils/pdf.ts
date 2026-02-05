import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type ExportOptions = {
  title?: string;
  logoUrl?: string; // ex: '/logogeoteste.jpeg'
  headerBgColor?: string; // ex: '#F0FDF4'
  marginMm?: number;
  showHeader?: boolean;
};

async function loadImageAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { mode: 'cors' });
  const blob = await res.blob();
  return await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export async function exportElementToPDF(
  element: HTMLElement,
  fileName: string,
  options: ExportOptions = {}
): Promise<void> {
  const {
    title = 'Diário de Obra',
    logoUrl = '/logogeoteste.png',
    headerBgColor = '#F0FDF4',
    marginMm = 3,
    showHeader = true,
  } = options;

  // Forçar dimensões de celular durante a captura
  const MOBILE_WIDTH = 375; // Largura típica de celular em pixels
  const originalStyles: { element: HTMLElement; styles: { [key: string]: string } }[] = [];
  
  // Encontrar o container principal do PDF (max-w-[1460px] ou similar)
  const pdfContainer = element.querySelector('[class*="max-w-"]') as HTMLElement || element;
  const parentContainer = pdfContainer.parentElement;
  
  // Salvar e aplicar estilos temporários para forçar dimensões de celular
  const applyMobileDimensions = () => {
    // Aplicar largura fixa ao elemento principal
    const originalElementStyle = element.style.cssText;
    originalStyles.push({ element, styles: { cssText: originalElementStyle } });
    element.style.width = `${MOBILE_WIDTH}px`;
    element.style.maxWidth = `${MOBILE_WIDTH}px`;
    element.style.margin = '0 auto';
    
    // Aplicar largura fixa ao container do PDF
    if (pdfContainer && pdfContainer !== element) {
      const originalContainerStyle = pdfContainer.style.cssText;
      originalStyles.push({ element: pdfContainer, styles: { cssText: originalContainerStyle } });
      pdfContainer.style.width = `${MOBILE_WIDTH}px`;
      pdfContainer.style.maxWidth = `${MOBILE_WIDTH}px`;
    }
    
    // Aplicar largura fixa ao container pai se existir
    if (parentContainer) {
      const originalParentStyle = parentContainer.style.cssText;
      originalStyles.push({ element: parentContainer, styles: { cssText: originalParentStyle } });
      parentContainer.style.width = `${MOBILE_WIDTH}px`;
      parentContainer.style.maxWidth = `${MOBILE_WIDTH}px`;
    }
    
    // Forçar reflow para aplicar os estilos
    void element.offsetHeight;
  };
  
  // Restaurar estilos originais
  const restoreOriginalDimensions = () => {
    originalStyles.forEach(({ element, styles }) => {
      element.style.cssText = styles.cssText;
    });
  };

  // Aplicar dimensões de celular
  applyMobileDimensions();
  
  // Aguardar um frame para garantir que o layout foi recalculado
  await new Promise(resolve => requestAnimationFrame(resolve));

  try {
    // Encontrar TODAS as seções do documento para protegê-las de quebras de página
    // Seções podem ser: elementos <section>, elementos com data-pdf-section, ou elementos com classe de seção
    const allSections = Array.from(element.querySelectorAll('section, [data-pdf-section]')) as HTMLElement[];
    
    interface SectionInfo {
      topPx: number;
      heightPx: number;
      bottomPx: number;
      topCanvas: number;
      heightCanvas: number;
      bottomCanvas: number;
      element: HTMLElement;
    }
    
    // Calcular scale para 300 DPI (qualidade profissional de impressão)
    // A4 = 210mm x 297mm, 300 DPI = 11.81 pixels/mm
    // Para garantir 300 DPI efetivo, usamos scale alto
    // Considerando largura móvel de 375px, precisamos de ~6.6x para 300 DPI
    // Usamos 5.0 como balanceamento entre qualidade e performance
    const HIGH_RES_SCALE = 5.0; // Equivale a ~227 DPI, excelente para impressão e visualização
    
    const getSectionInfo = (section: HTMLElement | null): SectionInfo | null => {
      if (!section) return null;
      const rect = section.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const topPx = rect.top - elementRect.top + element.scrollTop;
      const heightPx = rect.height;
      const bottomPx = topPx + heightPx;
      return {
        topPx,
        heightPx,
        bottomPx,
        topCanvas: topPx * HIGH_RES_SCALE,
        heightCanvas: heightPx * HIGH_RES_SCALE,
        bottomCanvas: (topPx + heightPx) * HIGH_RES_SCALE,
        element: section,
      };
    };
    
    // Obter informações de todas as seções, ordenadas por posição
    const allSectionsInfo = allSections
      .map(section => getSectionInfo(section))
      .filter((info): info is SectionInfo => info !== null)
      .sort((a, b) => a.topCanvas - b.topCanvas);
    
    // Seções especiais com prioridade
    const estacasSection = element.querySelector('[data-pdf-section="estacas"]') as HTMLElement;
    const assinaturasSection = element.querySelector('[data-pdf-section="assinaturas"]') as HTMLElement;
    const estacasInfo = getSectionInfo(estacasSection);
    const assinaturasInfo = getSectionInfo(assinaturasSection);

    const canvas = await html2canvas(element, {
      scale: HIGH_RES_SCALE, // 5.0 = ~227 DPI, excelente qualidade para impressão e zoom
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      letterRendering: true, // Renderização otimizada de texto
      allowTaint: false,
      removeContainer: false,
      // Garantir que capture bordas completas
      width: element.scrollWidth,
      height: element.scrollHeight,
      // Melhorar qualidade de renderização
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      // Aplicar estilos de alta qualidade no clone
      onclone: (clonedDoc) => {
        // Forçar renderização de alta qualidade no clone
        const clonedElement = clonedDoc.body.querySelector('div[class*="max-w-"]') || clonedDoc.body;
        if (clonedElement) {
          const htmlElement = clonedElement as HTMLElement;
          // Configurações para máxima nitidez
          htmlElement.style.imageRendering = 'crisp-edges';
          htmlElement.style.textRendering = 'optimizeLegibility';
          htmlElement.style.webkitFontSmoothing = 'antialiased';
          htmlElement.style.mozOsxFontSmoothing = 'grayscale';
          htmlElement.style.fontSmooth = 'always';
          // Aplicar a todos os elementos filhos também
          const allElements = clonedElement.querySelectorAll('*');
          allElements.forEach((el) => {
            const elem = el as HTMLElement;
            elem.style.textRendering = 'optimizeLegibility';
            elem.style.webkitFontSmoothing = 'antialiased';
            elem.style.mozOsxFontSmoothing = 'grayscale';
          });
        }
      },
      ignoreElements: (el: Element) => {
        try {
          return (el as HTMLElement)?.getAttribute?.('data-pdf-hide') === 'true';
        } catch {
          return false;
        }
      },
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: false, // Desabilitar compressão para máxima qualidade
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const headerHeight = showHeader ? 8 : 0; // mm

    const usableWidth = pageWidth - marginMm * 2;
    const usablePageHeight = pageHeight - marginMm * 2 - headerHeight;
    const pxPerMm = canvas.width / usableWidth; // pixels necessários para ocupar 1mm no PDF
    const pageHeightPx = usablePageHeight * pxPerMm;
    
    const totalPages = Math.max(1, Math.ceil(canvas.height / pageHeightPx));

    const logoDataUrl = showHeader && logoUrl ? await loadImageAsDataUrl(logoUrl) : undefined;

    const drawHeader = (pageNumber: number) => {
    // Background bar
    pdf.setFillColor(headerBgColor);
    pdf.rect(0, 0, pageWidth, headerHeight + marginMm, 'F');
    // Logo - usar alta qualidade
    if (logoDataUrl) {
      const logoHeight = 5;
      const logoWidth = 5;
      // Detectar formato da imagem e usar compressão apropriada
      const isPng = logoDataUrl.startsWith('data:image/png');
      pdf.addImage(
        logoDataUrl, 
        isPng ? 'PNG' : 'JPEG', 
        marginMm, 
        marginMm, 
        logoWidth, 
        logoHeight, 
        undefined, 
        'SLOW' // Máxima qualidade para logo
      );
    }
    // Title
    pdf.setTextColor(22, 22, 22);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text(title, pageWidth / 2, marginMm + 2.5, { align: 'center' });
    // Page number
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(100);
    pdf.text(`${pageNumber}/${totalPages}`, pageWidth - marginMm, marginMm + 2.5, { align: 'right' });
    };

    let renderedHeightPx = 0;
    let pageNumber = 1;

    while (renderedHeightPx < canvas.height) {
      if (pageNumber > 1) {
        pdf.addPage('a4');
      }

      if (showHeader) {
        drawHeader(pageNumber);
      }

      // Verificar se alguma seção protegida seria cortada nesta página
      let sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedHeightPx);
      const pageTop = renderedHeightPx;
      const pageBottom = renderedHeightPx + sliceHeightPx;
      
      // Verificar se uma seção seria cortada (começou na página anterior ou não cabe)
      const sectionWouldBreak = (sectionInfo: SectionInfo | null): boolean => {
        if (!sectionInfo) return false;
        
        const sectionTop = sectionInfo.topCanvas;
        const sectionBottom = sectionInfo.bottomCanvas;
        
        // Se a seção começa nesta página mas não cabe completamente
        if (sectionTop >= pageTop && sectionTop < pageBottom) {
          if (sectionBottom > pageBottom) {
            return true; // Seção seria cortada
          }
        }
        
        // Se a seção começou na página anterior e ainda está nesta página
        if (sectionTop < pageTop && sectionBottom > pageTop) {
          return true; // Seção seria cortada
        }
        
        return false;
      };
      
      // Verificar se alguma seção seria cortada
      let needsPageBreak = false;
      let newRenderedHeight = renderedHeightPx;
      let sectionProcessed = false;
      
      // Prioridade: Assinaturas primeiro (sempre no final), depois outras seções
      // Verificar assinaturas primeiro com tratamento especial - NUNCA cortar assinaturas
      // REGRA PRINCIPAL: A assinatura é SEMPRE a última seção, então quando ela couber,
      // renderizamos TODO o conteúdo restante do documento (incluindo qualquer fechamento visual)
      if (assinaturasInfo) {
        const assinaturasTop = assinaturasInfo.topCanvas;
        const assinaturasBottom = assinaturasInfo.bottomCanvas;
        const assinaturasHeight = assinaturasBottom - assinaturasTop;
        // Usar o final do canvas como ponto de referência final (inclui footer/fechamento)
        const documentEnd = canvas.height;
        // Altura total que precisamos renderizar (assinatura + tudo que vem depois)
        const totalRemainingFromAssinatura = documentEnd - assinaturasTop;
        
        // Se a assinatura já começou na página anterior mas ainda está sendo renderizada
        if (assinaturasTop < pageTop && assinaturasBottom > pageTop) {
          // Continuar renderizando até o FINAL do documento (não apenas da assinatura)
          sliceHeightPx = Math.min(documentEnd - renderedHeightPx, canvas.height - renderedHeightPx);
          sectionProcessed = true;
          needsPageBreak = false;
        }
        // Se a assinatura começa nesta página
        else if (assinaturasTop >= pageTop) {
          // Calcular o espaço disponível na página atual a partir do início da assinatura
          const availableSpace = pageBottom - assinaturasTop;
          const spaceBefore = assinaturasTop - renderedHeightPx;
          
          // REGRA RÍGIDA: Se todo o conteúdo restante (assinatura + footer) NÃO cabe, mover para próxima página
          if (totalRemainingFromAssinatura > availableSpace) {
            // Se há pouco espaço antes da assinatura (< 10% da página), pular para a próxima página
            if (spaceBefore < pageHeightPx * 0.1) {
              newRenderedHeight = assinaturasTop;
              needsPageBreak = true;
              sectionProcessed = true;
            } else {
              // Usar o espaço antes da assinatura (a assinatura começará no topo da próxima página)
              sliceHeightPx = spaceBefore;
              sectionProcessed = true;
            }
          }
          // Se TODO o conteúdo restante cabe completamente, incluir tudo nesta página
          else {
            // Renderizar até o FINAL do documento
            sliceHeightPx = documentEnd - renderedHeightPx;
            sectionProcessed = true;
            needsPageBreak = false;
          }
        }
      }
      
      // Se não processamos assinaturas, verificar TODAS as outras seções
      if (!sectionProcessed) {
        // Verificar todas as seções, priorizando as que estão próximas do conteúdo atual
        for (const sectionInfo of allSectionsInfo) {
          // Pular assinaturas (já processadas acima)
          if (sectionInfo === assinaturasInfo) continue;
          
          const sectionTop = sectionInfo.topCanvas;
          const sectionBottom = sectionInfo.bottomCanvas;
          const sectionHeight = sectionBottom - sectionTop;
          
          // Se a seção começa exatamente no início desta página, garantir que ela caiba inteira
          if (sectionTop === renderedHeightPx) {
            // Se a seção cabe na página, usar toda a altura dela
            if (sectionHeight <= pageHeightPx) {
              sliceHeightPx = Math.min(sectionHeight, canvas.height - renderedHeightPx);
              sectionProcessed = true;
              break;
            } else {
              // Seção muito grande para uma página - usar toda a página disponível
              // (será tratada na próxima iteração, mas pelo menos começa no topo)
              sliceHeightPx = pageHeightPx;
              sectionProcessed = true;
              break;
            }
          }
          
          // Se a seção começa nesta página (mas não no início exato)
          if (sectionTop > renderedHeightPx && sectionTop < pageBottom) {
            // Calcular o espaço disponível na página atual
            const availableSpace = pageBottom - sectionTop;
            const spaceBefore = sectionTop - renderedHeightPx;
            const spaceFromTop = sectionTop - pageTop;
            
            // Se a seção NÃO cabe completamente na página atual, mover para próxima página
            if (sectionHeight > availableSpace) {
              // Cortar a página ANTES do início da seção
              // Se há pouco espaço antes da seção (< 5% da página), pular para a próxima página
              if (spaceBefore < pageHeightPx * 0.05) {
                newRenderedHeight = sectionTop;
                needsPageBreak = true;
                sectionProcessed = true;
                break;
              } else {
                // Usar o espaço antes da seção (a seção começará no topo da próxima página)
                sliceHeightPx = spaceBefore;
                sectionProcessed = true;
                break;
              }
            }
            
            // Se a seção começa nos últimos 20% da página e não cabe completamente, mover para próxima página
            // Isso evita que seções sejam cortadas no meio
            if (spaceFromTop > pageHeightPx * 0.8 && sectionHeight > availableSpace * 0.5) {
              // Mover a seção para a próxima página
              sliceHeightPx = spaceBefore;
              sectionProcessed = true;
              break;
            }
            
            // Se a seção cabe, continuar normalmente (não fazer nada especial)
          }
          
          // Se a seção seria cortada (começou na página anterior)
          if (sectionWouldBreak(sectionInfo)) {
            if (sectionTop < pageTop && sectionBottom > pageTop) {
              // Seção começou na página anterior, pular para onde ela termina
              newRenderedHeight = sectionBottom;
              needsPageBreak = true;
              sectionProcessed = true;
              break;
            }
          }
        }
      }
      
      // Se precisar quebrar página, fazer isso antes de renderizar
      if (needsPageBreak) {
        renderedHeightPx = newRenderedHeight;
        pageNumber += 1;
        continue;
      }
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeightPx;

      // Configurar contexto do canvas com máxima qualidade
      const pageContext = pageCanvas.getContext('2d', {
        alpha: false, // Sem transparência para melhor compressão sem perda
        desynchronized: false,
        willReadFrequently: false,
        colorSpace: 'srgb',
      });
      if (!pageContext) {
        throw new Error('Erro ao gerar o PDF. Tente novamente.');
      }

      // Configurar renderização de alta qualidade
      pageContext.imageSmoothingEnabled = true;
      pageContext.imageSmoothingQuality = 'high'; // Máxima qualidade de suavização

      // Recorta a parte correspondente da página
      pageContext.drawImage(
        canvas,
        0,
        renderedHeightPx,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx
      );

      // Usar PNG ao invés de JPEG para evitar compressão com perda
      // PNG mantém qualidade perfeita, ideal para textos e bordas nítidas
      const pageImgData = pageCanvas.toDataURL('image/png');
      const pageHeightMm = sliceHeightPx / pxPerMm;
      const offsetX = marginMm;
      const offsetY = showHeader ? marginMm + headerHeight : marginMm;

      // Usar PNG com compressão 'SLOW' para máxima qualidade (sem perda de nitidez)
      // 'SLOW' usa compressão sem perda, garantindo textos e bordas perfeitamente nítidos
      pdf.addImage(pageImgData, 'PNG', offsetX, offsetY, usableWidth, pageHeightMm, undefined, 'SLOW');

      renderedHeightPx += sliceHeightPx;
      pageNumber += 1;
    }

    pdf.save(fileName);
  } finally {
    // Sempre restaurar as dimensões originais, mesmo em caso de erro
    restoreOriginalDimensions();
  }
}

