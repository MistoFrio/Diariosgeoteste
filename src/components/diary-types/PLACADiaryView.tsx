import React from 'react';

interface PLACADiaryViewProps {
  diary: any;
  placaDetail: any;
  placaPiles: any[];
}

export const PLACADiaryView: React.FC<PLACADiaryViewProps> = ({ diary, placaDetail, placaPiles }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (time: string) => {
    return time;
  };

  return (
    <div className="w-full space-y-3">
      {/* Cabeçalho Principal */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-3 py-3 border-b border-gray-300">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-3">
              <img src="/logogeoteste.png" alt="Geoteste" className="h-8 w-8 flex-shrink-0" />
              <div>
                <h1 className="text-lg font-bold uppercase text-gray-900 tracking-wide">DIÁRIO DE OBRA</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Informações Principais - Layout Mobile */}
        <div className="p-3 space-y-3">
          {/* Cliente */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm font-semibold text-gray-700 mb-1">Cliente:</div>
            <div className="text-sm text-gray-900 break-words">{diary.clientName}</div>
          </div>

          {/* Endereço */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm font-semibold text-gray-700 mb-1">Endereço:</div>
            <div className="text-sm text-gray-900 break-words">{diary.address}</div>
          </div>

          {/* Data e Horários */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-semibold text-gray-700 mb-1">Data:</div>
              <div className="text-sm text-gray-900">{formatDate(diary.date)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-semibold text-gray-700 mb-1">Início:</div>
              <div className="text-sm text-gray-900">{formatTime(diary.startTime)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-semibold text-gray-700 mb-1">Término:</div>
              <div className="text-sm text-gray-900">{formatTime(diary.endTime)}</div>
            </div>
          </div>

          {/* Equipe */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm font-semibold text-gray-700 mb-1">Equipe:</div>
            <div className="text-sm text-gray-900 break-words">{diary.team}</div>
          </div>

          {/* Condições Climáticas */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm font-semibold text-gray-700 mb-2">Condições Climáticas:</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <span>Ensolarado:</span>
                <span className="border-b border-gray-400 w-8"></span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Chuva fraca:</span>
                <span className="border-b border-gray-400 w-8"></span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Chuva forte:</span>
                <span className="border-b border-gray-400 w-8"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      

      {/* Equipamentos PLACA */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
          <h3 className="font-bold text-sm uppercase text-gray-900">PLACA • EQUIPAMENTOS</h3>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-semibold text-gray-700 mb-1">Macaco:</div>
              <div className="text-sm text-gray-900 break-words">{placaDetail.equipamentos_macaco || '-'}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-semibold text-gray-700 mb-1">Célula:</div>
              <div className="text-sm text-gray-900 break-words">{placaDetail.equipamentos_celula_carga || '-'}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-semibold text-gray-700 mb-1">Manômetro:</div>
              <div className="text-sm text-gray-900 break-words">{placaDetail.equipamentos_manometro || '-'}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-semibold text-gray-700 mb-1">Placa:</div>
              <div className="text-sm text-gray-900 break-words">{placaDetail.equipamentos_placa_dimensoes || '-'}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-semibold text-gray-700 mb-1">Equip. reação:</div>
              <div className="text-sm text-gray-900 break-words">{placaDetail.equipamentos_equipamento_reacao || '-'}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-semibold text-gray-700 mb-1">Relógios:</div>
              <div className="text-sm text-gray-900 break-words">{placaDetail.equipamentos_relogios || '-'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pontos de Ensaio PLACA */}
      {placaPiles.length > 0 && (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
            <h3 className="font-bold text-sm uppercase text-gray-900">PLACA • PONTOS DE ENSAIO</h3>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 text-xs font-semibold text-gray-700">
                <div>Ponto</div>
                <div>Carga 1 (kgf/cm²)</div>
                <div>Carga 2 (kgf/cm²)</div>
              </div>
              {placaPiles.map((point, index) => (
                <div key={point.id || index} className="grid grid-cols-3 gap-2 p-3 border-t border-gray-200 text-xs text-gray-900">
                  <div className="break-words">{point.nome || '-'}</div>
                  <div>{point.carga_trabalho_1_kgf_cm2 || '-'}</div>
                  <div>{point.carga_trabalho_2_kgf_cm2 || '-'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ocorrências PLACA */}
      {placaDetail.ocorrencias && (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
            <h3 className="font-bold text-sm uppercase text-gray-900">PLACA • OCORRÊNCIAS</h3>
          </div>
          <div className="p-3">
            <div className="text-sm text-gray-900 break-words">{placaDetail.ocorrencias}</div>
          </div>
        </div>
      )}

      {/* Assinaturas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="border border-gray-300 rounded-lg p-3">
          <h3 className="font-bold text-xs uppercase text-gray-900 mb-2">ASSINATURA GEOTESTE</h3>
          <div className="text-xs text-gray-700 mb-2">
            <span className="font-semibold">Responsável:</span> {diary.geotestSignature}
          </div>
          {diary.geotestSignatureImage && (
            <div className="border border-gray-300 p-2 bg-white rounded">
              <img
                src={diary.geotestSignatureImage}
                alt="Assinatura digital"
                className="h-12 w-auto max-w-full object-contain mx-auto block"
              />
            </div>
          )}
        </div>
        
        <div className="border border-gray-300 rounded-lg p-3">
          <h3 className="font-bold text-xs uppercase text-gray-900 mb-2">ASSINATURA RESPONSÁVEL DA OBRA</h3>
          <div className="text-xs text-gray-900 break-words">
            {diary.responsibleSignature}
          </div>
        </div>
      </div>

      {/* Observações renderizadas apenas no layout genérico */}
    </div>
  );
};
