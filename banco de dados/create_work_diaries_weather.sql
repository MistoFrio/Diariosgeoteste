-- ============================================
-- Tabela: Condições Climáticas por Diário
-- ============================================

create table if not exists public.work_diaries_weather (
  diary_id uuid primary key references public.work_diaries(id) on delete cascade,
  ensolarado boolean,
  chuva_fraca boolean,
  chuva_forte boolean,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_work_diaries_weather_diary_id on public.work_diaries_weather(diary_id);

alter table public.work_diaries_weather enable row level security;

drop policy if exists "weather_select_owner_admin" on public.work_diaries_weather;
create policy "weather_select_owner_admin"
  on public.work_diaries_weather for select
  using (
    exists (
      select 1 from public.work_diaries wd
      where wd.id = work_diaries_weather.diary_id
      and (wd.user_id = auth.uid() or public.is_admin(auth.uid()))
    )
  );

drop policy if exists "weather_insert_owner" on public.work_diaries_weather;
create policy "weather_insert_owner"
  on public.work_diaries_weather for insert
  with check (
    exists (
      select 1 from public.work_diaries wd
      where wd.id = work_diaries_weather.diary_id
      and wd.user_id = auth.uid()
    )
  );

drop policy if exists "weather_update_owner_admin" on public.work_diaries_weather;
create policy "weather_update_owner_admin"
  on public.work_diaries_weather for update
  using (
    exists (
      select 1 from public.work_diaries wd
      where wd.id = work_diaries_weather.diary_id
      and (wd.user_id = auth.uid() or public.is_admin(auth.uid()))
    )
  )
  with check (
    exists (
      select 1 from public.work_diaries wd
      where wd.id = work_diaries_weather.diary_id
      and (wd.user_id = auth.uid() or public.is_admin(auth.uid()))
    )
  );


