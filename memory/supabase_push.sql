-- Treesh push notifications (Web Push). Run in Supabase Dashboard -> SQL Editor AFTER supabase_notifications.sql. Safe to run again.
-- When it finishes, the result panel shows ONE value: copy it into Netlify as the PUSH_HOOK_SECRET environment variable.

-- 0) outgoing HTTP from the database (Supabase's pg_net)
create extension if not exists pg_net with schema extensions;

-- 1) one row per device that turned notifications on. Only the server (secret key) can touch these tables.
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  user_id uuid references auth.users(id) on delete cascade,
  prefs jsonb not null default '{}'::jsonb,
  platform text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_sent_at timestamptz
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

create table if not exists public.treesh_push_state (
  k text primary key,
  v text,
  at timestamptz not null default now()
);

create table if not exists public.announcements (
  id bigint generated always as identity primary key,
  title text not null,
  body text not null default '',
  url text,
  kind text not null default 'news',
  audience text not null default 'all',
  created_by uuid,
  sent int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.treesh_push_config (
  k text primary key,
  v text not null
);

alter table public.push_subscriptions enable row level security;
alter table public.treesh_push_state enable row level security;
alter table public.announcements enable row level security;
alter table public.treesh_push_config enable row level security;
revoke all on public.push_subscriptions, public.treesh_push_state, public.announcements, public.treesh_push_config from anon, authenticated;

-- where new bell alerts get sent (change the URL if Treesh moves)
insert into public.treesh_push_config (k, v) values ('hook_url', 'https://treesh.app/api/push/notify')
on conflict (k) do update set v = excluded.v;
-- the shared secret is made here, inside your database, so it never sits in a file. The last query below shows it.
insert into public.treesh_push_config (k, v) values ('hook_secret', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (k) do nothing;
-- an earlier draft of this file had a fixed secret that is now public: replace it if it was ever used
update public.treesh_push_config set v = replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
where k = 'hook_secret' and v = 'WbUS7Obk1qYzrg_41QoeVhigRCxgLiaG';

-- 2) every new bell alert -> /api/push/notify (only when that person has a device with notifications on)
create or replace function public.treesh_push_hook()
returns trigger language plpgsql security definer set search_path = public as $$
declare u text; s text;
begin
  if new.kind = 'request_cancelled' then return null; end if;
  if not exists (select 1 from public.push_subscriptions p where p.user_id = new.user_id) then return null; end if;
  select v into u from public.treesh_push_config where k = 'hook_url';
  select v into s from public.treesh_push_config where k = 'hook_secret';
  if u is null or s is null then return null; end if;
  perform net.http_post(
    url := u,
    body := jsonb_build_object('id', new.id, 'user_id', new.user_id, 'kind', new.kind, 'actor', new.actor, 'data', new.data, 'created_at', new.created_at),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-treesh-push', s),
    timeout_milliseconds := 8000
  );
  return null;
exception when others then return null;
end; $$;
revoke all on function public.treesh_push_hook() from public, anon, authenticated;
drop trigger if exists treesh_push_hook on public.notifications;
create trigger treesh_push_hook after insert on public.notifications
  for each row execute function public.treesh_push_hook();

-- 3) what the app reads: announcements + update alerts from the last 30 days (members-only ones need a sign-in)
create or replace function public.treesh_news(after_id bigint)
returns table (id bigint, title text, body text, url text, kind text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select a.id, a.title, a.body, a.url, a.kind, a.created_at
  from public.announcements a
  where a.id > coalesce(after_id, 0)
    and a.created_at > now() - interval '30 days'
    and (a.audience = 'all' or auth.uid() is not null)
  order by a.id desc
  limit 20;
$$;
revoke all on function public.treesh_news(bigint) from public;
grant execute on function public.treesh_news(bigint) to anon, authenticated;

-- 4) copy this value into Netlify -> Site configuration -> Environment variables -> PUSH_HOOK_SECRET
select v as "PUSH_HOOK_SECRET (copy into Netlify)" from public.treesh_push_config where k = 'hook_secret';
