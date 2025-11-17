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
    <div className="w-full max-w-[790px] min-h-[1100px] bg-white text-gray-900 pt-3 xs:pt-4 sm:pt-5 md:pt-6 px-2 xs:px-3 sm:px-4 md:px-6 pb-2 xs:pb-3 sm:pb-4 md:pb-6 space-y-2 xs:space-y-3 sm:space-y-4 mx-auto overflow-x-hidden box-border">
      <header className="flex flex-col border-b-2 border-gray-400 pt-2 xs:pt-3 pb-2 xs:pb-3 gap-1.5 xs:gap-2 w-full relative z-10">
        <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 w-full min-w-0">
          <img src="/logogeoteste.png" alt="Geoteste" className="h-6 xs:h-7 sm:h-8 md:h-10 flex-shrink-0" />
          <div className="flex-1 min-w-0 relative z-10">
            <h1 className="text-xs xs:text-sm sm:text-base md:text-xl font-bold uppercase tracking-wide leading-tight break-words">{title}</h1>
            <p className="text-[10px] xs:text-xs sm:text-sm font-semibold mt-0.5 break-words">Cliente: {diary.clientName || '-'}</p>
          </div>
        </div>
        <div className="text-left text-[10px] xs:text-xs sm:text-sm font-semibold leading-tight space-y-0.5 w-full">
          <div className="break-words">Data: {diary.date ? new Date(diary.date).toLocaleDateString('pt-BR') : '-'}</div>
          <div className="break-words">Responsável: {diary.geotestSignature || '-'}</div>
        </div>
      </header>

      <div className="space-y-2 xs:space-y-3 sm:space-y-4 text-[10px] xs:text-xs w-full">{children}</div>

      <footer className="pt-2 xs:pt-3 sm:pt-4 mt-3 xs:mt-4 sm:mt-6 border-t-2 border-gray-400 text-[10px] xs:text-xs flex flex-col gap-2 sm:flex-row sm:justify-between sm:gap-0 w-full">
        <div className="break-words min-w-0 flex-1">
          <p className="font-semibold">Gontijo Fundações</p>
          <p>Nome: {diary.geotestSignature || '-'}</p>
        </div>
        <div className="text-left sm:text-right break-words min-w-0 flex-1">
          <p className="font-semibold">Responsável da obra</p>
          <p>{diary.responsibleSignature || '-'}</p>
        </div>
      </footer>
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
      <div className="min-h-[20px] xs:min-h-[24px] sm:min-h-[28px] flex items-center text-[9px] xs:text-[10px] sm:text-[11px] break-words">
        {placeholder ? <span className="border-b border-gray-400 w-full"></span> : value}
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
