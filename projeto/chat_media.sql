-- ATHOS 2.3: fotos e áudios no chat (pasta privada: só quem está na conversa vê)
-- Rode inteiro no SQL Editor do Supabase. Pode rodar de novo sem problema.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat', 'chat', false, 5242880, array['image/jpeg', 'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg', 'audio/aac'])
on conflict (id) do update set public = false, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg', 'audio/aac'];

-- o primeiro pedaço do caminho é a conversa; só membros acessam
create or replace function public.chat_can(p_name text) returns boolean
language plpgsql stable security definer set search_path = public, storage as $$
declare f text := (storage.foldername(p_name))[1];
begin
  if f is null or f !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return false; end if;
  return public.is_member(f::uuid);
end $$;
revoke execute on function public.chat_can(text) from public, anon;
grant execute on function public.chat_can(text) to authenticated;

create or replace function public.chat_can_send(p_name text) returns boolean
language plpgsql stable security definer set search_path = public, storage as $$
declare f text := (storage.foldername(p_name))[1];
begin
  if not public.chat_can(p_name) then return false; end if;
  if (storage.foldername(p_name))[2] is distinct from auth.uid()::text then return false; end if;
  return public.dm_allowed(f::uuid);
end $$;
revoke execute on function public.chat_can_send(text) from public, anon;
grant execute on function public.chat_can_send(text) to authenticated;

drop policy if exists "chat: vê arquivos da conversa" on storage.objects;
create policy "chat: vê arquivos da conversa" on storage.objects for select to authenticated
  using (bucket_id = 'chat' and public.chat_can(name));
drop policy if exists "chat: envia arquivo" on storage.objects;
create policy "chat: envia arquivo" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat' and public.chat_can_send(name));
drop policy if exists "chat: apaga o próprio arquivo" on storage.objects;
create policy "chat: apaga o próprio arquivo" on storage.objects for delete to authenticated
  using (bucket_id = 'chat' and (storage.foldername(name))[2] = auth.uid()::text);

-- tipos de mensagem: texto, treino, foto e áudio
alter table public.messages drop constraint if exists messages_extra_check;
alter table public.messages add constraint messages_extra_check check (
  kind in ('text', 'share', 'image', 'audio') and (meta is null or octet_length(meta::text) < 4000));

-- notificação mostra "📷 Foto" e "🎤 Áudio"
create or replace function public.notify_message() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, actor_id, kind, conversation_id, body)
  select m.user_id, new.user_id, 'message', new.conversation_id,
         left(case new.kind
                when 'share' then '💪 ' || coalesce(new.meta ->> 't', 'Compartilhou um treino')
                when 'image' then '📷 Foto'
                when 'audio' then '🎤 Áudio'
                else new.body end, 200)
  from public.conversation_members m
  where m.conversation_id = new.conversation_id and m.user_id <> new.user_id and not m.muted
    and not public.is_blocked(m.user_id, new.user_id);
  return new;
end $$;

-- arquivos do chat sem mensagem (mensagem apagada, envio que falhou, conversa apagada)
create or replace function public.chat_orphans() returns table (name text)
language sql stable security definer set search_path = public, storage as $$
  select o.name from storage.objects o
  where o.bucket_id = 'chat' and o.created_at < now() - interval '1 day'
    and not exists (select 1 from public.messages m where m.meta ->> 'path' = o.name)
  limit 1000;
$$;
revoke execute on function public.chat_orphans() from public, anon, authenticated;
grant execute on function public.chat_orphans() to service_role;
