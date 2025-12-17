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
    marginMm = 10,
    showHeader = true,
  } = options;

  // Encontrar a seção de assinaturas antes de gerar o canvas
  const assinaturasSection = element.querySelector('[data-pdf-section="assinaturas"]') as HTMLElement;
  let assinaturasTopPx: number | null = null;
  let assinaturasHeightPx: number | null = null;
  
  if (assinaturasSection) {
    const rect = assinaturasSection.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    assinaturasTopPx = rect.top - elementRect.top + element.scrollTop;
    assinaturasHeightPx = rect.height;
  }

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
  const headerHeight = showHeader ? 18 : 0; // mm

  const usableWidth = pageWidth - marginMm * 2;
  const usablePageHeight = pageHeight - marginMm * 2 - headerHeight;
  const pxPerMm = canvas.width / usableWidth; // pixels necessários para ocupar 1mm no PDF
  const pageHeightPx = usablePageHeight * pxPerMm;
  
  // Calcular posição da seção de assinaturas no canvas (considerando o scale)
  const scale = 2.2;
  const assinaturasTopCanvas = assinaturasTopPx !== null ? assinaturasTopPx * scale : null;
  const assinaturasHeightCanvas = assinaturasHeightPx !== null ? assinaturasHeightPx * scale : null;
  const assinaturasBottomCanvas = assinaturasTopCanvas !== null && assinaturasHeightCanvas !== null 
    ? assinaturasTopCanvas + assinaturasHeightCanvas 
    : null;
  
  const totalPages = Math.max(1, Math.ceil(canvas.height / pageHeightPx));

  const logoDataUrl = showHeader && logoUrl ? await loadImageAsDataUrl(logoUrl) : undefined;

  const drawHeader = (pageNumber: number) => {
    // Background bar
    pdf.setFillColor(headerBgColor);
    pdf.rect(0, 0, pageWidth, headerHeight + marginMm, 'F');
    // Logo
    if (logoDataUrl) {
      const logoHeight = 10;
      const logoWidth = 10;
      pdf.addImage(logoDataUrl, 'JPEG', marginMm, marginMm - 2, logoWidth, logoHeight, undefined, 'FAST');
    }
    // Title
    pdf.setTextColor(22, 22, 22);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(title, pageWidth / 2, marginMm + 4, { align: 'center' });
    // Page number
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(100);
    pdf.text(`${pageNumber}/${totalPages}`, pageWidth - marginMm, marginMm + 4, { align: 'right' });
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

    // Verificar se a seção de assinaturas seria cortada nesta página
    let sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedHeightPx);
    
    if (assinaturasTopCanvas !== null && assinaturasBottomCanvas !== null) {
      const pageTop = renderedHeightPx;
      const pageBottom = renderedHeightPx + sliceHeightPx;
      
      // Se a seção de assinaturas começa nesta página mas não cabe completamente
      if (assinaturasTopCanvas >= pageTop && assinaturasTopCanvas < pageBottom) {
        // Se a seção de assinaturas não cabe completamente nesta página
        if (assinaturasBottomCanvas > pageBottom) {
          // Ajustar para que a seção de assinaturas comece na próxima página
          // Cortar a página antes da seção de assinaturas
          sliceHeightPx = Math.max(0, assinaturasTopCanvas - renderedHeightPx);
          // Se não há espaço suficiente antes da seção, pular para a próxima página
          if (sliceHeightPx < pageHeightPx * 0.1) { // Menos de 10% da página
            // Pular para próxima página onde a seção de assinaturas começa
            renderedHeightPx = assinaturasTopCanvas;
            pageNumber += 1;
            continue;
          }
        }
      }
      
      // Se a seção de assinaturas começa exatamente no início desta página, garantir que ela caiba inteira
      if (assinaturasTopCanvas === renderedHeightPx) {
        // Garantir que a seção de assinaturas seja renderizada completamente
        sliceHeightPx = Math.min(assinaturasBottomCanvas - renderedHeightPx, canvas.height - renderedHeightPx);
      }
    }
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeightPx;

    const pageContext = pageCanvas.getContext('2d');
    if (!pageContext) {
      throw new Error('Não foi possível criar o contexto do canvas para o PDF.');
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

