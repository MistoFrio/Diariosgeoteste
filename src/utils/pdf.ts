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

  // Usar JPEG com compressão leve para segurar tamanho do arquivo
  const contentImgData = canvas.toDataURL('image/jpeg', 0.92);

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const headerHeight = showHeader ? 18 : 0; // mm

  const usableWidth = pageWidth - marginMm * 2;
  const usablePageHeight = pageHeight - marginMm * 2 - headerHeight;
  const totalPages = 1;

  // Forçar o conteúdo inteiro dentro da página única
  const widthRatio = usableWidth / canvas.width;
  const heightRatio = usablePageHeight / canvas.height;
  const scaleFactor = Math.min(1, widthRatio, heightRatio);
  const targetWidth = canvas.width * scaleFactor;
  const targetHeight = canvas.height * scaleFactor;

  // Centralizar se sobrar espaço
  const offsetX = marginMm + (usableWidth - targetWidth) / 2;
  const baseY = showHeader ? marginMm + headerHeight : marginMm;
  const offsetY = baseY + Math.max(0, (usablePageHeight - targetHeight) / 2);

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

  if (showHeader) {
    drawHeader(1);
  } else {
    // Sem cabeçalho: nada especial
  }
  pdf.addImage(contentImgData, 'JPEG', offsetX, offsetY, targetWidth, targetHeight, undefined, 'FAST');

  pdf.save(fileName);
}


