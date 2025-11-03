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

  const canvas = await html2canvas(element, {
    scale: 3.0, // aumentar escala para melhor nitidez (dpi maior)
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    letterRendering: true,
    ignoreElements: (el: Element) => {
      try {
        return (el as HTMLElement)?.getAttribute?.('data-pdf-hide') === 'true';
      } catch {
        return false;
      }
    },
  });

  // Usar JPEG qualidade máxima para reduzir artefatos e manter bom tamanho
  const contentImgData = canvas.toDataURL('image/jpeg', 1.0);

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const headerHeight = showHeader ? 18 : 0; // mm

  const usableWidth = pageWidth - marginMm * 2;
  const contentImgWidth = usableWidth;
  const contentImgHeight = (canvas.height * contentImgWidth) / canvas.width;

  const usablePageHeight = pageHeight - marginMm * 2 - headerHeight;
  const totalPages = Math.max(1, Math.ceil(contentImgHeight / usablePageHeight));

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

  let heightLeft = contentImgHeight;
  let positionY = marginMm + headerHeight;

  // First page
  if (showHeader) {
    drawHeader(1);
  } else {
    // Sem cabeçalho: começar o conteúdo logo após a margem
    positionY = marginMm;
  }
  pdf.addImage(contentImgData, 'JPEG', marginMm, positionY, contentImgWidth, contentImgHeight, undefined, 'SLOW');
  heightLeft -= usablePageHeight;

  let currentPage = 1;
  while (heightLeft > 0) {
    pdf.addPage();
    currentPage += 1;
    if (showHeader) {
      drawHeader(currentPage);
    }
    positionY = (showHeader ? marginMm + headerHeight : marginMm) - (contentImgHeight - heightLeft);
    pdf.addImage(contentImgData, 'JPEG', marginMm, positionY, contentImgWidth, contentImgHeight, undefined, 'SLOW');
    heightLeft -= usablePageHeight;
  }

  pdf.save(fileName);
}


