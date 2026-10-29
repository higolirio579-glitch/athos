-- ATHOS 2.2: XP conferido pelo servidor, perfis fechados, perfil privado, quem pode mandar mensagem
-- Rode inteiro no SQL Editor do Supabase. Pode rodar de novo sem problema.

------------------------------------------------------------------
-- 2) XP e desafios: o servidor recalcula os pontos e limita km
------------------------------------------------------------------
create or replace function public.activity_guard() returns trigger
language plpgsql set search_path = public as $$
declare n int; kmday numeric; today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  -- data fora do razoável não vale ponto nem km
  if new.day > today + 1 or new.day < today - 730 then new.points := 0; new.km := 0; return new; end if;
  if new.kind = 'day' then
    new.km := 0; new.points := case when new.ref = 'd:' || new.day::text then 10 else 0 end; return new;
  end if;
  if new.kind in ('workout', 'checkin') then
    new.km := 0;
    select count(*) into n from public.activity_log where user_id = new.user_id and day = new.day and kind in ('workout', 'checkin') and points > 0;
    if n >= 4 then new.points := 0;
    else new.points := case when new.kind = 'checkin' then 25 else least(greatest(new.points, 50), 100) end; end if;
    return new;
  end if;
  -- corrida, caminhada, pedal: km máximo por atividade e por dia
  new.km := least(greatest(new.km, 0), case new.kind when 'run' then 100 when 'walk' then 60 else 300 end);
  select count(*), coalesce(sum(km), 0) into n, kmday from public.activity_log
   where user_id = new.user_id and day = new.day and kind in ('run', 'walk', 'bike') and km > 0;
  if n >= 4 or kmday + new.km > 300 then new.points := 0; new.km := 0; return new; end if;
  new.points := least(300, round(20 + new.km * case new.kind when 'run' then 10 when 'walk' then 6 else 4 end));
  return new;
end $$;
drop trigger if exists activity_guard on public.activity_log;
create trigger activity_guard before insert on public.activity_log for each row execute function public.activity_guard();
-- ninguém altera uma atividade depois de registrada (só apaga)
drop policy if exists "altera atividade" on public.activity_log;

-- medalha só se o desafio foi mesmo completado (conferido nos registros do servidor)
create or replace function public.medal_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare mk text := split_part(new.key, ':', 1); cid text := split_part(new.key, ':', 2);
  d0 date; d1 date; cur date := date_trunc('month', now() at time zone 'America/Sao_Paulo')::date;
  metric text; goal numeric; ttl text; ic text; v numeric;
begin
  if mk !~ '^[0-9]{4}-[0-9]{2}$' then raise exception 'medalha inválida'; end if;
  d0 := to_date(mk || '-01', 'YYYY-MM-DD'); d1 := (d0 + interval '1 month' - interval '1 day')::date;
  if d0 > cur or d0 < (cur - interval '1 month')::date then raise exception 'medalha fora do prazo'; end if;
  select x.m, x.g, x.t, x.i into metric, goal, ttl, ic from (values
    ('km50', 'km', 50, '50 km no mês', '🏃'),
    ('treinos16', 'workouts', 16, '16 treinos no mês', '🏋️'),
    ('dias20', 'days', 20, '20 dias ativos', '🔥'),
    ('run10', 'long_run', 10, 'Uma corrida de 10 km', '🎯'),
    ('pedal100', 'bike_km', 100, '100 km de pedal', '🚴')) as x(id, m, g, t, i) where x.id = cid;
  if metric is null then raise exception 'medalha inválida'; end if;
  select case metric
      when 'km' then coalesce(sum(km) filter (where kind in ('run', 'walk')), 0)
      when 'bike_km' then coalesce(sum(km) filter (where kind = 'bike'), 0)
      when 'long_run' then coalesce(max(km) filter (where kind = 'run'), 0)
      when 'workouts' then count(*) filter (where kind in ('workout', 'checkin') and points > 0)
      when 'days' then count(distinct day) end
    into v from public.activity_log where user_id = new.user_id and day between d0 and d1;
  if v < goal then raise exception 'desafio ainda não completo'; end if;
  new.title := ttl || ' · ' || (array['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'])[extract(month from d0)::int];
  new.icon := ic;
  return new;
end $$;
drop trigger if exists medals_guard on public.medals;
create trigger medals_guard before insert on public.medals for each row execute function public.medal_guard();

------------------------------------------------------------------
-- 4 e 5) perfil privado e quem pode mandar mensagem
------------------------------------------------------------------
alter table public.profiles add column if not exists is_private boolean not null default false;
alter table public.profiles add column if not exists dm_policy text not null default 'all';
alter table public.profiles drop constraint if exists profiles_dm_policy_check;
alter table public.profiles add constraint profiles_dm_policy_check check (dm_policy in ('all', 'following'));

create or replace function public.is_private_profile(u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_private from public.profiles where id = u), false);
$$;

create table if not exists public.follow_requests (
  requester uuid not null default auth.uid() references public.profiles on delete cascade,
  target uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (requester, target),
  check (requester <> target)
);
alter table public.follow_requests enable row level security;
drop policy if exists "vê os próprios pedidos" on public.follow_requests;
create policy "vê os próprios pedidos" on public.follow_requests for select to authenticated using (requester = auth.uid() or target = auth.uid());
drop policy if exists "pede para seguir" on public.follow_requests;
create policy "pede para seguir" on public.follow_requests for insert to authenticated
  with check (requester = auth.uid() and public.is_private_profile(target) and not public.is_blocked(requester, target));
drop policy if exists "cancela ou recusa pedido" on public.follow_requests;
create policy "cancela ou recusa pedido" on public.follow_requests for delete to authenticated using (requester = auth.uid() or target = auth.uid());

-- seguir direto só perfis abertos (os privados passam pelo pedido)
drop policy if exists "segue" on public.follows;
create policy "segue" on public.follows for insert to authenticated
  with check (follower = auth.uid() and not public.is_blocked(follower, following) and not public.is_private_profile(following));

-- aceitar o pedido
create or replace function public.approve_follow(p_requester uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.follow_requests where requester = p_requester and target = auth.uid()) then raise exception 'pedido não encontrado'; end if;
  delete from public.follow_requests where requester = p_requester and target = auth.uid();
  perform set_config('athos.approving', '1', true);
  insert into public.follows (follower, following) values (p_requester, auth.uid()) on conflict do nothing;
  perform set_config('athos.approving', '', true);
end $$;
revoke execute on function public.approve_follow(uuid) from public, anon;
grant execute on function public.approve_follow(uuid) to authenticated;

-- notificações: pedido recebido e pedido aceito
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check (kind in ('like', 'comment', 'follow', 'message', 'pr', 'request', 'accepted', 'club_request', 'club_ok'));
create or replace function public.notify_follow() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if current_setting('athos.approving', true) = '1' then
    insert into public.notifications (user_id, actor_id, kind) values (new.follower, new.following, 'accepted');
    return new;
  end if;
  delete from public.notifications where user_id = new.following and actor_id = new.follower and kind = 'follow';
  insert into public.notifications (user_id, actor_id, kind) values (new.following, new.follower, 'follow');
  return new;
end $$;
create or replace function public.notify_request() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.notifications where user_id = new.target and actor_id = new.requester and kind = 'request';
  insert into public.notifications (user_id, actor_id, kind) values (new.target, new.requester, 'request');
  return new;
end $$;
drop trigger if exists follow_requests_notify on public.follow_requests;
create trigger follow_requests_notify after insert on public.follow_requests for each row execute function public.notify_request();

-- posts de perfil privado: só seguidores aprovados veem, mesmo os marcados como públicos
create or replace function public.can_see_post(p_user uuid, p_vis text) returns boolean
language sql stable security definer set search_path = public as $$
  select p_user = auth.uid()
    or (not public.is_blocked(p_user, auth.uid()) and (
          (p_vis = 'public' and not public.is_private_profile(p_user))
       or (p_vis in ('public', 'followers') and exists (select 1 from public.follows f where f.follower = auth.uid() and f.following = p_user))));
$$;

-- mensagens: respeita "só quem eu sigo"
create or replace function public.dm_allowed(conv uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select c.is_group from public.conversations c where c.id = conv), false)
    or not exists (
      select 1 from public.conversation_members m join public.profiles p on p.id = m.user_id
      where m.conversation_id = conv and m.user_id <> auth.uid() and p.dm_policy = 'following'
        and not exists (select 1 from public.follows f where f.follower = m.user_id and f.following = auth.uid()));
$$;
drop policy if exists "envia mensagem" on public.messages;
create policy "envia mensagem" on public.messages for insert to authenticated
  with check (user_id = auth.uid() and public.is_member(conversation_id) and public.dm_allowed(conversation_id));

create or replace function public.start_dm(other uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); conv uuid;
begin
  if me is null or other is null or other = me then raise exception 'conversa inválida'; end if;
  if public.is_blocked(me, other) then raise exception 'bloqueado'; end if;
  if (select dm_policy from public.profiles where id = other) = 'following'
     and not exists (select 1 from public.follows where follower = other and following = me) then
    raise exception 'so_seguindo';
  end if;
  select c.id into conv from public.conversations c
    join public.conversation_members a on a.conversation_id = c.id and a.user_id = me
    join public.conversation_members b on b.conversation_id = c.id and b.user_id = other
   where not c.is_group limit 1;
  if conv is null then
    insert into public.conversations (is_group, created_by) values (false, me) returning id into conv;
    insert into public.conversation_members (conversation_id, user_id) values (conv, me), (conv, other);
  end if;
  return conv;
end $$;

------------------------------------------------------------------
-- 3) perfis: cada um só vê quem tem ligação com ele (a busca continua achando por nome ou ID)
------------------------------------------------------------------
create or replace function public.can_see_profile(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
       p = auth.uid()
    or exists (select 1 from public.follows f where (f.follower = auth.uid() and f.following = p) or (f.follower = p and f.following = auth.uid()))
    or exists (select 1 from public.follow_requests r where (r.requester = auth.uid() and r.target = p) or (r.requester = p and r.target = auth.uid()))
    or exists (select 1 from public.blocks b where b.blocker = auth.uid() and b.blocked = p)
    or exists (select 1 from public.conversation_members a join public.conversation_members b on b.conversation_id = a.conversation_id
               where a.user_id = auth.uid() and b.user_id = p)
    or exists (select 1 from public.club_members a join public.club_members b on b.club_id = a.club_id where a.user_id = auth.uid() and b.user_id = p)
    or exists (select 1 from public.challenge_members a join public.challenge_members b on b.key = a.key where a.user_id = auth.uid() and b.user_id = p)
    or exists (select 1 from public.notifications n where n.user_id = auth.uid() and n.actor_id = p)
    or (not public.is_private_profile(p) and exists (select 1 from public.posts po where po.user_id = p and po.visibility = 'public'))
    or exists (select 1 from public.comments c join public.posts po on po.id = c.post_id
               where c.user_id = p and public.can_see_post(po.user_id, po.visibility))
  );
$$;
drop policy if exists "perfis visíveis" on public.profiles;
create policy "perfis visíveis" on public.profiles for select to authenticated using (public.can_see_profile(id));

------------------------------------------------------------------
-- clubes: para entrar, o criador precisa aceitar
------------------------------------------------------------------
create table if not exists public.club_requests (
  club_id uuid not null references public.clubs on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (club_id, user_id)
);
alter table public.club_requests enable row level security;
create or replace function public.club_owner(c uuid) returns uuid
language sql stable security definer set search_path = public as $$ select owner from public.clubs where id = c; $$;
drop policy if exists "vê pedidos do clube" on public.club_requests;
create policy "vê pedidos do clube" on public.club_requests for select to authenticated
  using (user_id = auth.uid() or public.club_owner(club_id) = auth.uid());
drop policy if exists "pede para entrar no clube" on public.club_requests;
create policy "pede para entrar no clube" on public.club_requests for insert to authenticated
  with check (user_id = auth.uid() and not public.is_blocked(auth.uid(), public.club_owner(club_id))
    and not exists (select 1 from public.club_members m where m.club_id = club_requests.club_id and m.user_id = auth.uid()));
drop policy if exists "cancela ou recusa pedido do clube" on public.club_requests;
create policy "cancela ou recusa pedido do clube" on public.club_requests for delete to authenticated
  using (user_id = auth.uid() or public.club_owner(club_id) = auth.uid());

-- ninguém entra direto: só o criador (ao criar) ou pela aprovação
drop policy if exists "entra no clube" on public.club_members;
create policy "entra no clube" on public.club_members for insert to authenticated
  with check (user_id = auth.uid() and public.club_owner(club_id) = auth.uid());

alter table public.notifications add column if not exists club_id uuid references public.clubs on delete cascade;
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('like', 'comment', 'follow', 'message', 'pr', 'request', 'accepted', 'club_request', 'club_ok'));

create or replace function public.approve_club_member(p_club uuid, p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare nm text;
begin
  if public.club_owner(p_club) is distinct from auth.uid() then raise exception 'só o criador do clube pode aceitar'; end if;
  if not exists (select 1 from public.club_requests where club_id = p_club and user_id = p_user) then raise exception 'pedido não encontrado'; end if;
  delete from public.club_requests where club_id = p_club and user_id = p_user;
  insert into public.club_members (club_id, user_id) values (p_club, p_user) on conflict do nothing;
  select name into nm from public.clubs where id = p_club;
  insert into public.notifications (user_id, actor_id, kind, club_id, body) values (p_user, auth.uid(), 'club_ok', p_club, left(nm, 200));
end $$;
revoke execute on function public.approve_club_member(uuid, uuid) from public, anon;
grant execute on function public.approve_club_member(uuid, uuid) to authenticated;

create or replace function public.notify_club_request() returns trigger
language plpgsql security definer set search_path = public as $$
declare ow uuid; nm text;
begin
  select owner, name into ow, nm from public.clubs where id = new.club_id;
  if ow is null or ow = new.user_id then return new; end if;
  delete from public.notifications where user_id = ow and actor_id = new.user_id and kind = 'club_request' and club_id = new.club_id;
  insert into public.notifications (user_id, actor_id, kind, club_id, body) values (ow, new.user_id, 'club_request', new.club_id, left(nm, 200));
  return new;
end $$;
drop trigger if exists club_requests_notify on public.club_requests;
create trigger club_requests_notify after insert on public.club_requests for each row execute function public.notify_club_request();

-- o criador vê o perfil de quem pediu para entrar
create or replace function public.can_see_profile(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
       p = auth.uid()
    or exists (select 1 from public.follows f where (f.follower = auth.uid() and f.following = p) or (f.follower = p and f.following = auth.uid()))
    or exists (select 1 from public.follow_requests r where (r.requester = auth.uid() and r.target = p) or (r.requester = p and r.target = auth.uid()))
    or exists (select 1 from public.blocks b where b.blocker = auth.uid() and b.blocked = p)
    or exists (select 1 from public.conversation_members a join public.conversation_members b on b.conversation_id = a.conversation_id
               where a.user_id = auth.uid() and b.user_id = p)
    or exists (select 1 from public.club_members a join public.club_members b on b.club_id = a.club_id where a.user_id = auth.uid() and b.user_id = p)
    or exists (select 1 from public.club_requests r join public.clubs c on c.id = r.club_id where r.user_id = p and c.owner = auth.uid())
    or exists (select 1 from public.clubs c where c.owner = p)
    or exists (select 1 from public.challenge_members a join public.challenge_members b on b.key = a.key where a.user_id = auth.uid() and b.user_id = p)
    or exists (select 1 from public.notifications n where n.user_id = auth.uid() and n.actor_id = p)
    or (not public.is_private_profile(p) and exists (select 1 from public.posts po where po.user_id = p and po.visibility = 'public'))
    or exists (select 1 from public.comments c join public.posts po on po.id = c.post_id
               where c.user_id = p and public.can_see_post(po.user_id, po.visibility))
  );
$$;
