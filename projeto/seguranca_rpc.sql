-- ATHOS: impede que visitantes SEM login (chave anon, que é pública no app) chamem funções auxiliares do banco.
-- Essas funções são usadas pelas regras de acesso (RLS) de quem está logado, então "authenticated" continua podendo.
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez. Não apaga nem muda dados.
do $$
declare f text;
begin
  foreach f in array array[
    'is_blocked(uuid, uuid)','club_owner(uuid)','is_private_profile(uuid)','msg_conv(bigint)',
    'is_member(uuid)','dm_allowed(uuid)','can_see_profile(uuid)','can_see_post(uuid)','can_see_post_id(bigint)','start_dm(uuid)'
  ] loop
    begin
      execute format('revoke execute on function public.%s from public, anon', f);
      execute format('grant execute on function public.%s to authenticated', f);
    exception when undefined_function then
      raise notice 'função não encontrada (assinatura diferente?): %', f;
    end;
  end loop;
end $$;
-- Conferência: deve listar só authenticated/service_role/postgres, sem anon nem PUBLIC
select p.proname, p.proacl from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('is_blocked','club_owner','is_private_profile','msg_conv','is_member','dm_allowed','can_see_profile','can_see_post','can_see_post_id','start_dm');
