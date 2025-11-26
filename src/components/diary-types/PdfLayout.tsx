import React from 'react';

interface PdfLayoutProps {
  diary: any;
  title: string;
  children: React.ReactNode;
}

interface PdfSectionProps {
  title?: string;
  columns?: number;
  children: React.ReactNode;
}

interface PdfRowProps {
  label: string;
  value?: React.ReactNode;
  span?: number;
  placeholder?: boolean;
}

interface PdfValueProps {
  label?: string;
  checked?: boolean;
}

interface PdfTableProps {
  headers: string[];
  rows: Array<Array<React.ReactNode>>;
  columnWidths?: string;
}

export const PdfLayout: React.FC<PdfLayoutProps> = ({ diary, title, children }) => {
  return (
    <div className="w-full py-4 xs:py-6 sm:py-8">
      <div className="max-w-[900px] mx-auto px-2 xs:px-4">
        <div className="mx-auto w-full max-w-[794px] min-h-[1123px] bg-white text-gray-900 shadow-[0_8px_24px_rgba(15,23,42,0.08)] border border-gray-200 rounded-md pt-5 xs:pt-6 sm:pt-8 px-4 xs:px-6 sm:px-8 pb-5 xs:pb-6 sm:pb-8 flex flex-col gap-4 box-border">
          <header className="flex flex-col border-b border-gray-300 pb-3 xs:pb-4 gap-2 w-full">
            <div className="flex items-center gap-2 xs:gap-3 sm:gap-4 w-full min-w-0">
              <img src="/logogeoteste.png" alt="Geoteste" className="h-7 xs:h-8 sm:h-9 md:h-10 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h1 className="text-sm xs:text-base sm:text-lg md:text-xl font-serif font-semibold tracking-wide leading-tight break-words">
                  {title}
                </h1>
                <p className="text-[11px] xs:text-xs sm:text-sm font-medium mt-0.5 break-words">
                  Cliente: {diary.clientName || '-'}
                </p>
              </div>
            </div>
            <div className="text-left text-[10px] xs:text-xs sm:text-sm font-medium leading-tight space-y-0.5 w-full">
              <div className="break-words">
                Data: {diary.date ? new Date(diary.date).toLocaleDateString('pt-BR') : '-'}
              </div>
              <div className="break-words flex items-center gap-2">
                <span>Responsável:</span>
                <span className="flex-1 border-b border-gray-400 h-[1px]"></span>
              </div>
            </div>
          </header>

          <main className="flex-1 space-y-2 xs:space-y-3 sm:space-y-4 text-[10px] xs:text-xs w-full">
            {children}
          </main>

          {/* Rodapé simples, sem assinaturas para evitar duplicidade */}
          <footer className="pt-2 xs:pt-3 border-t border-gray-200 text-[9px] xs:text-[10px] text-gray-500 flex items-center justify-between">
            <span>Geoteste • Diário de Obra</span>
            <span>{diary.date ? new Date(diary.date).toLocaleDateString('pt-BR') : ''}</span>
          </footer>
        </div>
      </div>
    </div>
  );
};

export const PdfSection: React.FC<PdfSectionProps> = ({ title, columns = 3, children }) => {
  const template = `repeat(${columns}, minmax(0, 1fr))`;
  return (
    <section className="border border-gray-400 overflow-hidden w-full">
      {title && (
        <div className="bg-gray-200 border-b border-gray-400 px-1.5 xs:px-2 sm:px-3 py-1 xs:py-1.5 sm:py-2 font-bold uppercase text-[9px] xs:text-[10px] sm:text-[11px]">
          {title}
        </div>
      )}
      <div
        className="grid divide-x divide-gray-300 text-[9px] xs:text-[10px] sm:text-[11px] w-full"
        style={{ gridTemplateColumns: template, minWidth: 0 }}
      >
        {children}
      </div>
    </section>
  );
};

export const PdfRow: React.FC<PdfRowProps> = ({ label, value = '-', span = 1, placeholder }) => {
  const gridSpan = `span ${span} / span ${span}`;
  return (
    <div
      className="border-b border-gray-300 px-1 xs:px-1.5 sm:px-2 md:px-3 py-1 xs:py-1.5 sm:py-2 min-w-0 overflow-hidden"
      style={{ gridColumn: gridSpan }}
    >
      <p className="font-semibold uppercase text-[8px] xs:text-[9px] sm:text-[10px] mb-0.5 leading-tight break-words">{label}</p>
      <div className="min-h-[32px] xs:min-h-[40px] sm:min-h-[48px] flex items-center text-[9px] xs:text-[10px] sm:text-[11px] break-words">
        {placeholder ? <span className="border-b border-gray-400 w-full block h-20 mt-2"></span> : value}
      </div>
    </div>
  );
};

export const PdfValue: React.FC<PdfValueProps> = ({ label, checked }) => {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-flex items-center justify-center w-2 h-2 border border-gray-700">
        {checked ? <span className="w-1 h-1 bg-gray-800"></span> : null}
      </span>
      {label && <span>{label}</span>}
    </span>
  );
};

export const PdfTable: React.FC<PdfTableProps> = ({ headers, rows, columnWidths }) => {
  // Larguras padrão baseadas no número de colunas para evitar sobreposição
  // Em mobile, usa minmax(0, 1fr) para garantir que não ultrapasse a largura disponível
  const getDefaultWidths = (numCols: number) => {
    // Para mobile: usar minmax(0, 1fr) para evitar overflow
    // Isso garante que as colunas se ajustem proporcionalmente sem ultrapassar o container
    return `repeat(${numCols}, minmax(0, 1fr))`;
  };
  
  const template = columnWidths || getDefaultWidths(headers.length);
  
  return (
    <div className="border border-gray-300 overflow-x-auto w-full">
      <div className="w-full">
        <div
          className="grid bg-gray-100 text-[8px] xs:text-[9px] sm:text-[10px] font-semibold uppercase text-gray-800 w-full"
          style={{ gridTemplateColumns: template, minWidth: 0 }}
        >
          {headers.map((header, idx) => (
            <div key={idx} className="px-1 xs:px-1.5 sm:px-2 py-1 xs:py-1.5 sm:py-2 border-r border-gray-300 last:border-r-0 text-center min-w-0 overflow-hidden">
              <div className="break-words whitespace-normal leading-tight">{header}</div>
            </div>
          ))}
        </div>
        {rows.length > 0 ? (
          rows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className="grid text-[8px] xs:text-[9px] sm:text-[10px] text-gray-900 w-full"
              style={{ gridTemplateColumns: template, minWidth: 0 }}
            >
              {row.map((cell, cellIdx) => (
                <div
                  key={cellIdx}
                  className="px-1 xs:px-1.5 sm:px-2 py-1 xs:py-1.5 sm:py-2 border-t border-r border-gray-300 last:border-r-0 break-words text-center min-h-[28px] xs:min-h-[32px] flex items-center justify-center min-w-0 overflow-hidden"
                >
                  <span className="w-full text-center leading-tight break-words">{cell}</span>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="px-2 py-4 text-center text-[9px] xs:text-[10px] text-gray-500">Sem registros</div>
        )}
      </div>
    </div>
  );
};
