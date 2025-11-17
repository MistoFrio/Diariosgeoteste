import React from 'react';
import { PdfLayout, PdfRow, PdfSection, PdfTable, PdfValue } from './PdfLayout';

interface PCEDiaryViewProps {
  diary: any;
  pceDetail: any;
  pcePiles: any[];
}

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString('pt-BR') : '');

export const PCEDiaryView: React.FC<PCEDiaryViewProps> = ({ diary, pceDetail = {}, pcePiles = [] }) => {
  return (
    <PdfLayout diary={diary} title="DIÁRIO DE OBRA • PCE">
      <PdfSection columns={4} title="Identificação">
        <PdfRow label="Cliente" value={diary.clientName} span={2} />
        <PdfRow label="Data" value={formatDate(diary.date)} />
        <PdfRow label="Equipamento" value={pceDetail.equipamento || diary.equipment || '-'} />
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
        <PdfRow label="Tipo de ensaio" value={pceDetail.ensaio_tipo || '-'} span={2} />
        <PdfRow
          label="Carregamentos"
          value={Array.isArray(pceDetail.carregamento_tipos) && pceDetail.carregamento_tipos.length > 0 ? pceDetail.carregamento_tipos.join(', ') : '-'}
        />
        <PdfRow label="Macaco" value={pceDetail.equipamentos_macaco || '-'} />
        <PdfRow label="Célula" value={pceDetail.equipamentos_celula || '-'} />
        <PdfRow label="Manômetro" value={pceDetail.equipamentos_manometro || '-'} />
        <PdfRow label="Relógios" value={pceDetail.equipamentos_relogios || '-'} />
        <PdfRow label="Conjunto de vigas" value={pceDetail.equipamentos_conjunto_vigas || '-'} span={3} />
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
              'Profundidade (m)',
              'Carga trabalho (tf)',
              'Diâmetro (cm)',
            ]}
            rows={pcePiles.map((pile) => [
              pile.estaca_nome || '-',
              pile.estaca_tipo || '-',
              pile.estaca_profundidade_m || '-',
              pile.estaca_carga_trabalho_tf || '-',
              pile.estaca_diametro_cm || '-',
            ])}
          />
        </div>
      </section>

      <PdfSection title="Ocorrências">
        <PdfRow label="Descrição" value={pceDetail.ocorrencias || diary.observations || '-'} span={3} />
      </PdfSection>

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
