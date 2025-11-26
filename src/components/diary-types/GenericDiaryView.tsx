import React from 'react';
import { PdfLayout, PdfRow, PdfSection, PdfValue } from './PdfLayout';

interface GenericDiaryViewProps {
  diary: any;
}

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString('pt-BR') : '');

export const GenericDiaryView: React.FC<GenericDiaryViewProps> = ({ diary }) => {
  return (
    <PdfLayout diary={diary} title="DIÁRIO DE OBRA">
      <PdfSection columns={4} title="Identificação">
        <PdfRow label="Cliente" value={diary.clientName} span={2} />
        <PdfRow label="Data" value={formatDate(diary.date)} />
        <PdfRow label="Equipamento" value={diary.equipment || '-'} />
        <PdfRow label="Endereço" value={diary.address} span={2} />
        <PdfRow label="Nº da obra" value={diary.workNumber || '-'} />
        <PdfRow label="Obra" value={diary.projectName || '-'} />
        <PdfRow label="Horário início" value={diary.startTime || '-'} span={1} />
        <PdfRow label="Horário término" value={diary.endTime || '-'} span={1} />
        <PdfRow label="Equipe" value={diary.team} span={4} />
      </PdfSection>

      <PdfSection columns={3} title="Clima">
        <PdfRow label="Ensolarado" value={<PdfValue checked={!!diary?.weather_ensolarado} />} />
        <PdfRow label="Chuva fraca" value={<PdfValue checked={!!diary?.weather_chuva_fraca} />} />
        <PdfRow label="Chuva forte" value={<PdfValue checked={!!diary?.weather_chuva_forte} />} />
      </PdfSection>

      <PdfSection title="Ocorrências">
        <PdfRow label="Horário" placeholder />
        <PdfRow
          label="Descrição"
          value={diary.occurrences || diary.observations || '-'}
          span={3}
        />
      </PdfSection>

      <PdfSection title="Abastecimento" columns={4}>
        <PdfRow label="Chegou diesel?" value={<PdfValue label="Sim" checked={diary.dieselArrived} />} />
        <PdfRow label="" value={<PdfValue label="Não" checked={diary.dieselArrived === false} />} />
        <PdfRow label="Fornecido por" value={diary.suppliedBy || '-'} />
        <PdfRow label="Litros recebidos" value={diary.dieselLiters || '-'} />
        <PdfRow label="Horário chegada" value={diary.dieselArrival || '-'} />
        <PdfRow label="Observação" value={diary.dieselObservation || '-'} span={4} />
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
                    alt="Assinatura Geoteste"
                    className="max-h-14 object-contain"
                  />
                </div>
              )}
            </div>
          }
        />
        <PdfRow label="Cliente" placeholder />
      </PdfSection>
    </PdfLayout>
  );
};
