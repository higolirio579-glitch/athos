-- ATHOS: ID único de 7 números para cada pessoa e busca só por nome ou ID
-- Rode inteiro no SQL Editor do Supabase. Pode rodar de novo sem problema.

alter table public.profiles add column if not exists public_id text;

create or replace function public.gen_public_id() returns text
language plpgsql volatile set search_path = public as $$
declare v text;
begin
  loop
    v := (1000000 + floor(random() * 9000000))::bigint::text;
    exit when not exists (select 1 from public.profiles where public_id = v);
  end loop;
  return v;
end $$;

-- quem já tem conta ganha o ID agora
update public.profiles set public_id = public.gen_public_id() where public_id is null;

create unique index if not exists profiles_public_id on public.profiles (public_id);
alter table public.profiles alter column public_id set not null;

-- quem criar conta ganha o ID na hora, e ninguém consegue trocar o próprio ID
create or replace function public.profiles_public_id() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.public_id is null or new.public_id !~ '^[0-9]{7}$' or exists (select 1 from public.profiles where public_id = new.public_id) then
      new.public_id := public.gen_public_id();
    end if;
  elsif new.public_id is distinct from old.public_id then
    new.public_id := old.public_id;
  end if;
  return new;
end $$;
drop trigger if exists profiles_public_id on public.profiles;
create trigger profiles_public_id before insert or update on public.profiles for each row execute function public.profiles_public_id();

-- busca de pessoas: pelo ID exato ou pelo nome (2 letras ou mais). Não lista todo mundo.
create or replace function public.search_people(q text)
returns setof public.profiles
language plpgsql stable security definer set search_path = public as $$
declare t text := btrim(coalesce(q, ''));
begin
  if auth.uid() is null then return; end if;
  t := regexp_replace(t, '^(id|#)\s*', '', 'i');
  if t ~ '^[0-9][0-9 ]{5,9}$' then
    return query select p.* from public.profiles p
      where p.public_id = replace(t, ' ', '') and not public.is_blocked(p.id, auth.uid());
    return;
  end if;
  if char_length(t) < 2 then return; end if;
  t := replace(replace(t, '%', ''), '_', '');
  return query select p.* from public.profiles p
    where (p.name ilike '%' || t || '%' or p.username ilike t || '%') and not public.is_blocked(p.id, auth.uid())
    order by (p.name ilike t || '%') desc, p.name
    limit 20;
end $$;
revoke execute on function public.search_people(text) from public, anon;
grant execute on function public.search_people(text) to authenticated;
