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
    <div className="w-full py-1">
      <div className="max-w-[1600px] mx-auto px-0">
        <div className="mx-auto w-full max-w-[1460px] bg-white text-gray-900 border border-gray-200 rounded-md pt-0.5 px-0.5 pb-0.5 flex flex-col gap-0 box-border">
          <header className="flex items-center justify-between border-b border-gray-300 pb-0.5 gap-1.5 w-full">
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <img src="/logogeoteste.png" alt="Geoteste" className="h-3.5 flex-shrink-0" />
              <h1 className="text-[7px] font-serif font-semibold tracking-wide leading-tight whitespace-nowrap">
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-[6px] font-medium leading-tight flex-shrink-0">
              <span className="whitespace-nowrap">Cliente: {diary.clientName || '-'}</span>
              <span className="whitespace-nowrap">Data: {diary.date ? new Date(diary.date).toLocaleDateString('pt-BR') : '-'}</span>
            </div>
          </header>

          <main className="flex-1 space-y-1 text-[7px] w-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export const PdfSection: React.FC<PdfSectionProps> = ({ title, columns = 3, children }) => {
  const template = `repeat(${columns}, minmax(0, 1fr))`;
  const isAssinaturas = title?.toUpperCase().includes('ASSINATURA');
  return (
    <section 
      className={`border border-gray-400 overflow-hidden w-full ${isAssinaturas ? 'border-b-2 border-b-gray-700' : ''}`}
      data-pdf-section={isAssinaturas ? 'assinaturas' : undefined}
    >
      {title && (
        <div className="bg-gray-200 border-b border-gray-400 px-0.5 py-1.5 font-bold uppercase text-[7px]">
          {title}
        </div>
      )}
      <div
        className="grid divide-x divide-gray-300 text-[7px] w-full"
        style={{ gridTemplateColumns: template, minWidth: 0 }}
      >
        {children}
      </div>
    </section>
  );
};

export const PdfRow: React.FC<PdfRowProps> = ({ label, value = '-', span = 1, placeholder }) => {
  const gridSpan = `span ${span} / span ${span}`;
  const labelStr = typeof label === 'string' ? label.toUpperCase() : '';
  const isEquipamento = labelStr.includes('EQUIPAMENTO');
  const labelTextClasses = isEquipamento 
    ? 'text-[7px] whitespace-nowrap'
    : 'text-[7px] break-words';
  const containerClasses = isEquipamento
    ? 'border-b border-gray-300 pl-0.5 pr-0.5 py-1 min-w-0 overflow-hidden'
    : 'border-b border-gray-300 px-0.5 py-1 min-w-0 overflow-hidden';
  return (
    <div
      className={containerClasses}
      style={{ gridColumn: gridSpan }}
    >
      <p className={`font-semibold uppercase ${labelTextClasses} mb-0 leading-tight`}>{label}</p>
      <div className="min-h-[16px] flex items-center text-[7px] break-words">
        {placeholder ? <span className="border-b border-gray-400 w-full block h-12 mt-1"></span> : value}
      </div>
    </div>
  );
};

export const PdfValue: React.FC<PdfValueProps> = ({ label, checked }) => {
  return (
    <span style={{ 
      display: 'inline-block',
      height: '7px',
      lineHeight: '7px',
      verticalAlign: 'top'
    }}>
      <span 
        style={{ 
          width: '5.5px', 
          height: '5.5px', 
          border: '0.5px solid #374151',
          display: 'inline-block',
          verticalAlign: 'top',
          marginRight: '3px',
          marginTop: '0.75px',
          backgroundColor: '#ffffff',
          position: 'relative'
        }}
      >
        {checked && (
          <span style={{ 
            width: '2.5px', 
            height: '2.5px', 
            backgroundColor: '#1f2937',
            display: 'block',
            position: 'absolute',
            top: '1.25px',
            left: '1.25px'
          }}></span>
        )}
      </span>
      <span 
        style={{ 
          fontSize: '7px',
          lineHeight: '0px',
          verticalAlign: 'top',
          display: 'inline-block',
          height: '7px',
          paddingTop: '0px',
          marginTop: '0px'
        }}
      >
        {label}
      </span>
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
  
  // Função para determinar o tamanho da fonte baseado no comprimento do título
  // Títulos longos que tendem a quebrar recebem fonte menor
  const getHeaderFontSize = (header: string): string => {
    const headerLength = header.length;
    // Lista de padrões de títulos que tendem a quebrar (com parênteses, unidades, etc)
    const longTitlePatterns = [
      'ARRASAMENTO',
      'PROFUNDIDADE',
      'COMPRIMENTO',
      'DIÂMETRO',
      'CARGA',
      'TRABALHO',
      'ENSAIO'
    ];
    
    const hasLongPattern = longTitlePatterns.some(pattern => header.includes(pattern));
    
    // Se o título tem mais de 13 caracteres OU contém padrões longos, reduz o tamanho da fonte
    // Isso previne quebras de linha desnecessárias
    if (headerLength > 13 || hasLongPattern) {
      return 'text-[6px]'; // Fonte menor para títulos longos
    }
    return 'text-[7px]'; // Fonte padrão
  };
  
  const template = columnWidths || getDefaultWidths(headers.length);
  
  return (
    <div className="border border-gray-300 overflow-x-auto w-full">
      <div className="w-full">
        <div
          className="grid bg-gray-100 text-[7px] font-semibold uppercase text-gray-800 w-full"
          style={{ gridTemplateColumns: template, minWidth: 0 }}
        >
          {headers.map((header, idx) => {
            const headerStr = typeof header === 'string' ? header.toUpperCase() : '';
            const isEquipamento = headerStr.includes('EQUIPAMENTO');
            const fontSize = getHeaderFontSize(headerStr);
            const headerClasses = isEquipamento
              ? `whitespace-nowrap leading-tight ${fontSize}`
              : `break-words whitespace-normal leading-tight ${fontSize}`;
            const headerContainerClasses = isEquipamento
              ? 'pl-0.5 pr-0.5 py-0.5 border-r border-gray-300 last:border-r-0 text-center min-w-0 overflow-hidden'
              : 'px-0.5 py-0.5 border-r border-gray-300 last:border-r-0 text-center min-w-0 overflow-hidden';
            return (
              <div key={idx} className={headerContainerClasses}>
                <div className={headerClasses}>{header}</div>
              </div>
            );
          })}
        </div>
        {rows.length > 0 ? (
          rows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className="grid text-[7px] text-gray-900 w-full"
              style={{ gridTemplateColumns: template, minWidth: 0 }}
            >
              {row.map((cell, cellIdx) => (
                <div
                  key={cellIdx}
                  className="px-1 py-1.5 border-t border-r border-gray-300 last:border-r-0 break-words text-center min-h-[20px] flex items-center justify-center min-w-0 overflow-hidden"
                >
                  <span className="w-full text-center leading-normal break-words">{cell}</span>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="px-1 py-3 text-center text-[7px] text-gray-500">Sem registros</div>
        )}
      </div>
    </div>
  );
};
