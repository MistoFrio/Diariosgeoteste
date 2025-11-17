import React from 'react';
import { PdfLayout, PdfRow, PdfSection, PdfTable, PdfValue } from './PdfLayout';

interface PLACADiaryViewProps {
  diary: any;
  placaDetail: any;
  placaPiles: any[];
}

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString('pt-BR') : '');

export const PLACADiaryView: React.FC<PLACADiaryViewProps> = ({ diary, placaDetail = {}, placaPiles = [] }) => {
  return (
    <PdfLayout diary={diary} title="DIÁRIO DE OBRA • PLACA">
      <PdfSection columns={4} title="Identificação">
        <PdfRow label="Cliente" value={diary.clientName} span={2} />
        <PdfRow label="Data" value={formatDate(diary.date)} />
        <PdfRow label="Equipamento" value={placaDetail.equipamentos_equipamento_reacao || diary.equipment || '-'} />
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

      <PdfSection columns={3} title="Equipamentos">
        <PdfRow label="Macaco" value={placaDetail.equipamentos_macaco || '-'} />
        <PdfRow label="Célula de carga" value={placaDetail.equipamentos_celula_carga || '-'} />
        <PdfRow label="Manômetro" value={placaDetail.equipamentos_manometro || '-'} />
        <PdfRow label="Placa" value={placaDetail.equipamentos_placa_dimensoes || '-'} />
        <PdfRow label="Equip. de reação" value={placaDetail.equipamentos_equipamento_reacao || '-'} />
        <PdfRow label="Relógios" value={placaDetail.equipamentos_relogios || '-'} />
      </PdfSection>

      <section className="border border-gray-400">
        <div className="bg-gray-200 border-b border-gray-400 px-1.5 xs:px-2 sm:px-3 py-1 xs:py-1.5 sm:py-2 font-bold uppercase text-[9px] xs:text-[10px] sm:text-[11px]">
          Pontos de ensaio
        </div>
        <div className="p-1.5 xs:p-2 sm:p-3">
          <PdfTable
            headers={['Ponto', 'Carga 1 (kgf/cm²)', 'Carga 2 (kgf/cm²)']}
            rows={placaPiles.map((point) => [
              point.nome || '-',
              point.carga_trabalho_1_kgf_cm2 || '-',
              point.carga_trabalho_2_kgf_cm2 || '-',
            ])}
          />
        </div>
      </section>

      <PdfSection title="Ocorrências">
        <PdfRow label="Descrição" value={placaDetail.ocorrencias || diary.observations || '-'} span={3} />
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
