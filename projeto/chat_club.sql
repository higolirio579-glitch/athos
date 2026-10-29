-- ATHOS 2.2: chat e clubes mais completos
-- Rode inteiro no SQL Editor do Supabase (depois do privacy_rules.sql). Pode rodar de novo sem problema.

------------------------------------------------------------------
-- clubes: ícone, cor, tipo, cidade, aviso fixado, regras e meta da semana
------------------------------------------------------------------
alter table public.clubs add column if not exists icon text;
alter table public.clubs add column if not exists color text;
alter table public.clubs add column if not exists kind text not null default 'outro';
alter table public.clubs add column if not exists city text;
alter table public.clubs add column if not exists notice text;
alter table public.clubs add column if not exists rules text;
alter table public.clubs add column if not exists goal_km numeric;
alter table public.clubs drop constraint if exists clubs_extra_check;
alter table public.clubs add constraint clubs_extra_check check (
  (icon is null or char_length(icon) <= 8)
  and (color is null or color ~ '^#[0-9a-fA-F]{6}$')
  and kind in ('academia', 'corrida', 'ciclismo', 'crossfit', 'luta', 'funcional', 'outro')
  and (city is null or char_length(city) <= 60)
  and (notice is null or char_length(notice) <= 300)
  and (rules is null or char_length(rules) <= 1000)
  and (goal_km is null or (goal_km > 0 and goal_km <= 100000)));
drop policy if exists "dono edita clube" on public.clubs;
create policy "dono edita clube" on public.clubs for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());

-- o nome do chat do clube acompanha o nome do clube
create or replace function public.club_rename_chat() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.name is distinct from old.name then update public.conversations set name = new.name where club_id = new.id; end if;
  return new;
end $$;
drop trigger if exists clubs_rename_chat on public.clubs;
create trigger clubs_rename_chat after update on public.clubs for each row execute function public.club_rename_chat();

------------------------------------------------------------------
-- chat: responder, compartilhar treino, reações, silenciar
------------------------------------------------------------------
alter table public.messages add column if not exists reply_to bigint references public.messages on delete set null;
alter table public.messages add column if not exists kind text not null default 'text';
alter table public.messages add column if not exists meta jsonb;
alter table public.messages drop constraint if exists messages_extra_check;
alter table public.messages add constraint messages_extra_check check (
  kind in ('text', 'share') and (meta is null or octet_length(meta::text) < 4000));

alter table public.conversation_members add column if not exists muted boolean not null default false;

create or replace function public.msg_conv(mid bigint) returns uuid
language sql stable security definer set search_path = public as $$ select conversation_id from public.messages where id = mid; $$;

create table if not exists public.message_reactions (
  message_id bigint not null references public.messages on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  emoji text not null check (emoji in ('❤️', '🔥', '💪', '👏', '😂', '😮')),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);
alter table public.message_reactions enable row level security;
drop policy if exists "vê reações" on public.message_reactions;
create policy "vê reações" on public.message_reactions for select to authenticated using (public.is_member(public.msg_conv(message_id)));
drop policy if exists "reage" on public.message_reactions;
create policy "reage" on public.message_reactions for insert to authenticated
  with check (user_id = auth.uid() and public.is_member(public.msg_conv(message_id)));
drop policy if exists "troca a reação" on public.message_reactions;
create policy "troca a reação" on public.message_reactions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "tira a reação" on public.message_reactions;
create policy "tira a reação" on public.message_reactions for delete to authenticated using (user_id = auth.uid());

-- quem silenciou a conversa não recebe notificação dela
create or replace function public.notify_message() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, actor_id, kind, conversation_id, body)
  select m.user_id, new.user_id, 'message', new.conversation_id,
         left(case when new.kind = 'share' then '💪 ' || coalesce(new.meta ->> 't', 'Compartilhou um treino') else new.body end, 200)
  from public.conversation_members m
  where m.conversation_id = new.conversation_id and m.user_id <> new.user_id and not m.muted
    and not public.is_blocked(m.user_id, new.user_id);
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['message_reactions'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
