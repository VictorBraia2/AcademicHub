create extension if not exists "pgcrypto";

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  project text,
  created_at timestamptz not null default now()
);

create index if not exists collections_user_id_idx on public.collections (user_id);

create table if not exists public.saved_sources (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  source jsonb not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_sources_collection_id_idx on public.saved_sources (collection_id);
create index if not exists saved_sources_user_id_idx on public.saved_sources (user_id);

create table if not exists public.recent_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  query text not null,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists recent_searches_user_id_idx on public.recent_searches (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists saved_sources_set_updated_at on public.saved_sources;
create trigger saved_sources_set_updated_at
  before update on public.saved_sources
  for each row execute function public.set_updated_at();
