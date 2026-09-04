alter table public.collections enable row level security;
alter table public.saved_sources enable row level security;
alter table public.recent_searches enable row level security;

create policy "collections_select_own"
  on public.collections for select
  using (auth.uid() = user_id);

create policy "collections_insert_own"
  on public.collections for insert
  with check (auth.uid() = user_id);

create policy "collections_update_own"
  on public.collections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "collections_delete_own"
  on public.collections for delete
  using (auth.uid() = user_id);

create policy "saved_sources_select_own"
  on public.saved_sources for select
  using (auth.uid() = user_id);

create policy "saved_sources_insert_own"
  on public.saved_sources for insert
  with check (auth.uid() = user_id);

create policy "saved_sources_update_own"
  on public.saved_sources for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "saved_sources_delete_own"
  on public.saved_sources for delete
  using (auth.uid() = user_id);

create policy "recent_searches_select_own"
  on public.recent_searches for select
  using (auth.uid() = user_id);

create policy "recent_searches_insert_own"
  on public.recent_searches for insert
  with check (auth.uid() = user_id);

create policy "recent_searches_delete_own"
  on public.recent_searches for delete
  using (auth.uid() = user_id);
