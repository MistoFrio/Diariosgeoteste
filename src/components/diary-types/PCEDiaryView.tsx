import React from 'react';

interface PCEDiaryViewProps {
  diary: any;
  pceDetail: any;
  pcePiles: any[];
}

export const PCEDiaryView: React.FC<PCEDiaryViewProps> = ({ diary, pceDetail, pcePiles }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (time: string) => {
    return time;
  };

  return (
    <div className="w-full space-y-3">
      {/* Cabeçalho Principal - Mobile First */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-3 py-3 border-b border-gray-300">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-3">
              <img src="/logogeoteste.png" alt="Geoteste" className="h-8 w-8 flex-shrink-0" />
              <div>
                <h1 className="text-lg font-bold uppercase text-gray-900">DIÁRIO DE OBRA</h1>
                <p className="text-sm font-semibold text-gray-600">Nº DA OBRA: {diary.id.slice(-8).toUpperCase()}</p>
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

      {/* Serviços Executados */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
          <h3 className="font-bold text-sm uppercase text-gray-900">SERVIÇOS EXECUTADOS</h3>
        </div>
        <div className="p-3">
          <div className="text-sm text-gray-900 break-words">{diary.servicesExecuted}</div>
        </div>
      </div>

      {/* Dados do Ensaio PCE */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
          <h3 className="font-bold text-sm uppercase text-gray-900">PCE • DADOS DO ENSAIO</h3>
        </div>
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-semibold text-gray-700 mb-1">Tipo de ensaio:</div>
              <div className="text-sm text-gray-900 break-words">{pceDetail.ensaio_tipo}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-semibold text-gray-700 mb-1">Carregamento:</div>
              <div className="text-sm text-gray-900 break-words">
                {Array.isArray(pceDetail.carregamento_tipos) ? pceDetail.carregamento_tipos.join(', ') : '-'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Características das Estacas */}
      {pcePiles.length > 0 && (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
            <h3 className="font-bold text-sm uppercase text-gray-900">PCE • CARACTERÍSTICAS DAS ESTACAS</h3>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              <div className="grid grid-cols-5 gap-2 p-3 bg-gray-50 text-xs font-semibold text-gray-700">
                <div>Estaca</div>
                <div>Prof. (m)</div>
                <div>Carga (tf)</div>
                <div>Tipo</div>
                <div>Diâm. (cm)</div>
              </div>
              {pcePiles.map((pile, index) => (
                <div key={pile.id || index} className="grid grid-cols-5 gap-2 p-3 border-t border-gray-200 text-xs text-gray-900">
                  <div className="break-words">{pile.estaca_nome || '-'}</div>
                  <div>{pile.estaca_profundidade_m || '-'}</div>
                  <div>{pile.estaca_carga_trabalho_tf || '-'}</div>
                  <div className="break-words">{pile.estaca_tipo || '-'}</div>
                  <div>{pile.estaca_diametro_cm || '-'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Equipamentos PCE */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
          <h3 className="font-bold text-sm uppercase text-gray-900">PCE • EQUIPAMENTOS</h3>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-semibold text-gray-700 mb-1">Macaco:</div>
              <div className="text-sm text-gray-900 break-words">{pceDetail.equipamentos_macaco || '-'}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-semibold text-gray-700 mb-1">Célula:</div>
              <div className="text-sm text-gray-900 break-words">{pceDetail.equipamentos_celula || '-'}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-semibold text-gray-700 mb-1">Manômetro:</div>
              <div className="text-sm text-gray-900 break-words">{pceDetail.equipamentos_manometro || '-'}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-semibold text-gray-700 mb-1">Relógios:</div>
              <div className="text-sm text-gray-900 break-words">{pceDetail.equipamentos_relogios || '-'}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg sm:col-span-2">
              <div className="text-sm font-semibold text-gray-700 mb-1">Conjunto de Vigas:</div>
              <div className="text-sm text-gray-900 break-words">{pceDetail.equipamentos_conjunto_vigas || '-'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ocorrências PCE */}
      {pceDetail.ocorrencias && (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
            <h3 className="font-bold text-sm uppercase text-gray-900">PCE • OCORRÊNCIAS</h3>
          </div>
          <div className="p-3">
            <div className="text-sm text-gray-900 break-words">{pceDetail.ocorrencias}</div>
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
                className="w-full h-12 object-contain"
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

      {/* Observações */}
      {diary.observations && (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
            <h3 className="font-bold text-xs uppercase text-gray-900">OBSERVAÇÕES</h3>
          </div>
          <div className="p-3">
            <div className="text-sm text-gray-900 break-words">{diary.observations}</div>
          </div>
        </div>
      )}
    </div>
  );
};
