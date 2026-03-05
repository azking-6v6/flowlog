create table if not exists public.inspiration_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.inspiration_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  url text,
  memo text,
  category_id uuid references public.inspiration_categories(id) on delete set null,
  is_starred boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_inspiration_categories_user_sort on public.inspiration_categories(user_id, sort_order);
create index if not exists idx_inspiration_entries_user_created on public.inspiration_entries(user_id, created_at desc);
create index if not exists idx_inspiration_entries_user_category on public.inspiration_entries(user_id, category_id);
create index if not exists idx_inspiration_entries_user_star on public.inspiration_entries(user_id, is_starred);

drop trigger if exists trg_inspiration_entries_updated_at on public.inspiration_entries;
create trigger trg_inspiration_entries_updated_at
before update on public.inspiration_entries
for each row execute procedure public.set_updated_at();

alter table public.inspiration_categories enable row level security;
alter table public.inspiration_entries enable row level security;

drop policy if exists "inspiration_categories_owner_all" on public.inspiration_categories;
create policy "inspiration_categories_owner_all" on public.inspiration_categories
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "inspiration_entries_owner_all" on public.inspiration_entries;
create policy "inspiration_entries_owner_all" on public.inspiration_entries
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.bootstrap_inspiration_categories(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  default_names text[] := array['音楽', 'デザイン', 'アニメ', 'ゲーム', '文章'];
  next_sort int := 0;
  category_name text;
begin
  select coalesce(max(sort_order), -1) + 1
  into next_sort
  from public.inspiration_categories
  where user_id = target_user_id;

  foreach category_name in array default_names loop
    if not exists (
      select 1
      from public.inspiration_categories
      where user_id = target_user_id
        and name = category_name
    ) then
      insert into public.inspiration_categories (user_id, name, sort_order)
      values (target_user_id, category_name, next_sort);
      next_sort := next_sort + 1;
    end if;
  end loop;
end;
$$;

grant execute on function public.bootstrap_inspiration_categories(uuid) to authenticated;

