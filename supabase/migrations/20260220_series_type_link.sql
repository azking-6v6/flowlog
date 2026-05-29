alter table public.flowlog_series
add column if not exists type_id uuid references public.flowlog_content_types(id) on delete cascade;

update public.flowlog_series s
set type_id = mapped.type_id
from (
  select distinct on (series_id) series_id, type_id
  from public.flowlog_work_items
  where series_id is not null
  order by series_id, created_at asc
) as mapped
where s.id = mapped.series_id
  and s.type_id is null;

update public.flowlog_series s
set type_id = fallback.id
from (
  select distinct on (user_id) user_id, id
  from public.flowlog_content_types
  order by user_id, created_at asc
) as fallback
where s.user_id = fallback.user_id
  and s.type_id is null;

alter table public.flowlog_series
alter column type_id set not null;

alter table public.flowlog_series
drop constraint if exists series_user_id_name_key;

alter table public.flowlog_series
drop constraint if exists series_user_id_type_id_name_key;

alter table public.flowlog_series
add constraint series_user_id_type_id_name_key unique (user_id, type_id, name);

create index if not exists flowlog_idx_series_user_type on public.flowlog_series(user_id, type_id);

