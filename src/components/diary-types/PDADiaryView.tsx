import React from 'react';

interface PDADiaryViewProps {
  diary: any;
  fichapdaDetail: any;
  pdaDiarioDetail: any;
  pdaDiarioPiles: any[];
}

export const PDADiaryView: React.FC<PDADiaryViewProps> = ({ 
  diary, 
  fichapdaDetail, 
  pdaDiarioDetail, 
  pdaDiarioPiles 
}) => {
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

      {/* Ficha Técnica PDA */}
      {fichapdaDetail && (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
            <h3 className="font-bold text-sm uppercase text-gray-900">FICHA TÉCNICA • PDA</h3>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">PDA:</div>
                <div className="text-sm text-gray-900 break-words">
                  {(fichapdaDetail.computador || []).join(', ') || '-'}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">Equipamento:</div>
                <div className="text-sm text-gray-900 break-words">
                  {(fichapdaDetail.equipamento || []).join(', ') || '-'}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">Bloco:</div>
                <div className="text-sm text-gray-900 break-words">{fichapdaDetail.bloco_nome || '-'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">Estaca:</div>
                <div className="text-sm text-gray-900 break-words">{fichapdaDetail.estaca_nome || '-'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">Tipo:</div>
                <div className="text-sm text-gray-900 break-words">{fichapdaDetail.estaca_tipo || '-'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">Ø (cm):</div>
                <div className="text-sm text-gray-900">{fichapdaDetail.diametro_cm ?? '-'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">Carga Trab. (tf):</div>
                <div className="text-sm text-gray-900">{fichapdaDetail.carga_trabalho_tf ?? '-'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">Carga Ensaio (tf):</div>
                <div className="text-sm text-gray-900">{fichapdaDetail.carga_ensaio_tf ?? '-'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg sm:col-span-2">
                <div className="text-sm font-semibold text-gray-700 mb-1">Peso martelo (kg):</div>
                <div className="text-sm text-gray-900">{fichapdaDetail.peso_martelo_kg ?? '-'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg sm:col-span-2">
                <div className="text-sm font-semibold text-gray-700 mb-1">Hq (m):</div>
                <div className="text-sm text-gray-900 break-words">
                  {(fichapdaDetail.hq || []).join(', ') || '-'}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg sm:col-span-2">
                <div className="text-sm font-semibold text-gray-700 mb-1">Nega (mm):</div>
                <div className="text-sm text-gray-900 break-words">
                  {(fichapdaDetail.nega || []).join(', ') || '-'}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg sm:col-span-2">
                <div className="text-sm font-semibold text-gray-700 mb-1">EMX:</div>
                <div className="text-sm text-gray-900 break-words">
                  {(fichapdaDetail.emx || []).join(', ') || '-'}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg sm:col-span-2">
                <div className="text-sm font-semibold text-gray-700 mb-1">RMX:</div>
                <div className="text-sm text-gray-900 break-words">
                  {(fichapdaDetail.rmx || []).join(', ') || '-'}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg sm:col-span-2">
                <div className="text-sm font-semibold text-gray-700 mb-1">DMX:</div>
                <div className="text-sm text-gray-900 break-words">
                  {(fichapdaDetail.dmx || []).join(', ') || '-'}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg sm:col-span-2">
                <div className="text-sm font-semibold text-gray-700 mb-1">Seção cravada (m):</div>
                <div className="text-sm text-gray-900 break-words">
                  {(fichapdaDetail.secao_cravada || []).join(', ') || '-'}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">Altura bloco (m):</div>
                <div className="text-sm text-gray-900">{fichapdaDetail.altura_bloco_m ?? '-'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">Altura sensores (m):</div>
                <div className="text-sm text-gray-900">{fichapdaDetail.altura_sensores_m ?? '-'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">LP (m):</div>
                <div className="text-sm text-gray-900">{fichapdaDetail.lp_m ?? '-'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">LE (m):</div>
                <div className="text-sm text-gray-900">{fichapdaDetail.le_m ?? '-'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">LT (m):</div>
                <div className="text-sm text-gray-900">{fichapdaDetail.lt_m ?? '-'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diário PDA */}
      {pdaDiarioDetail && (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
            <h3 className="font-bold text-sm uppercase text-gray-900">DIÁRIO • PDA</h3>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg sm:col-span-2">
                <div className="text-sm font-semibold text-gray-700 mb-1">PDA:</div>
                <div className="text-sm text-gray-900 break-words">
                  {(pdaDiarioDetail.pda_computadores || []).join(', ') || '-'}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg sm:col-span-2">
                <div className="text-sm font-semibold text-gray-700 mb-1">Ocorrências:</div>
                <div className="text-sm text-gray-900 break-words">{pdaDiarioDetail.ocorrencias || '-'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">Equipamentos:</div>
                <div className="text-sm text-gray-900 break-words">
                  {(pdaDiarioDetail.abastec_equipamentos || []).join(', ') || '-'}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">Horímetro (h):</div>
                <div className="text-sm text-gray-900">{pdaDiarioDetail.horimetro_horas ?? '-'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">Mobilização tanque (L):</div>
                <div className="text-sm text-gray-900">{pdaDiarioDetail.mobilizacao_litros_tanque ?? '-'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">Mobilização galão (L):</div>
                <div className="text-sm text-gray-900">{pdaDiarioDetail.mobilizacao_litros_galao ?? '-'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">Final do dia tanque (L):</div>
                <div className="text-sm text-gray-900">{pdaDiarioDetail.finaldia_litros_tanque ?? '-'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">Final do dia galão (L):</div>
                <div className="text-sm text-gray-900">{pdaDiarioDetail.finaldia_litros_galao ?? '-'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">Chegou diesel?</div>
                <div className="text-sm text-gray-900">
                  {pdaDiarioDetail.entrega_chegou_diesel === null ? '-' : (pdaDiarioDetail.entrega_chegou_diesel ? 'Sim' : 'Não')}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">Fornecido por:</div>
                <div className="text-sm text-gray-900 break-words">{pdaDiarioDetail.entrega_fornecido_por || '-'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">Qtd diesel (L):</div>
                <div className="text-sm text-gray-900">{pdaDiarioDetail.entrega_quantidade_litros ?? '-'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-semibold text-gray-700 mb-1">Horário chegada:</div>
                <div className="text-sm text-gray-900">{pdaDiarioDetail.entrega_horario_chegada || '-'}</div>
              </div>
            </div>
          </div>

          {/* Estacas do Dia PDA */}
          {pdaDiarioPiles && pdaDiarioPiles.length > 0 && (
            <div className="border-t border-gray-300">
              <div className="bg-gray-100 px-3 py-2 border-b border-gray-300">
                <h3 className="font-bold text-sm uppercase text-gray-900">DIÁRIO • PDA • ESTACAS DO DIA</h3>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  <div className="grid grid-cols-6 gap-2 p-3 bg-gray-50 text-xs font-semibold text-gray-700">
                    <div>Nome</div>
                    <div>Tipo</div>
                    <div>Ø (cm)</div>
                    <div>Prof. (m)</div>
                    <div>Carga Trab. (tf)</div>
                    <div>Carga Ensaio (tf)</div>
                  </div>
                  {pdaDiarioPiles.map((row: any, i: number) => (
                    <div key={row.id || i} className="grid grid-cols-6 gap-2 p-3 border-t border-gray-200 text-xs text-gray-900">
                      <div className="break-words">{row.nome || '-'}</div>
                      <div className="break-words">{row.tipo || '-'}</div>
                      <div>{row.diametro_cm ?? '-'}</div>
                      <div>{row.profundidade_m ?? '-'}</div>
                      <div>{row.carga_trabalho_tf ?? '-'}</div>
                      <div>{row.carga_ensaio_tf ?? '-'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
    </div>
  );
};
