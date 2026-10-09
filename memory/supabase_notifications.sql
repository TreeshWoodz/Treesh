-- Treesh notifications: friend activity + staff actions on your account, delivered live.
-- Run in Supabase Dashboard -> SQL Editor AFTER supabase_social.sql (or the all-in-one file). Safe to run again.

-- 1) one row per alert, only its owner can read it
create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  actor uuid,
  data jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_id_idx on public.notifications (user_id, id desc);

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
drop policy if exists "notifications_own_select" on public.notifications;
create policy "notifications_own_select" on public.notifications for select to authenticated using (user_id = auth.uid());

-- 2) live delivery (Supabase Realtime)
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- 3) internal helper: writes one alert (never breaks the action that caused it)
create or replace function public.treesh_notify(uid uuid, k text, who uuid, extra jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare un text; dn text; av text;
begin
  if uid is null or uid = who then return; end if;
  if not exists (select 1 from auth.users where id = uid) then return; end if;
  if who is not null then
    select t.username, t.display_name, t.avatar_url into un, dn, av from public.treesh_pub t where t.id = who;
  end if;
  -- one alert per person + kind per 10 minutes (add / cancel / add loops don't spam)
  if k <> 'staff' then
    delete from public.notifications n where n.user_id = uid and n.kind = k and n.actor is not distinct from who and n.created_at > now() - interval '10 minutes';
  end if;
  insert into public.notifications (user_id, kind, actor, data)
  values (uid, k, who, coalesce(extra, '{}'::jsonb) || case when who is null then '{}'::jsonb else jsonb_build_object('username', un, 'display_name', dn, 'avatar_url', av) end);
  -- keep the newest 300 per person
  delete from public.notifications where id in (select id from public.notifications where user_id = uid order by id desc offset 300);
exception when others then null;
end; $$;
revoke all on function public.treesh_notify(uuid, text, uuid, jsonb) from public, anon, authenticated;

-- 4) friend activity
create or replace function public.treesh_friend_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); other uuid;
begin
  if tg_op = 'INSERT' then
    if new.status = 'pending' then perform public.treesh_notify(new.addressee, 'friend_request', new.requester, null); end if;
    return null;
  elsif tg_op = 'UPDATE' then
    if old.status = 'pending' and new.status = 'accepted' then perform public.treesh_notify(new.requester, 'friend_accepted', new.addressee, null); end if;
    return null;
  end if;
  -- DELETE: only when one of the two did it (skips account deletions and blocks)
  if me is null or me not in (old.requester, old.addressee) then return null; end if;
  if not exists (select 1 from auth.users where id = me) or not exists (select 1 from public.profiles where id = me) then return null; end if;
  if exists (select 1 from public.blocks b where (b.blocker = old.requester and b.blocked = old.addressee) or (b.blocker = old.addressee and b.blocked = old.requester)) then return null; end if;
  other := case when me = old.requester then old.addressee else old.requester end;
  if old.status = 'accepted' then perform public.treesh_notify(other, 'friend_removed', me, null);
  elsif me = old.addressee then perform public.treesh_notify(other, 'friend_declined', me, null);
  else perform public.treesh_notify(other, 'request_cancelled', me, null);
  end if;
  return null;
exception when others then return null;
end; $$;
drop trigger if exists treesh_friend_notify on public.friendships;
create trigger treesh_friend_notify after insert or update or delete on public.friendships
  for each row execute function public.treesh_friend_notify();

-- 5) staff actions on your account (ban, mute, edits, verified, roles). Staff names stay private.
create or replace function public.treesh_staff_notify()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.target is null or new.action = 'delete' or new.action like 'report\_%' then return null; end if;
  perform public.treesh_notify(new.target, 'staff', null, jsonb_build_object('action', new.action, 'detail', new.detail));
  return null;
exception when others then return null;
end; $$;
drop trigger if exists treesh_staff_notify on public.mod_log;
create trigger treesh_staff_notify after insert on public.mod_log
  for each row execute function public.treesh_staff_notify();

-- 6) what the app calls
create or replace function public.my_notifications(after_id bigint)
returns setof public.notifications language sql stable security definer set search_path = public as $$
  select * from (
    select * from public.notifications
    where user_id = auth.uid() and id > coalesce(after_id, 0)
    order by id desc limit 100
  ) x order by id;
$$;

create or replace function public.notif_mark(ids bigint[], is_read boolean)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  update public.notifications set read = coalesce(is_read, true)
  where user_id = auth.uid() and (ids is null or id = any(ids));
  get diagnostics n = row_count; return n;
end; $$;

create or replace function public.notif_delete(ids bigint[])
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from public.notifications where user_id = auth.uid() and (ids is null or id = any(ids));
  get diagnostics n = row_count; return n;
end; $$;

revoke all on function public.my_notifications(bigint) from public, anon;
revoke all on function public.notif_mark(bigint[], boolean) from public, anon;
revoke all on function public.notif_delete(bigint[]) from public, anon;
grant execute on function public.my_notifications(bigint) to authenticated;
grant execute on function public.notif_mark(bigint[], boolean) to authenticated;
grant execute on function public.notif_delete(bigint[]) to authenticated;
