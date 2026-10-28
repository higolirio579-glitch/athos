-- ATHOS: notificações (curtidas, comentários, seguidores, mensagens)
-- Rode inteiro no SQL Editor do Supabase. Pode rodar de novo sem problema.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles on delete cascade,
  actor_id uuid references public.profiles on delete cascade,
  kind text not null check (kind in ('like', 'comment', 'follow', 'message')),
  post_id uuid references public.posts on delete cascade,
  conversation_id uuid references public.conversations on delete cascade,
  body text check (char_length(body) <= 200),
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user on public.notifications (user_id, id desc);
alter table public.notifications enable row level security;
drop policy if exists "vê as próprias notificações" on public.notifications;
create policy "vê as próprias notificações" on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists "marca notificação como lida" on public.notifications;
create policy "marca notificação como lida" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "apaga a própria notificação" on public.notifications;
create policy "apaga a própria notificação" on public.notifications for delete to authenticated using (user_id = auth.uid());

-- gatilhos que criam as notificações
create or replace function public.notify_like() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select user_id into owner from public.posts where id = new.post_id;
  if owner is null or owner = new.user_id or public.is_blocked(owner, new.user_id) then return new; end if;
  delete from public.notifications where user_id = owner and actor_id = new.user_id and kind = 'like' and post_id = new.post_id;
  insert into public.notifications (user_id, actor_id, kind, post_id) values (owner, new.user_id, 'like', new.post_id);
  return new;
end $$;
drop trigger if exists likes_notify on public.likes;
create trigger likes_notify after insert on public.likes for each row execute function public.notify_like();

create or replace function public.notify_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select user_id into owner from public.posts where id = new.post_id;
  if owner is null or owner = new.user_id or public.is_blocked(owner, new.user_id) then return new; end if;
  insert into public.notifications (user_id, actor_id, kind, post_id, body) values (owner, new.user_id, 'comment', new.post_id, left(new.body, 200));
  return new;
end $$;
drop trigger if exists comments_notify on public.comments;
create trigger comments_notify after insert on public.comments for each row execute function public.notify_comment();

create or replace function public.notify_follow() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.notifications where user_id = new.following and actor_id = new.follower and kind = 'follow';
  insert into public.notifications (user_id, actor_id, kind) values (new.following, new.follower, 'follow');
  return new;
end $$;
drop trigger if exists follows_notify on public.follows;
create trigger follows_notify after insert on public.follows for each row execute function public.notify_follow();

create or replace function public.notify_message() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, actor_id, kind, conversation_id, body)
  select m.user_id, new.user_id, 'message', new.conversation_id, left(new.body, 200)
  from public.conversation_members m
  where m.conversation_id = new.conversation_id and m.user_id <> new.user_id and not public.is_blocked(m.user_id, new.user_id);
  return new;
end $$;
drop trigger if exists messages_notify on public.messages;
create trigger messages_notify after insert on public.messages for each row execute function public.notify_message();

-- celulares cadastrados para receber notificações com o app fechado (guarda só o hash da chave)
create table if not exists public.notif_devices (
  key_hash text primary key,
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  last_poll timestamptz
);
alter table public.notif_devices enable row level security;
revoke all on public.notif_devices from anon, authenticated;

create or replace function public.notif_register(p_key text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if auth.uid() is null or char_length(p_key) < 32 then raise exception 'invalid'; end if;
  insert into public.notif_devices (key_hash, user_id) values (encode(digest(p_key, 'sha256'), 'hex'), auth.uid())
  on conflict (key_hash) do update set user_id = excluded.user_id;
end $$;

create or replace function public.notif_unregister(p_key text) returns void
language sql security definer set search_path = public, extensions as $$
  delete from public.notif_devices where key_hash = encode(digest(p_key, 'sha256'), 'hex');
$$;

-- o app (sem login, só com a chave do aparelho) busca o que chegou depois do último id
create or replace function public.notif_poll(p_key text, p_after bigint default 0)
returns table (id bigint, kind text, actor text, body text, post_id uuid, conversation_id uuid, created_at timestamptz)
language plpgsql security definer set search_path = public, extensions as $$
declare uid uuid;
begin
  update public.notif_devices set last_poll = now() where key_hash = encode(digest(p_key, 'sha256'), 'hex') returning user_id into uid;
  if uid is null then return; end if;
  return query
    select n.id, n.kind, coalesce(p.name, 'Alguém'), n.body, n.post_id, n.conversation_id, n.created_at
    from public.notifications n left join public.profiles p on p.id = n.actor_id
    where n.user_id = uid and n.id > coalesce(p_after, 0) and not n.read and n.created_at > now() - interval '2 days'
    order by n.id limit 20;
end $$;

revoke execute on function public.notif_register(text) from public, anon;
grant execute on function public.notif_register(text) to authenticated;
grant execute on function public.notif_unregister(text) to anon, authenticated;
grant execute on function public.notif_poll(text, bigint) to anon, authenticated;

-- tempo real para o sininho
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
