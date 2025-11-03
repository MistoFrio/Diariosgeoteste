import React from 'react';

interface GenericDiaryViewProps {
  diary: any;
}

export const GenericDiaryView: React.FC<GenericDiaryViewProps> = ({ diary }) => {
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
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-1">Cliente:</div>
            <div className="text-sm text-gray-900 break-words">{diary.clientName}</div>
          </div>

          {/* Endereço */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-1">Endereço:</div>
            <div className="text-sm text-gray-900 break-words">{diary.address}</div>
          </div>

          {/* Data e Horários */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-sm font-semibold text-gray-700 mb-1">Data:</div>
              <div className="text-sm text-gray-900">{formatDate(diary.date)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-sm font-semibold text-gray-700 mb-1">Início:</div>
              <div className="text-sm text-gray-900">{formatTime(diary.startTime)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-sm font-semibold text-gray-700 mb-1">Término:</div>
              <div className="text-sm text-gray-900">{formatTime(diary.endTime)}</div>
            </div>
          </div>

          {/* Equipe */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-1">Equipe:</div>
            <div className="text-sm text-gray-900 break-words">{diary.team}</div>
          </div>

          {/* Condições Climáticas */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm font-semibold text-gray-700 mb-2">Condições Climáticas:</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <input type="checkbox" readOnly checked={!!diary?.weather_ensolarado} className="w-4 h-4 text-green-600" />
                <span>Ensolarado</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" readOnly checked={!!diary?.weather_chuva_fraca} className="w-4 h-4 text-green-600" />
                <span>Chuva fraca</span>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" readOnly checked={!!diary?.weather_chuva_forte} className="w-4 h-4 text-green-600" />
                <span>Chuva forte</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      

      {/* Assinaturas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="border border-gray-400 rounded-lg p-3">
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
        
        <div className="border border-gray-400 rounded-lg p-3">
          <h3 className="font-bold text-xs uppercase text-gray-900 mb-2">ASSINATURA RESPONSÁVEL DA OBRA</h3>
          <div className="text-xs text-gray-900 break-words">
            {diary.responsibleSignature}
          </div>
        </div>
      </div>

      {/* Observações */}
      {diary.observations && (
        <div className="border-2 border-gray-400 rounded-lg overflow-hidden">
          <div className="bg-gray-200 px-3 py-2 border-b-2 border-gray-400">
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
