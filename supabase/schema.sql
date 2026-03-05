-- Enable required extensions
create extension if not exists "pgcrypto";

-- works: global master, duplicates allowed
create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  thumbnail_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.content_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.series (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type_id uuid not null references public.content_types(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, type_id, name)
);

alter table public.series add column if not exists type_id uuid references public.content_types(id) on delete cascade;

create table if not exists public.work_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  type_id uuid not null references public.content_types(id) on delete restrict,
  series_id uuid references public.series(id) on delete set null,
  status text not null check (status in ('planned', 'in_progress', 'on_hold', 'completed')),
  rating numeric(2,1) check (rating is null or (rating >= 0 and rating <= 5)),
  review_text text,
  review_good text,
  review_bad text,
  review_note text,
  why_interested text,
  availability_end date,
  completed_at timestamptz,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.list_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope_type text not null check (scope_type in ('global', 'type')),
  type_id uuid references public.content_types(id) on delete cascade,
  work_item_id uuid not null references public.work_items(id) on delete cascade,
  position int not null check (position > 0),
  created_at timestamptz not null default now(),
  unique (user_id, scope_type, type_id, work_item_id)
);

create index if not exists idx_work_items_user_status on public.work_items(user_id, status);
create index if not exists idx_work_items_user_type on public.work_items(user_id, type_id);
create index if not exists idx_list_orders_user_scope on public.list_orders(user_id, scope_type, type_id, position);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_work_items_updated_at on public.work_items;
create trigger trg_work_items_updated_at
before update on public.work_items
for each row execute procedure public.set_updated_at();

alter table public.content_types enable row level security;
alter table public.series enable row level security;
alter table public.work_items enable row level security;
alter table public.list_orders enable row level security;

-- works is shared read/write by authenticated users
alter table public.works enable row level security;

drop policy if exists "works_select_authenticated" on public.works;
create policy "works_select_authenticated" on public.works
for select to authenticated
using (true);

drop policy if exists "works_insert_authenticated" on public.works;
create policy "works_insert_authenticated" on public.works
for insert to authenticated
with check (true);

drop policy if exists "works_update_authenticated" on public.works;
create policy "works_update_authenticated" on public.works
for update to authenticated
using (true)
with check (true);

drop policy if exists "content_types_owner_all" on public.content_types;
create policy "content_types_owner_all" on public.content_types
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "series_owner_all" on public.series;
create policy "series_owner_all" on public.series
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "work_items_owner_all" on public.work_items;
create policy "work_items_owner_all" on public.work_items
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "list_orders_owner_all" on public.list_orders;
create policy "list_orders_owner_all" on public.list_orders
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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
