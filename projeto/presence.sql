-- ATHOS: status online ("Online" / "visto há 3 h")
alter table public.profiles add column if not exists last_seen timestamptz;
alter table public.profiles add column if not exists show_online boolean not null default true;
create or replace function public.touch_presence() returns void
language sql security definer set search_path = public as $$
  update public.profiles set last_seen = case when show_online then now() else null end where id = auth.uid();
$$;
revoke execute on function public.touch_presence() from public, anon;
grant execute on function public.touch_presence() to authenticated;
