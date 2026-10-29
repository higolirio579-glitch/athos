-- ATHOS: competição (XP e nível, desafios do mês, medalhas e aviso de recorde)
-- Rode inteiro no SQL Editor do Supabase. Pode rodar de novo sem problema.

alter table public.profiles add column if not exists xp integer not null default 0;

-- cada treino, corrida e dia ativo vira uma linha com os pontos
create table if not exists public.activity_log (
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  ref text not null check (char_length(ref) between 1 and 80),
  day date not null,
  kind text not null check (kind in ('workout', 'checkin', 'run', 'walk', 'bike', 'day')),
  km numeric not null default 0 check (km >= 0 and km < 1000),
  points integer not null default 0 check (points between 0 and 500),
  created_at timestamptz not null default now(),
  primary key (user_id, ref)
);
create index if not exists activity_log_day on public.activity_log (user_id, day);
alter table public.activity_log enable row level security;
drop policy if exists "vê as próprias atividades" on public.activity_log;
create policy "vê as próprias atividades" on public.activity_log for select to authenticated using (user_id = auth.uid());
drop policy if exists "registra as próprias atividades" on public.activity_log;
create policy "registra as próprias atividades" on public.activity_log for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "apaga as próprias atividades" on public.activity_log;
create policy "apaga as próprias atividades" on public.activity_log for delete to authenticated using (user_id = auth.uid());

-- medalhas dos desafios (cada uma vale 200 XP)
create table if not exists public.medals (
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  key text not null check (char_length(key) between 1 and 60),
  title text not null check (char_length(title) <= 80),
  icon text check (char_length(icon) <= 8),
  created_at timestamptz not null default now(),
  primary key (user_id, key)
);
alter table public.medals enable row level security;
drop policy if exists "medalhas visíveis" on public.medals;
create policy "medalhas visíveis" on public.medals for select to authenticated using (true);
drop policy if exists "ganha a própria medalha" on public.medals;
create policy "ganha a própria medalha" on public.medals for insert to authenticated with check (user_id = auth.uid());

-- XP total no perfil, sempre somado pelo servidor
create or replace function public.xp_from_activity() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then update public.profiles set xp = xp + new.points where id = new.user_id;
  else update public.profiles set xp = greatest(0, xp - old.points) where id = old.user_id; end if;
  return null;
end $$;
drop trigger if exists activity_xp on public.activity_log;
create trigger activity_xp after insert or delete on public.activity_log for each row execute function public.xp_from_activity();

create or replace function public.xp_from_medal() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set xp = xp + 200 where id = new.user_id;
  return null;
end $$;
drop trigger if exists medal_xp on public.medals;
create trigger medal_xp after insert on public.medals for each row execute function public.xp_from_medal();

-- o XP só muda pelos gatilhos acima
create or replace function public.protect_xp() returns trigger
language plpgsql as $$
begin
  if new.xp is distinct from old.xp and current_setting('role', true) = 'authenticated' and pg_trigger_depth() = 1 then new.xp := old.xp; end if;
  return new;
end $$;
drop trigger if exists profiles_protect_xp on public.profiles;
create trigger profiles_protect_xp before update on public.profiles for each row execute function public.protect_xp();

-- quem entrou em cada desafio (chave = mês:desafio, ex. 2026-11:km50)
create table if not exists public.challenge_members (
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  key text not null check (char_length(key) between 1 and 60),
  joined_at timestamptz not null default now(),
  primary key (user_id, key)
);
alter table public.challenge_members enable row level security;
drop policy if exists "participantes visíveis" on public.challenge_members;
create policy "participantes visíveis" on public.challenge_members for select to authenticated using (true);
drop policy if exists "entra no desafio" on public.challenge_members;
create policy "entra no desafio" on public.challenge_members for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "sai do desafio" on public.challenge_members;
create policy "sai do desafio" on public.challenge_members for delete to authenticated using (user_id = auth.uid());

-- ranking de um desafio: só mostra os totais de quem participa
create or replace function public.challenge_board(p_key text, p_metric text, p_from date, p_to date)
returns table (user_id uuid, value numeric)
language sql stable security definer set search_path = public as $$
  select m.user_id,
    case p_metric
      when 'km' then coalesce(sum(a.km) filter (where a.kind in ('run', 'walk')), 0)
      when 'bike_km' then coalesce(sum(a.km) filter (where a.kind = 'bike'), 0)
      when 'long_run' then coalesce(max(a.km) filter (where a.kind = 'run'), 0)
      when 'workouts' then count(a.ref) filter (where a.kind in ('workout', 'checkin'))::numeric
      when 'activities' then count(a.ref) filter (where a.kind <> 'day')::numeric
      when 'days' then count(distinct a.day)::numeric
      else 0 end as value
  from public.challenge_members m
  left join public.activity_log a on a.user_id = m.user_id and a.day between p_from and p_to
  where m.key = p_key and auth.uid() is not null and not public.is_blocked(m.user_id, auth.uid())
  group by m.user_id
  order by 2 desc
  limit 50;
$$;
revoke execute on function public.challenge_board(text, text, date, date) from public, anon;
grant execute on function public.challenge_board(text, text, date, date) to authenticated;

-- recorde no post avisa quem segue
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check (kind in ('like', 'comment', 'follow', 'message', 'pr'));

create or replace function public.notify_pr() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.visibility = 'private' or jsonb_array_length(coalesce(new.stats -> 'prs', '[]'::jsonb)) = 0 then return new; end if;
  insert into public.notifications (user_id, actor_id, kind, post_id, body)
  select f.follower, new.user_id, 'pr', new.id, left(new.stats -> 'prs' ->> 0, 200)
  from public.follows f
  where f.following = new.user_id and not public.is_blocked(f.follower, new.user_id);
  return new;
end $$;
drop trigger if exists posts_notify_pr on public.posts;
create trigger posts_notify_pr after insert on public.posts for each row execute function public.notify_pr();
