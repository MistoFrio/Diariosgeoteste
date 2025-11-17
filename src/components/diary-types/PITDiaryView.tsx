import React from 'react';
import { PdfLayout, PdfRow, PdfSection, PdfTable, PdfValue } from './PdfLayout';

interface PITDiaryViewProps {
  diary: any;
  pitDetail: any;
  pitPiles: any[];
}

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString('pt-BR') : '');

export const PITDiaryView: React.FC<PITDiaryViewProps> = ({ diary, pitDetail = {}, pitPiles = [] }) => {
  return (
    <PdfLayout diary={diary} title="DIÁRIO DE OBRA • PIT">
      <PdfSection columns={4} title="Identificação">
        <PdfRow label="Cliente" value={diary.clientName} span={2} />
        <PdfRow label="Data" value={formatDate(diary.date)} />
        <PdfRow label="Equipamento" value={pitDetail.equipamento || diary.equipment || '-'} />
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

      <PdfSection columns={3} title="Dados do ensaio">
        <PdfRow label="Total de estacas" value={pitDetail.total_estacas || '-'} />
        <PdfRow label="Estacas ensaiadas" value={pitDetail.estacas_ensaiadas || '-'} />
        <PdfRow label="Horímetro" value={pitDetail.horimetro || '-'} />
        <PdfRow label="Ocorrências" value={pitDetail.ocorrencias || diary.observations || '-'} span={3} />
      </PdfSection>

      <section className="border border-gray-400">
        <div className="bg-gray-200 border-b border-gray-400 px-1.5 xs:px-2 sm:px-3 py-1 xs:py-1.5 sm:py-2 font-bold uppercase text-[9px] xs:text-[10px] sm:text-[11px]">
          Estacas ensaiadas
        </div>
        <div className="p-1.5 xs:p-2 sm:p-3">
          <PdfTable
            headers={[
              'Estaca',
              'Tipo',
              'Diâmetro (cm)',
              'Profundidade (m)',
              'Arrasamento (m)',
              'Comprimento útil (m)',
            ]}
            rows={pitPiles.map((pile) => [
              pile.estaca_nome || '-',
              pile.estaca_tipo || '-',
              pile.diametro_cm || '-',
              pile.profundidade_cm || '-',
              pile.arrasamento_m || '-',
              pile.comprimento_util_m || '-',
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
