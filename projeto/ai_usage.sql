-- ATHOS: limite diário de IA por pessoa (usado pela Edge Function "ai")
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users on delete cascade,
  day date not null,
  n int not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;
drop policy if exists "vê o próprio uso de IA" on public.ai_usage;
create policy "vê o próprio uso de IA" on public.ai_usage for select to authenticated using (user_id = auth.uid());

-- reserva 1 uso; devolve quantos restam, ou -1 se o limite do dia acabou
create or replace function public.ai_take(p_user uuid, p_limit int) returns int
language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'America/Sao_Paulo')::date; v int;
begin
  insert into public.ai_usage (user_id, day, n) values (p_user, d, 1)
  on conflict (user_id, day) do update set n = public.ai_usage.n + 1 where public.ai_usage.n < p_limit
  returning n into v;
  if v is null then return -1; end if;
  return p_limit - v;
end $$;

-- devolve o uso quando a IA falhou
create or replace function public.ai_give_back(p_user uuid) returns void
language sql security definer set search_path = public as $$
  update public.ai_usage set n = greatest(n - 1, 0)
   where user_id = p_user and day = (now() at time zone 'America/Sao_Paulo')::date;
$$;

-- só o servidor (service_role) pode chamar essas funções
revoke execute on function public.ai_take(uuid, int) from public, anon, authenticated;
revoke execute on function public.ai_give_back(uuid) from public, anon, authenticated;
grant execute on function public.ai_take(uuid, int) to service_role;
grant execute on function public.ai_give_back(uuid) to service_role;
