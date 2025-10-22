import React from 'react';
import { WorkDiary } from '../types';
import { PCEDiaryView } from './diary-types/PCEDiaryView';
import { PITDiaryView } from './diary-types/PITDiaryView';
import { PLACADiaryView } from './diary-types/PLACADiaryView';
import { PDADiaryView } from './diary-types/PDADiaryView';
import { GenericDiaryView } from './diary-types/GenericDiaryView';

interface DiaryPDFLayoutProps {
  diary: WorkDiary;
  pceDetail?: any;
  pcePiles?: any[];
  pitDetail?: any;
  pitPiles?: any[];
  placaDetail?: any;
  placaPiles?: any[];
  fichapdaDetail?: any;
  pdaDiarioDetail?: any;
  pdaDiarioPiles?: any[];
}

export const DiaryPDFLayout: React.FC<DiaryPDFLayoutProps> = ({
  diary,
  pceDetail,
  pcePiles = [],
  pitDetail,
  pitPiles = [],
  placaDetail,
  placaPiles = [],
  fichapdaDetail,
  pdaDiarioDetail,
  pdaDiarioPiles = []
}) => {
  // Determinar o tipo de diário e renderizar o componente apropriado
  if (pceDetail) {
    return <PCEDiaryView diary={diary} pceDetail={pceDetail} pcePiles={pcePiles} />;
  }

  if (pitDetail) {
    return <PITDiaryView diary={diary} pitDetail={pitDetail} pitPiles={pitPiles} />;
  }

  if (placaDetail) {
    return <PLACADiaryView diary={diary} placaDetail={placaDetail} placaPiles={placaPiles} />;
  }

  if (fichapdaDetail || pdaDiarioDetail) {
  return (
      <PDADiaryView 
        diary={diary} 
        fichapdaDetail={fichapdaDetail} 
        pdaDiarioDetail={pdaDiarioDetail} 
        pdaDiarioPiles={pdaDiarioPiles} 
      />
    );
  }

  // Diário genérico (sem tipo específico)
  return <GenericDiaryView diary={diary} />;
};
