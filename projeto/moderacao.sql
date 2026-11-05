-- ATHOS: painel de moderador. Rode no SQL Editor do Supabase (pode rodar mais de uma vez).
-- Só quem está na tabela athos_private.moderators vê e usa o painel. Tudo passa por funções que checam isso.

create schema if not exists athos_private;
revoke all on schema athos_private from public, anon, authenticated;
create table if not exists athos_private.moderators (user_id uuid primary key references auth.users on delete cascade);

-- o dono do app vira moderador pelo ID público do perfil (377 5853)
insert into athos_private.moderators (user_id)
select id from public.profiles where public_id = '3775853' on conflict do nothing;

create or replace function public.is_mod() returns boolean
language sql stable security definer set search_path = athos_private, public as $$
  select exists (select 1 from athos_private.moderators where user_id = auth.uid());
$$;
revoke execute on function public.is_mod() from public, anon;
grant execute on function public.is_mod() to authenticated;

-- denúncias: o que foi denunciado, situação e o texto guardado se o conteúdo for apagado
alter table public.reports add column if not exists message_id bigint references public.messages on delete set null;
alter table public.reports add column if not exists club_id uuid references public.clubs on delete set null;
alter table public.reports add column if not exists status text not null default 'aberta';
alter table public.reports add column if not exists resolved_at timestamptz;
alter table public.reports add column if not exists action text;
alter table public.reports add column if not exists snapshot text;
alter table public.reports drop constraint if exists reports_status_check;
alter table public.reports add constraint reports_status_check check (status in ('aberta', 'resolvida', 'descartada'));
-- apagar o conteúdo não apaga mais a denúncia (fica o histórico)
alter table public.reports drop constraint if exists reports_post_id_fkey;
alter table public.reports add constraint reports_post_id_fkey foreign key (post_id) references public.posts on delete set null;
alter table public.reports drop constraint if exists reports_comment_id_fkey;
alter table public.reports add constraint reports_comment_id_fkey foreign key (comment_id) references public.comments on delete set null;
create index if not exists reports_status_idx on public.reports (status, created_at desc);

-- suspensão de contas
alter table public.profiles add column if not exists banned_until timestamptz;
alter table public.profiles add column if not exists ban_reason text;
-- o próprio usuário não consegue tirar a suspensão
create or replace function public.protect_ban() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.banned_until is distinct from old.banned_until or new.ban_reason is distinct from old.ban_reason)
     and current_setting('role', true) = 'authenticated' and pg_trigger_depth() = 1 then
    new.banned_until := old.banned_until; new.ban_reason := old.ban_reason;
  end if;
  return new;
end $$;
drop trigger if exists profiles_protect_ban on public.profiles;
create trigger profiles_protect_ban before update on public.profiles for each row execute function public.protect_ban();

-- conta suspensa não posta, não comenta, não manda mensagem e não cria clube
create or replace function public.block_banned() returns trigger
language plpgsql security definer set search_path = public as $$
declare who uuid; until timestamptz;
begin
  who := case tg_table_name when 'clubs' then new.owner else new.user_id end;
  select banned_until into until from public.profiles where id = who;
  if until is not null and until > now() then raise exception 'conta_suspensa'; end if;
  return new;
end $$;
drop trigger if exists posts_block_banned on public.posts;
create trigger posts_block_banned before insert on public.posts for each row execute function public.block_banned();
drop trigger if exists comments_block_banned on public.comments;
create trigger comments_block_banned before insert on public.comments for each row execute function public.block_banned();
drop trigger if exists messages_block_banned on public.messages;
create trigger messages_block_banned before insert on public.messages for each row execute function public.block_banned();
drop trigger if exists clubs_block_banned on public.clubs;
create trigger clubs_block_banned before insert on public.clubs for each row execute function public.block_banned();

-- lista de denúncias com prévia do conteúdo
create or replace function public.mod_reports(p_status text default 'aberta') returns table (
  id uuid, created_at timestamptz, status text, reason text, action text,
  kind text, target_id text, preview text, photo text,
  reporter_name text, author_id uuid, author_name text, author_public_id text, author_banned_until timestamptz, author_reports bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_mod() then raise exception 'sem_permissao'; end if;
  return query
  select r.id, r.created_at, r.status, r.reason, r.action,
    case when r.post_id is not null then 'post' when r.comment_id is not null then 'comment'
         when r.message_id is not null then 'message' when r.club_id is not null then 'club' else 'user' end,
    coalesce(r.post_id::text, r.comment_id::text, r.message_id::text, r.club_id::text, r.user_id::text),
    coalesce(
      case when r.post_id is not null then (select concat_ws(' — ', p.title, p.body) from public.posts p where p.id = r.post_id) end,
      case when r.comment_id is not null then (select c.body from public.comments c where c.id = r.comment_id) end,
      case when r.message_id is not null then (select m.body from public.messages m where m.id = r.message_id) end,
      case when r.club_id is not null then (select concat_ws(' — ', k.name, k.description) from public.clubs k where k.id = r.club_id) end,
      r.snapshot,
      case when r.post_id is null and r.comment_id is null and r.message_id is null and r.club_id is null then (select concat_ws(' — ', u.name, u.bio) from public.profiles u where u.id = r.user_id) end),
    (select p.photo_url from public.posts p where p.id = r.post_id),
    (select rp.name from public.profiles rp where rp.id = r.reporter),
    a.id, a.name, a.public_id, a.banned_until,
    (select count(*) from public.reports x where x.status <> 'descartada' and (x.user_id = a.id or x.post_id in (select id from public.posts where user_id = a.id)))
  from public.reports r
  left join lateral (
    select coalesce(
      (select p.user_id from public.posts p where p.id = r.post_id),
      (select c.user_id from public.comments c where c.id = r.comment_id),
      (select m.user_id from public.messages m where m.id = r.message_id),
      (select k.owner from public.clubs k where k.id = r.club_id),
      r.user_id) as uid
  ) t on true
  left join public.profiles a on a.id = t.uid
  where p_status = 'todas' or r.status = p_status
  order by r.created_at desc
  limit 200;
end $$;

-- resolver: apagar o conteúdo, descartar ou só marcar como resolvida
create or replace function public.mod_resolve(p_report uuid, p_action text) returns void
language plpgsql security definer set search_path = public as $$
declare r public.reports; snap text;
begin
  if not public.is_mod() then raise exception 'sem_permissao'; end if;
  select * into r from public.reports where id = p_report;
  if not found then raise exception 'nao_encontrada'; end if;
  if p_action = 'descartar' then
    update public.reports set status = 'descartada', action = 'descartada', resolved_at = now() where id = p_report; return;
  end if;
  if p_action = 'apagar' then
    if r.post_id is not null then select concat_ws(' — ', title, body) into snap from public.posts where id = r.post_id; delete from public.posts where id = r.post_id;
    elsif r.comment_id is not null then select body into snap from public.comments where id = r.comment_id; delete from public.comments where id = r.comment_id;
    elsif r.message_id is not null then select body into snap from public.messages where id = r.message_id; delete from public.messages where id = r.message_id;
    elsif r.club_id is not null then select concat_ws(' — ', name, description) into snap from public.clubs where id = r.club_id; delete from public.clubs where id = r.club_id;
    end if;
    -- fecha todas as denúncias abertas do mesmo conteúdo
    update public.reports set status = 'resolvida', action = 'conteúdo apagado', resolved_at = now(), snapshot = coalesce(snap, snapshot)
      where status = 'aberta' and (id = p_report
        or (r.post_id is not null and post_id = r.post_id) or (r.comment_id is not null and comment_id = r.comment_id)
        or (r.message_id is not null and message_id = r.message_id) or (r.club_id is not null and club_id = r.club_id));
    return;
  end if;
  update public.reports set status = 'resolvida', action = coalesce(nullif(p_action, ''), 'resolvida'), resolved_at = now() where id = p_report;
end $$;

-- suspender (p_days = 0 tira a suspensão; p_days = -1 é para sempre)
create or replace function public.mod_suspend(p_user uuid, p_days int, p_reason text default null) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare until timestamptz;
begin
  if not public.is_mod() then raise exception 'sem_permissao'; end if;
  if exists (select 1 from athos_private.moderators where user_id = p_user) then raise exception 'nao_pode_suspender_moderador'; end if;
  until := case when p_days = 0 then null when p_days < 0 then 'infinity'::timestamptz else now() + make_interval(days => p_days) end;
  update public.profiles set banned_until = until, ban_reason = case when p_days = 0 then null else left(p_reason, 300) end where id = p_user;
  return until;
end $$;

create or replace function public.mod_banned() returns table (id uuid, name text, public_id text, banned_until timestamptz, ban_reason text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_mod() then raise exception 'sem_permissao'; end if;
  return query select p.id, p.name, p.public_id, p.banned_until, p.ban_reason from public.profiles p where p.banned_until > now() order by p.banned_until;
end $$;

-- números do app
create or replace function public.mod_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_mod() then raise exception 'sem_permissao'; end if;
  return jsonb_build_object(
    'usuarios', (select count(*) from public.profiles),
    'novos_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'novos_hoje', (select count(*) from public.profiles where created_at > date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'),
    'posts_7d', (select count(*) from public.posts where created_at > now() - interval '7 days'),
    'mensagens_7d', (select count(*) from public.messages where created_at > now() - interval '7 days'),
    'clubes', (select count(*) from public.clubs),
    'denuncias_abertas', (select count(*) from public.reports where status = 'aberta'),
    'suspensos', (select count(*) from public.profiles where banned_until > now()),
    'novos_por_dia', (select coalesce(jsonb_agg(jsonb_build_object('d', d, 'n', n) order by d), '[]'::jsonb) from (
        select (created_at at time zone 'America/Sao_Paulo')::date as d, count(*) as n from public.profiles
        where created_at > now() - interval '14 days' group by 1) s)
  );
end $$;

do $$ declare f text; begin
  foreach f in array array['mod_reports(text)','mod_resolve(uuid, text)','mod_suspend(uuid, int, text)','mod_banned()','mod_stats()'] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- conferência: deve mostrar 1 moderador (você)
select m.user_id, p.name, p.public_id from athos_private.moderators m join public.profiles p on p.id = m.user_id;
