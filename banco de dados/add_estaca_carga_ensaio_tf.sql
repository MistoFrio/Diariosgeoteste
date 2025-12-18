-- ============================================
-- Adicionar coluna estaca_carga_ensaio_tf na tabela work_diaries_pce_piles
-- ============================================

-- Adicionar coluna estaca_carga_ensaio_tf se não existir
alter table if exists public.work_diaries_pce_piles
  add column if not exists estaca_carga_ensaio_tf numeric(10,2);

-- Comentário na coluna
comment on column public.work_diaries_pce_piles.estaca_carga_ensaio_tf is 'Carga de ensaio da estaca em toneladas-força (tf) - usado apenas para PCE HELICOIDAL';
