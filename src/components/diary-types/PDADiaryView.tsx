import React from 'react';
import { PdfLayout, PdfRow, PdfSection, PdfTable, PdfValue } from './PdfLayout';

interface PDADiaryViewProps {
  diary: any;
  fichapdaDetail: any;
  pdaDiarioDetail: any;
  pdaDiarioPiles: any[];
}

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString('pt-BR') : '');

const joinOrDash = (input?: string | string[]) => {
  if (!input) return '-';
  if (Array.isArray(input)) {
    const filtered = input.filter(Boolean);
    return filtered.length ? filtered.join(', ') : '-';
  }
  return input;
};

export const PDADiaryView: React.FC<PDADiaryViewProps> = ({ 
  diary, 
  fichapdaDetail,
  pdaDiarioDetail,
  pdaDiarioPiles = [],
}) => {
  const ficha = fichapdaDetail || {};
  const pdaDiario = pdaDiarioDetail || {};
  return (
    <PdfLayout diary={diary} title="DIÁRIO DE OBRA • PDA">
      <PdfSection columns={4} title="Identificação">
        <PdfRow label="Cliente" value={diary.clientName} span={2} />
        <PdfRow label="Data" value={formatDate(diary.date)} />
        <PdfRow label="Equipamento" value={fichapdaDetail?.equipamento || diary.equipment || '-'} />
        <PdfRow label="Endereço" value={diary.address} span={2} />
        <PdfRow label="Nº da obra" value={diary.workNumber || '-'} />
        <PdfRow label="Horário início" value={diary.startTime || '-'} span={1} />
        <PdfRow label="Horário término" value={diary.endTime || '-'} span={1} />
        <PdfRow label="Equipe" value={diary.team} span={4} />
      </PdfSection>

      <PdfSection columns={3} title="Clima">
        <PdfRow label="Ensolarado" value={<PdfValue checked={!!diary?.weather_ensolarado} />} />
        <PdfRow label="Chuva fraca" value={<PdfValue checked={!!diary?.weather_chuva_fraca} />} />
        <PdfRow label="Chuva forte" value={<PdfValue checked={!!diary?.weather_chuva_forte} />} />
      </PdfSection>

      <PdfSection columns={4} title="Ficha técnica PDA">
        <PdfRow label="Computador" value={joinOrDash(fichapdaDetail?.computador)} />
        <PdfRow label="Estaca" value={fichapdaDetail?.estaca_nome || '-'} />
        <PdfRow label="Tipo" value={fichapdaDetail?.estaca_tipo || '-'} />
        <PdfRow label="Ø (cm)" value={fichapdaDetail?.diametro_cm ?? '-'} />
        <PdfRow label="Bloco" value={fichapdaDetail?.bloco_nome || '-'} />
        <PdfRow label="Carga trabalho (tf)" value={fichapdaDetail?.carga_trabalho_tf ?? '-'} />
        <PdfRow label="Carga ensaio (tf)" value={fichapdaDetail?.carga_ensaio_tf ?? '-'} />
        <PdfRow label="Peso martelo (kg)" value={fichapdaDetail?.peso_martelo_kg ?? '-'} />
        <PdfRow label="LP (m)" value={fichapdaDetail?.lp_m ?? '-'} />
        <PdfRow label="LE (m)" value={fichapdaDetail?.le_m ?? '-'} />
        <PdfRow label="LT (m)" value={fichapdaDetail?.lt_m ?? '-'} />
        <PdfRow label="Sensores (m)" value={fichapdaDetail?.altura_sensores_m ?? '-'} />
        <PdfRow label="Hq" value={joinOrDash(fichapdaDetail?.hq)} span={2} />
        <PdfRow label="Nega" value={joinOrDash(fichapdaDetail?.nega)} span={2} />
      </PdfSection>

      <PdfSection columns={3} title="Operação PDA">
        <PdfRow label="Computadores" value={joinOrDash(pdaDiarioDetail?.pda_computadores)} span={2} />
        <PdfRow label="Horímetro" value={pdaDiarioDetail?.horimetro_horas ?? '-'} />
        <PdfRow label="Equipamentos abastecidos" value={joinOrDash(pdaDiarioDetail?.abastec_equipamentos)} span={3} />
        <PdfRow label="Ocorrências" value={pdaDiarioDetail?.ocorrencias || diary.observations || '-'} span={3} />
      </PdfSection>

      <PdfSection columns={4} title="Abastecimento">
        <PdfRow label="Mobilização tanque (L)" value={pdaDiarioDetail?.mobilizacao_litros_tanque ?? '-'} />
        <PdfRow label="Mobilização galão (L)" value={pdaDiarioDetail?.mobilizacao_litros_galao ?? '-'} />
        <PdfRow label="Final do dia tanque (L)" value={pdaDiarioDetail?.finaldia_litros_tanque ?? '-'} />
        <PdfRow label="Final do dia galão (L)" value={pdaDiarioDetail?.finaldia_litros_galao ?? '-'} />
        <PdfRow
          label="Chegou diesel?"
          value={
            <div className="flex gap-4">
              <PdfValue label="Sim" checked={pdaDiarioDetail?.entrega_chegou_diesel === true} />
              <PdfValue label="Não" checked={pdaDiarioDetail?.entrega_chegou_diesel === false} />
            </div>
          }
          span={2}
        />
        <PdfRow label="Fornecido por" value={pdaDiarioDetail?.entrega_fornecido_por || '-'} />
        <PdfRow label="Quantidade (L)" value={pdaDiarioDetail?.entrega_quantidade_litros ?? '-'} />
        <PdfRow label="Horário chegada" value={pdaDiarioDetail?.entrega_horario_chegada || '-'} />
      </PdfSection>

      <section className="border border-gray-400">
        <div className="bg-gray-200 border-b border-gray-400 px-1.5 xs:px-2 sm:px-3 py-1 xs:py-1.5 sm:py-2 font-bold uppercase text-[9px] xs:text-[10px] sm:text-[11px]">
          Estacas ensaiadas
        </div>
        <div className="p-1.5 xs:p-2 sm:p-3">
          <PdfTable
            headers={['Estaca', 'Tipo', 'Ø (cm)', 'Profundidade (m)', 'Carga trabalho (tf)', 'Carga ensaio (tf)']}
            rows={pdaDiarioPiles.map((pile) => [
              pile.nome || '-',
              pile.tipo || '-',
              pile.diametro_cm || '-',
              pile.profundidade_m || '-',
              pile.carga_trabalho_tf || '-',
              pile.carga_ensaio_tf || '-',
            ])}
          />
        </div>
      </section>

      <PdfSection title="Assinaturas" columns={2}>
        <PdfRow
          label="Geoteste"
          value={
            <div className="flex flex-col gap-2">
              <span className="text-[11px]">{diary.geotestSignature || '-'}</span>
          {diary.geotestSignatureImage && (
                <div className="h-16 flex items-center justify-center border border-gray-300 bg-white">
              <img
                src={diary.geotestSignatureImage}
                alt="Assinatura digital"
                    className="max-h-14 object-contain"
              />
            </div>
          )}
        </div>
          }
        />
        <PdfRow label="Responsável da obra" value={diary.responsibleSignature || '-'} />
      </PdfSection>
    </PdfLayout>
  );
};
