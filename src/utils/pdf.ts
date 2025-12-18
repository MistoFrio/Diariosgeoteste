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
  
  const getSectionInfo = (section: HTMLElement | null): SectionInfo | null => {
    if (!section) return null;
    const rect = section.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const topPx = rect.top - elementRect.top + element.scrollTop;
    const heightPx = rect.height;
    const bottomPx = topPx + heightPx;
    const scale = 2.2;
    return {
      topPx,
      heightPx,
      bottomPx,
      topCanvas: topPx * scale,
      heightCanvas: heightPx * scale,
      bottomCanvas: (topPx + heightPx) * scale,
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
    scale: 2.2, // nitidez alta sem explodir o tamanho do arquivo
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    letterRendering: true,
    allowTaint: false,
    removeContainer: false,
    // Garantir que capture bordas completas
    width: element.scrollWidth,
    height: element.scrollHeight,
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
    // Logo
    if (logoDataUrl) {
      const logoHeight = 5;
      const logoWidth = 5;
      pdf.addImage(logoDataUrl, 'JPEG', marginMm, marginMm, logoWidth, logoHeight, undefined, 'FAST');
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
    // Verificar assinaturas primeiro com tratamento especial
    if (assinaturasInfo) {
      const assinaturasTop = assinaturasInfo.topCanvas;
      const assinaturasBottom = assinaturasInfo.bottomCanvas;
      
      // Se a assinatura já começou na página anterior mas ainda está sendo renderizada
      if (assinaturasTop < pageTop && assinaturasBottom > pageTop) {
        // Continuar renderizando até o final da assinatura
        sliceHeightPx = Math.min(assinaturasBottom - renderedHeightPx, canvas.height - renderedHeightPx);
        sectionProcessed = true;
        needsPageBreak = false;
      }
      // Se a assinatura começa nesta página ou está próxima do conteúdo atual
      else if (assinaturasTop >= pageTop) {
        // Calcular o espaço necessário para incluir a assinatura completa
        const spaceNeeded = assinaturasBottom - renderedHeightPx;
        
        // Se a assinatura cabe na página (permitindo até 20% de extensão se necessário)
        if (spaceNeeded <= pageHeightPx * 1.2) {
          // Sempre incluir a assinatura completa nesta página
          sliceHeightPx = Math.min(spaceNeeded, canvas.height - renderedHeightPx);
          sectionProcessed = true;
          needsPageBreak = false;
        }
        // Se a assinatura não cabe mesmo estendendo, mas está muito próxima
        else if (assinaturasTop - renderedHeightPx < pageHeightPx * 0.3) {
          // Incluir mesmo assim (a assinatura é pequena, então deve caber)
          sliceHeightPx = Math.min(assinaturasBottom - renderedHeightPx, canvas.height - renderedHeightPx);
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
        
      // Se a seção começa exatamente no início desta página, garantir que ela caiba inteira
        if (sectionInfo.topCanvas === renderedHeightPx) {
          const sectionHeight = sectionInfo.bottomCanvas - sectionInfo.topCanvas;
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
      
      // Se a seção seria cortada, ajustar
        if (sectionWouldBreak(sectionInfo)) {
        // Se a seção começa nesta página mas não cabe
          if (sectionInfo.topCanvas >= pageTop && sectionInfo.topCanvas < pageBottom) {
            // Cortar a página ANTES do início da seção para mantê-la íntegra
            const spaceBefore = sectionInfo.topCanvas - renderedHeightPx;
          // Se há pouco espaço antes da seção (< 10% da página), pular para a próxima página
          if (spaceBefore < pageHeightPx * 0.1) {
              newRenderedHeight = sectionInfo.topCanvas;
            needsPageBreak = true;
              sectionProcessed = true;
            break;
          } else {
              // Usar o espaço antes da seção (a seção começará no topo da próxima página)
            sliceHeightPx = spaceBefore;
              sectionProcessed = true;
              break;
            }
          } else if (sectionInfo.topCanvas < pageTop && sectionInfo.bottomCanvas > pageTop) {
            // Seção começou na página anterior, pular para onde ela termina
            newRenderedHeight = sectionInfo.bottomCanvas;
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

    const pageContext = pageCanvas.getContext('2d');
    if (!pageContext) {
      throw new Error('Erro ao gerar o PDF. Tente novamente.');
    }

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

    const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.92);
    const pageHeightMm = sliceHeightPx / pxPerMm;
    const offsetX = marginMm;
    const offsetY = showHeader ? marginMm + headerHeight : marginMm;

    pdf.addImage(pageImgData, 'JPEG', offsetX, offsetY, usableWidth, pageHeightMm, undefined, 'FAST');

    renderedHeightPx += sliceHeightPx;
    pageNumber += 1;
  }

  pdf.save(fileName);
}

