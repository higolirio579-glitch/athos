-- ATHOS: fotos de evolução na nuvem (pasta privada, até 20 por pessoa, apaga após 30 dias sem abrir o app)
-- Rode inteiro no SQL Editor do Supabase. Pode rodar de novo sem problema.

-- pasta privada (não é pública como a de fotos de perfil)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('progresso', 'progresso', false, 1048576, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 1048576, allowed_mime_types = array['image/jpeg'];

create or replace function public.pp_count(u uuid) returns int
language sql stable security definer set search_path = public, storage as $$
  select count(*)::int from storage.objects where bucket_id = 'progresso' and (storage.foldername(name))[1] = u::text;
$$;
revoke execute on function public.pp_count(uuid) from public, anon;
grant execute on function public.pp_count(uuid) to authenticated;

drop policy if exists "progresso: vê as próprias" on storage.objects;
create policy "progresso: vê as próprias" on storage.objects for select to authenticated
  using (bucket_id = 'progresso' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "progresso: envia até 20" on storage.objects;
create policy "progresso: envia até 20" on storage.objects for insert to authenticated
  with check (bucket_id = 'progresso' and (storage.foldername(name))[1] = auth.uid()::text and public.pp_count(auth.uid()) < 20);
drop policy if exists "progresso: apaga as próprias" on storage.objects;
create policy "progresso: apaga as próprias" on storage.objects for delete to authenticated
  using (bucket_id = 'progresso' and (storage.foldername(name))[1] = auth.uid()::text);

-- lista das fotos (data de cada uma)
create table if not exists public.progress_photos (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null check (id ~ '^[a-z0-9]{2,24}$'),
  taken date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);
alter table public.progress_photos enable row level security;
create or replace function public.pp_rows(u uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.progress_photos where user_id = u;
$$;
revoke execute on function public.pp_rows(uuid) from public, anon;
grant execute on function public.pp_rows(uuid) to authenticated;
drop policy if exists "vê as próprias fotos de evolução" on public.progress_photos;
create policy "vê as próprias fotos de evolução" on public.progress_photos for select to authenticated using (user_id = auth.uid());
drop policy if exists "registra foto de evolução (até 20)" on public.progress_photos;
create policy "registra foto de evolução (até 20)" on public.progress_photos for insert to authenticated
  with check (user_id = auth.uid() and public.pp_rows(auth.uid()) < 20);
drop policy if exists "apaga a própria foto de evolução" on public.progress_photos;
create policy "apaga a própria foto de evolução" on public.progress_photos for delete to authenticated using (user_id = auth.uid());

-- última vez que a pessoa abriu o app (separado do "online", que pode ser escondido)
create table if not exists public.user_activity (
  user_id uuid primary key references auth.users on delete cascade,
  last_active timestamptz not null default now()
);
alter table public.user_activity enable row level security;
drop policy if exists "vê a própria atividade" on public.user_activity;
create policy "vê a própria atividade" on public.user_activity for select to authenticated using (user_id = auth.uid());
create or replace function public.touch_active() returns void
language sql security definer set search_path = public as $$
  insert into public.user_activity (user_id, last_active) values (auth.uid(), now())
  on conflict (user_id) do update set last_active = now();
$$;
revoke execute on function public.touch_active() from public, anon;
grant execute on function public.touch_active() to authenticated;

-- pastas que a limpeza diária deve apagar: 30 dias sem abrir o app, ou conta excluída
create or replace function public.pp_expired() returns table (folder text)
language sql stable security definer set search_path = public, storage as $$
  select distinct (storage.foldername(o.name))[1]
  from storage.objects o
  where o.bucket_id = 'progresso'
    and not exists (
      select 1 from public.user_activity a
      where a.user_id::text = (storage.foldername(o.name))[1] and a.last_active > now() - interval '30 days');
$$;
revoke execute on function public.pp_expired() from public, anon, authenticated;
grant execute on function public.pp_expired() to service_role;

-- fotos públicas (perfil e posts) que ficaram sem dono: conta excluída, post apagado ou foto de perfil trocada
create or replace function public.fotos_orphans() returns table (name text)
language sql stable security definer set search_path = public, storage, auth as $$
  select o.name from storage.objects o
  where o.bucket_id = 'fotos' and o.created_at < now() - interval '1 day'
    and (
      not exists (select 1 from auth.users u where u.id::text = (storage.foldername(o.name))[1])
      or (not exists (select 1 from public.posts p where p.photo_url like '%' || o.name || '%')
          and not exists (select 1 from public.profiles pr where pr.avatar_url like '%' || o.name || '%'))
    )
  limit 1000;
$$;
revoke execute on function public.fotos_orphans() from public, anon, authenticated;
grant execute on function public.fotos_orphans() to service_role;
