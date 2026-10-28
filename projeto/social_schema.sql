-- Ficha Social: perfis, seguidores, posts, curtidas, comentários, mensagens, clubes
-- Rode uma vez no SQL Editor do Supabase. Pode rodar de novo sem quebrar (idempotente).

create extension if not exists pgcrypto;

-- ---------- perfis ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique check (username ~ '^[a-z0-9_.]{3,24}$'),
  name text not null default 'Atleta' check (char_length(name) between 1 and 60),
  city text check (char_length(city) <= 60),
  bio text check (char_length(bio) <= 280),
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "perfis visíveis" on public.profiles;
create policy "perfis visíveis" on public.profiles for select to authenticated using (true);
drop policy if exists "edita o próprio perfil" on public.profiles;
create policy "edita o próprio perfil" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "cria o próprio perfil" on public.profiles;
create policy "cria o próprio perfil" on public.profiles for insert to authenticated with check (id = auth.uid());

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(nullif(left(new.raw_user_meta_data->>'name', 60), ''), split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- bloqueios e seguidores ----------
create table if not exists public.blocks (
  blocker uuid not null references public.profiles on delete cascade default auth.uid(),
  blocked uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked)
);
alter table public.blocks enable row level security;
drop policy if exists "vê os próprios bloqueios" on public.blocks;
create policy "vê os próprios bloqueios" on public.blocks for select to authenticated using (blocker = auth.uid());
drop policy if exists "bloqueia" on public.blocks;
create policy "bloqueia" on public.blocks for insert to authenticated with check (blocker = auth.uid());
drop policy if exists "desbloqueia" on public.blocks;
create policy "desbloqueia" on public.blocks for delete to authenticated using (blocker = auth.uid());

create or replace function public.is_blocked(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.blocks where (blocker = a and blocked = b) or (blocker = b and blocked = a));
$$;

create table if not exists public.follows (
  follower uuid not null references public.profiles on delete cascade default auth.uid(),
  following uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower, following),
  check (follower <> following)
);
alter table public.follows enable row level security;
drop policy if exists "seguidores visíveis" on public.follows;
create policy "seguidores visíveis" on public.follows for select to authenticated using (true);
drop policy if exists "segue" on public.follows;
create policy "segue" on public.follows for insert to authenticated with check (follower = auth.uid() and not public.is_blocked(follower, following));
drop policy if exists "deixa de seguir" on public.follows;
create policy "deixa de seguir" on public.follows for delete to authenticated using (follower = auth.uid() or following = auth.uid());

-- ---------- posts (treinos, corridas, texto) ----------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  kind text not null default 'text' check (kind in ('workout', 'run', 'text')),
  title text check (char_length(title) <= 120),
  body text check (char_length(body) <= 2000),
  stats jsonb not null default '{}'::jsonb,
  route jsonb,
  photo_url text,
  visibility text not null default 'followers' check (visibility in ('public', 'followers', 'private')),
  created_at timestamptz not null default now()
);
create index if not exists posts_user_created on public.posts (user_id, created_at desc);
create index if not exists posts_created on public.posts (created_at desc);
alter table public.posts enable row level security;

create or replace function public.can_see_post(p_user uuid, p_vis text) returns boolean
language sql stable security definer set search_path = public as $$
  select p_user = auth.uid()
    or (not public.is_blocked(p_user, auth.uid()) and (
          p_vis = 'public'
       or (p_vis = 'followers' and exists (select 1 from public.follows f where f.follower = auth.uid() and f.following = p_user))));
$$;
drop policy if exists "vê posts permitidos" on public.posts;
create policy "vê posts permitidos" on public.posts for select to authenticated using (public.can_see_post(user_id, visibility));
drop policy if exists "posta como si" on public.posts;
create policy "posta como si" on public.posts for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "edita o próprio post" on public.posts;
create policy "edita o próprio post" on public.posts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "apaga o próprio post" on public.posts;
create policy "apaga o próprio post" on public.posts for delete to authenticated using (user_id = auth.uid());

create or replace function public.can_see_post_id(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.posts p where p.id = pid and public.can_see_post(p.user_id, p.visibility));
$$;

-- ---------- curtidas e comentários ----------
create table if not exists public.likes (
  post_id uuid not null references public.posts on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.likes enable row level security;
drop policy if exists "vê curtidas" on public.likes;
create policy "vê curtidas" on public.likes for select to authenticated using (public.can_see_post_id(post_id));
drop policy if exists "curte" on public.likes;
create policy "curte" on public.likes for insert to authenticated with check (user_id = auth.uid() and public.can_see_post_id(post_id));
drop policy if exists "descurte" on public.likes;
create policy "descurte" on public.likes for delete to authenticated using (user_id = auth.uid());

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists comments_post on public.comments (post_id, created_at);
alter table public.comments enable row level security;
drop policy if exists "vê comentários" on public.comments;
create policy "vê comentários" on public.comments for select to authenticated using (public.can_see_post_id(post_id) and not public.is_blocked(user_id, auth.uid()));
drop policy if exists "comenta" on public.comments;
create policy "comenta" on public.comments for insert to authenticated with check (user_id = auth.uid() and public.can_see_post_id(post_id));
drop policy if exists "apaga comentário" on public.comments;
create policy "apaga comentário" on public.comments for delete to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid()));

-- ---------- clubes ----------
create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  description text check (char_length(description) <= 500),
  owner uuid not null references public.profiles on delete cascade default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.clubs enable row level security;
drop policy if exists "clubes visíveis" on public.clubs;
create policy "clubes visíveis" on public.clubs for select to authenticated using (true);
drop policy if exists "cria clube" on public.clubs;
create policy "cria clube" on public.clubs for insert to authenticated with check (owner = auth.uid());
drop policy if exists "dono edita clube" on public.clubs;
create policy "dono edita clube" on public.clubs for update to authenticated using (owner = auth.uid());
drop policy if exists "dono apaga clube" on public.clubs;
create policy "dono apaga clube" on public.clubs for delete to authenticated using (owner = auth.uid());

create table if not exists public.club_members (
  club_id uuid not null references public.clubs on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);
alter table public.club_members enable row level security;
drop policy if exists "membros visíveis" on public.club_members;
create policy "membros visíveis" on public.club_members for select to authenticated using (true);
drop policy if exists "entra no clube" on public.club_members;
create policy "entra no clube" on public.club_members for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "sai do clube" on public.club_members;
create policy "sai do clube" on public.club_members for delete to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.clubs c where c.id = club_id and c.owner = auth.uid()));

-- ---------- conversas e mensagens ----------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  name text check (char_length(name) <= 60),
  club_id uuid unique references public.clubs on delete cascade,
  created_by uuid references public.profiles on delete set null default auth.uid(),
  last_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  last_read timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists messages_conv on public.messages (conversation_id, created_at desc);

create or replace function public.is_member(conv uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conversation_members m where m.conversation_id = conv and m.user_id = auth.uid());
$$;

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
drop policy if exists "vê as próprias conversas" on public.conversations;
create policy "vê as próprias conversas" on public.conversations for select to authenticated using (public.is_member(id));
drop policy if exists "vê membros das conversas" on public.conversation_members;
create policy "vê membros das conversas" on public.conversation_members for select to authenticated using (public.is_member(conversation_id));
drop policy if exists "marca como lida" on public.conversation_members;
create policy "marca como lida" on public.conversation_members for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "sai da conversa" on public.conversation_members;
create policy "sai da conversa" on public.conversation_members for delete to authenticated using (user_id = auth.uid());
drop policy if exists "lê mensagens" on public.messages;
create policy "lê mensagens" on public.messages for select to authenticated using (public.is_member(conversation_id));
drop policy if exists "envia mensagem" on public.messages;
create policy "envia mensagem" on public.messages for insert to authenticated with check (user_id = auth.uid() and public.is_member(conversation_id));
drop policy if exists "apaga a própria mensagem" on public.messages;
create policy "apaga a própria mensagem" on public.messages for delete to authenticated using (user_id = auth.uid());

create or replace function public.touch_conversation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set last_at = new.created_at where id = new.conversation_id;
  return new;
end $$;
drop trigger if exists messages_touch on public.messages;
create trigger messages_touch after insert on public.messages for each row execute function public.touch_conversation();

-- abre (ou reaproveita) a conversa privada com outra pessoa
create or replace function public.start_dm(other uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); conv uuid;
begin
  if me is null or other is null or other = me then raise exception 'conversa inválida'; end if;
  if public.is_blocked(me, other) then raise exception 'bloqueado'; end if;
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

-- cada clube tem um chat; quem entra no clube entra no chat
create or replace function public.club_chat_sync() returns trigger
language plpgsql security definer set search_path = public as $$
declare conv uuid;
begin
  if tg_op = 'INSERT' then
    select id into conv from public.conversations where club_id = new.club_id;
    if conv is null then
      insert into public.conversations (is_group, name, club_id, created_by)
      select true, c.name, c.id, c.owner from public.clubs c where c.id = new.club_id returning id into conv;
    end if;
    insert into public.conversation_members (conversation_id, user_id) values (conv, new.user_id) on conflict do nothing;
    return new;
  else
    delete from public.conversation_members m using public.conversations c
     where c.id = m.conversation_id and c.club_id = old.club_id and m.user_id = old.user_id;
    return old;
  end if;
end $$;
drop trigger if exists club_members_chat on public.club_members;
create trigger club_members_chat after insert or delete on public.club_members for each row execute function public.club_chat_sync();

create or replace function public.club_owner_joins() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.club_members (club_id, user_id) values (new.id, new.owner) on conflict do nothing;
  return new;
end $$;
drop trigger if exists clubs_owner_join on public.clubs;
create trigger clubs_owner_join after insert on public.clubs for each row execute function public.club_owner_joins();

-- ---------- denúncias ----------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter uuid not null references public.profiles on delete cascade default auth.uid(),
  post_id uuid references public.posts on delete cascade,
  comment_id uuid references public.comments on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  reason text check (char_length(reason) <= 500),
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
drop policy if exists "denuncia" on public.reports;
create policy "denuncia" on public.reports for insert to authenticated with check (reporter = auth.uid());

-- ---------- ranking semanal (respeita a visibilidade dos posts) ----------
create or replace function public.weekly_ranking(p_club uuid default null) returns table (user_id uuid, km numeric, atividades bigint, treinos bigint)
language sql stable security invoker set search_path = public as $$
  select p.user_id,
         round(coalesce(sum(case when p.kind = 'run' then (p.stats->>'dist')::numeric end), 0) / 1000, 1) as km,
         count(*) filter (where p.kind = 'run') as atividades,
         count(*) filter (where p.kind = 'workout') as treinos
    from public.posts p
   where p.created_at >= date_trunc('week', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'
     and (case when p_club is null
               then p.user_id = auth.uid() or p.user_id in (select following from public.follows where follower = auth.uid())
               else p.user_id in (select user_id from public.club_members where club_id = p_club) end)
   group by p.user_id
   order by km desc, treinos desc
   limit 50;
$$;

-- ---------- fotos ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];
drop policy if exists "envia fotos na própria pasta" on storage.objects;
create policy "envia fotos na própria pasta" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "apaga as próprias fotos" on storage.objects;
create policy "apaga as próprias fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- tempo real (chat, comentários, curtidas, posts) ----------
do $$
declare t text;
begin
  foreach t in array array['messages', 'comments', 'likes', 'posts'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- perfis de quem já tinha conta antes deste script
insert into public.profiles (id, name)
select u.id, coalesce(nullif(left(u.raw_user_meta_data->>'name', 60), ''), split_part(u.email, '@', 1)) from auth.users u
on conflict (id) do nothing;
