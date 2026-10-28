-- ATHOS: dados pessoais de cada conta (treinos, refeições, peso, metas, corridas)
create table if not exists public.user_data (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  key text not null check (char_length(key) between 1 and 80),
  data jsonb,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, key),
  check (data is null or octet_length(data::text) < 600000)
);
create index if not exists user_data_sync on public.user_data (user_id, updated_at);
alter table public.user_data enable row level security;
drop policy if exists "lê os próprios dados" on public.user_data;
create policy "lê os próprios dados" on public.user_data for select to authenticated using (user_id = auth.uid());
drop policy if exists "grava os próprios dados" on public.user_data;
create policy "grava os próprios dados" on public.user_data for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "atualiza os próprios dados" on public.user_data;
create policy "atualiza os próprios dados" on public.user_data for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "apaga os próprios dados" on public.user_data;
create policy "apaga os próprios dados" on public.user_data for delete to authenticated using (user_id = auth.uid());

-- o horário de atualização é sempre o do servidor (para a sincronização incremental)
create or replace function public.user_data_touch() returns trigger
language plpgsql as $$ begin new.updated_at := clock_timestamp(); return new; end $$;
drop trigger if exists user_data_touch on public.user_data;
create trigger user_data_touch before insert or update on public.user_data for each row execute function public.user_data_touch();

-- excluir a própria conta (apaga perfil, posts, mensagens e dados pessoais em cascata)
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'not logged'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
