-- ATHOS: agenda a limpeza diária das fotos (04:17 de Brasília). O segredo é gerado e fica só dentro do banco.
create schema if not exists athos_private;
revoke all on schema athos_private from public, anon, authenticated;
create table if not exists athos_private.settings (k text primary key, v text not null);
insert into athos_private.settings (k, v) values ('cron_secret', encode(extensions.gen_random_bytes(24), 'hex')) on conflict (k) do nothing;
create or replace function public.cron_secret_ok(s text) returns boolean
language sql stable security definer set search_path = athos_private as $$
  select exists (select 1 from athos_private.settings where k = 'cron_secret' and v = s);
$$;
revoke execute on function public.cron_secret_ok(text) from public, anon, authenticated;
grant execute on function public.cron_secret_ok(text) to service_role;
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
select cron.unschedule(jobid) from cron.job where jobname = 'athos-limpeza-fotos';
select cron.schedule('athos-limpeza-fotos', '17 7 * * *', $cron$
  select net.http_post(
    url := 'https://shvphmajljvlnqlhryfw.supabase.co/functions/v1/limpeza-fotos',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron', (select v from athos_private.settings where k = 'cron_secret')),
    body := '{}'::jsonb);
$cron$);
