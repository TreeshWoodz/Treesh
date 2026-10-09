-- TREESH ALL-IN-ONE SETUP. Paste everything into Supabase -> SQL Editor -> Run. Safe to run again.
-- PART 1: profiles, user_data, storage buckets, delete_user
-- Treesh accounts: run once in Supabase Dashboard -> SQL Editor

-- 1) profiles table (kept if it already exists)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

-- unique, tidy @usernames (the app saves them lowercase)
alter table public.profiles drop constraint if exists profiles_username_key;
alter table public.profiles add constraint profiles_username_key unique (username);
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format check (username is null or username ~ '^[a-z0-9_.]{3,20}$');

-- 2) Row Level Security: each user can only read and edit their own row
alter table public.profiles enable row level security;
revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

drop policy if exists "profile_select_own" on public.profiles;
create policy "profile_select_own" on public.profiles for select to authenticated
  using (auth.uid() = id);

drop policy if exists "profile_insert_own" on public.profiles;
create policy "profile_insert_own" on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "profile_update_own" on public.profiles;
create policy "profile_update_own" on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- 3) avatars bucket: public links, each user writes only inside their own folder (<user id>/avatar.jpg)
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do update set public = true;

drop policy if exists "avatar_select_own" on storage.objects;
create policy "avatar_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatar_insert_own" on storage.objects;
create policy "avatar_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatar_update_own" on storage.objects;
create policy "avatar_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatar_delete_own" on storage.objects;
create policy "avatar_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- 4) user_data: one settings backup per user (custom music is never uploaded)
create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_data enable row level security;
revoke all on public.user_data from anon;
grant select, insert, update, delete on public.user_data to authenticated;
drop policy if exists "user_data_own" on public.user_data;
create policy "user_data_own" on public.user_data for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5) treesh-data bucket: private, fonts + backdrops only (<user id>/assets.json)
insert into storage.buckets (id, name, public) values ('treesh-data', 'treesh-data', false)
  on conflict (id) do update set public = false;
drop policy if exists "tdata_all_own" on storage.objects;
create policy "tdata_all_own" on storage.objects for all to authenticated
  using (bucket_id = 'treesh-data' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'treesh-data' and (storage.foldername(name))[1] = auth.uid()::text);

-- 6) delete_user(): lets a signed-in user delete their own account completely
create or replace function public.delete_user()
returns void language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  delete from public.user_data where user_id = uid;
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end; $$;
revoke all on function public.delete_user() from public, anon;
grant execute on function public.delete_user() to authenticated;

-- 7) username_available(name): lets the app check if an @username is free (no profile data exposed)
create or replace function public.username_available(name text)
returns boolean language sql security definer set search_path = public stable as $$
  select not exists (select 1 from public.profiles where username = lower(trim(name)) and id is distinct from auth.uid());
$$;
revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;

-- PART 2: friendships, blocks, moderation, mod_log, treesh_pub view + all social/staff functions
-- Treesh social + moderation: public/private profiles, friends, blocking, people search,
-- admins & moderators, bans, mutes, verified Treesh Icons.
-- Run in Supabase Dashboard -> SQL Editor (after supabase_setup.sql). Safe to run again.

-- 1) new profile columns (the app fills these in when you sync)
alter table public.profiles add column if not exists is_private boolean not null default false;
alter table public.profiles add column if not exists privacy jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists public_data jsonb;
alter table public.profiles add column if not exists banner_url text;
create index if not exists profiles_display_name_lower on public.profiles (lower(display_name));

-- 2) friendships: one row per pair, pending until the other person accepts
create table if not exists public.friendships (
  requester uuid not null references auth.users(id) on delete cascade,
  addressee uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  primary key (requester, addressee),
  check (requester <> addressee)
);
create unique index if not exists friendships_pair on public.friendships (least(requester, addressee), greatest(requester, addressee));
create index if not exists friendships_addressee on public.friendships (addressee);

-- 3) blocks
create table if not exists public.blocks (
  blocker uuid not null references auth.users(id) on delete cascade,
  blocked uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  check (blocker <> blocked)
);
create index if not exists blocks_blocked on public.blocks (blocked);

-- 4) moderation: roles, verified Icons, bans, mutes (frozen = what the public sees while muted)
create table if not exists public.moderation (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user','moderator','admin')),
  verified boolean not null default false,
  verified_icon text,
  banned_until timestamptz,
  ban_reason text,
  muted_until timestamptz,
  mute_reason text,
  frozen jsonb,
  mod_rev int not null default 0,
  mod_edits jsonb,
  updated_at timestamptz not null default now()
);
alter table public.moderation add column if not exists mod_edits jsonb;
create table if not exists public.mod_log (
  id bigint generated always as identity primary key,
  actor uuid references auth.users(id) on delete set null,
  target uuid,
  target_name text,
  action text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);
create index if not exists mod_log_created on public.mod_log (created_at desc);

-- only the functions below can touch these tables
alter table public.friendships enable row level security;
alter table public.blocks enable row level security;
alter table public.moderation enable row level security;
alter table public.mod_log enable row level security;
revoke all on public.friendships, public.blocks, public.moderation, public.mod_log from anon, authenticated;

-- 5) helpers
create or replace function public.treesh_role(uid uuid)
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select m.role from public.moderation m where m.user_id = uid), 'user');
$$;
create or replace function public.treesh_is_staff(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.treesh_role(uid) in ('moderator', 'admin');
$$;
revoke all on function public.treesh_role(uuid) from public, anon;
revoke all on function public.treesh_is_staff(uuid) from public, anon;
grant execute on function public.treesh_role(uuid) to authenticated;
grant execute on function public.treesh_is_staff(uuid) to authenticated;

create or replace function public.treesh_relation(me uuid, other uuid)
returns text language sql stable security definer set search_path = public as $$
  select case
    when me is null then 'guest'
    when me = other then 'self'
    when exists (select 1 from public.blocks b where b.blocker = me and b.blocked = other) then 'blocked'
    when exists (select 1 from public.blocks b where b.blocker = other and b.blocked = me) then 'blocked_me'
    when exists (select 1 from public.friendships f where f.status = 'accepted'
                 and ((f.requester = me and f.addressee = other) or (f.requester = other and f.addressee = me))) then 'friends'
    when exists (select 1 from public.friendships f where f.status = 'pending' and f.requester = me and f.addressee = other) then 'outgoing'
    when exists (select 1 from public.friendships f where f.status = 'pending' and f.requester = other and f.addressee = me) then 'incoming'
    else 'none' end;
$$;
revoke all on function public.treesh_relation(uuid, uuid) from public, anon, authenticated;

-- what everyone else sees (a muted user's changes stay private until the mute ends)
drop view if exists public.treesh_pub;
create view public.treesh_pub as
select p.id, p.created_at, p.is_private, p.privacy,
  coalesce(m.role, 'user') as role,
  coalesce(m.verified, false) as verified,
  m.verified_icon,
  coalesce(m.banned_until > now(), false) as suspended,
  coalesce(m.muted_until > now(), false) as muted,
  case when z.fz then coalesce(m.frozen->>'username', p.username) else p.username end as username,
  case when z.fz then m.frozen->>'display_name' else p.display_name end as display_name,
  case when z.fz then m.frozen->>'avatar_url' else p.avatar_url end as avatar_url,
  case when z.fz then m.frozen->>'bio' else p.bio end as bio,
  case when z.fz then m.frozen->>'banner_url' else p.banner_url end as banner_url,
  case when z.fz then m.frozen->'public_data' else p.public_data end as public_data
from public.profiles p
left join public.moderation m on m.user_id = p.id
cross join lateral (select coalesce(m.muted_until > now() and m.frozen is not null, false) as fz) z;
revoke all on public.treesh_pub from anon, authenticated;

-- usernames held by a muted account stay taken
create or replace function public.username_available(name text)
returns boolean language sql security definer set search_path = public stable as $$
  select not exists (select 1 from public.profiles where username = lower(trim(name)) and id is distinct from auth.uid())
     and not exists (select 1 from public.moderation m where m.muted_until > now() and m.frozen->>'username' = lower(trim(name)) and m.user_id is distinct from auth.uid());
$$;
revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;

-- 6) search people by @username or name
drop function if exists public.search_users(text);
create function public.search_users(q text)
returns table (id uuid, username text, display_name text, avatar_url text, is_private boolean, relation text, role text, verified boolean, suspended boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare
  me uuid := auth.uid();
  s text := left(lower(trim(both '@' from trim(coalesce(q, '')))), 40);
  pat text;
begin
  if length(s) < 1 then return; end if;
  pat := replace(replace(replace(s, '\', '\\'), '%', '\%'), '_', '\_');
  return query
    select p.id, p.username, p.display_name, p.avatar_url, coalesce(p.is_private, false), public.treesh_relation(me, p.id), p.role, p.verified, p.suspended
    from public.treesh_pub p
    where p.username is not null
      and (me is null or p.id <> me)
      and (p.username like pat || '%' or lower(coalesce(p.display_name, '')) like '%' || pat || '%')
      and not exists (select 1 from public.blocks b where b.blocker = p.id and b.blocked = me)
    order by (p.username = s) desc, p.verified desc, (p.username like pat || '%') desc, p.username
    limit 25;
end; $$;
revoke all on function public.search_users(text) from public;
grant execute on function public.search_users(text) to anon, authenticated;

-- 7) someone's page, filtered by their privacy choices (staff see everything)
create or replace function public.get_user_profile(uname text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  staff boolean := public.treesh_is_staff(auth.uid());
  p record;
  m public.moderation%rowtype;
  live public.profiles%rowtype;
  rel text; see_all boolean; src jsonb; d jsonb; fl jsonb := null;
  locked text[] := '{}';
  k text; vis text; keys text[]; i int; fr int;
begin
  select * into p from public.treesh_pub t where t.username = lower(trim(both '@' from trim(coalesce(uname, ''))));
  if not found then return null; end if;
  rel := public.treesh_relation(me, p.id);
  if rel = 'blocked_me' and not staff then return null; end if;
  select count(*) into fr from public.friendships f where f.status = 'accepted' and (f.requester = p.id or f.addressee = p.id);
  see_all := staff or (rel <> 'blocked' and (rel in ('self', 'friends') or not coalesce(p.is_private, false)));
  src := coalesce(p.public_data, '{}'::jsonb);
  if see_all then
    d := jsonb_build_object('nickname', src->'nickname', 'joined', src->'joined', 'accent', src->'accent', 'theme', src->'theme', 'custom', src->'custom', 'space', src->'space', 'talents', src->'talents', 'favs', src->'favs');
    foreach k in array array['zodiac', 'badges', 'favorites', 'lyrics', 'disliked', 'playlists', 'listening', 'arcade'] loop
      vis := coalesce(p.privacy->>k, 'everyone');
      keys := case k when 'badges' then array['badges', 'stats', 'top'] when 'zodiac' then array['zodiac', 'bday'] else array[k] end;
      if staff or rel = 'self' or vis = 'everyone' or (vis = 'friends' and rel = 'friends') then
        for i in 1..array_length(keys, 1) loop
          if src ? keys[i] then d := d || jsonb_build_object(keys[i], src->keys[i]); end if;
        end loop;
      elsif vis = 'friends' then
        locked := locked || k;
      end if;
    end loop;
    d := jsonb_strip_nulls(d);
    vis := coalesce(p.privacy->>'friendlist', 'everyone');
    if staff or rel = 'self' or vis = 'everyone' or (vis = 'friends' and rel = 'friends') then
      select coalesce(jsonb_agg(jsonb_build_object('id', q.id, 'username', q.username, 'display_name', q.display_name, 'avatar_url', q.avatar_url, 'role', q.role, 'verified', q.verified) order by q.username), '[]'::jsonb)
        into fl
        from public.friendships f
        join public.treesh_pub q on q.id = case when f.requester = p.id then f.addressee else f.requester end
        where f.status = 'accepted' and (f.requester = p.id or f.addressee = p.id) and q.username is not null;
    elsif vis = 'friends' then
      locked := locked || 'friendlist'::text;
    end if;
  else
    d := jsonb_strip_nulls(jsonb_build_object('nickname', src->'nickname', 'talents', src->'talents', 'favs', src->'favs'));
  end if;
  if staff then
    select * into m from public.moderation where user_id = p.id;
    select * into live from public.profiles where id = p.id;
  end if;
  return jsonb_build_object(
    'id', p.id, 'username', p.username, 'display_name', p.display_name, 'avatar_url', p.avatar_url,
    'bio', case when see_all then p.bio end, 'banner_url', case when see_all then p.banner_url end,
    'created_at', p.created_at, 'is_private', coalesce(p.is_private, false), 'relation', rel, 'friends', fr,
    'role', p.role, 'verified', p.verified, 'verified_icon', case when p.verified then p.verified_icon end, 'suspended', p.suspended,
    'locked_all', not see_all and rel <> 'blocked', 'locked', to_jsonb(locked), 'data', d, 'friend_list', fl,
    'mod', case when staff then jsonb_build_object(
      'viewer_role', public.treesh_role(me),
      'banned_until', case when m.banned_until > now() then m.banned_until end, 'ban_reason', m.ban_reason,
      'muted_until', case when m.muted_until > now() then m.muted_until end, 'mute_reason', m.mute_reason,
      'live', jsonb_build_object('username', live.username, 'display_name', live.display_name, 'bio', live.bio, 'avatar_url', live.avatar_url, 'banner_url', live.banner_url)) end);
end; $$;
revoke all on function public.get_user_profile(text) from public;
grant execute on function public.get_user_profile(text) to anon, authenticated;

-- 8) friend requests
create or replace function public.send_friend_request(target uuid)
returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); rel text;
begin
  if me is null then raise exception 'not signed in'; end if;
  if target is null or target = me or not exists (select 1 from public.profiles where id = target) then raise exception 'That person isn''t on Treesh'; end if;
  rel := public.treesh_relation(me, target);
  if rel in ('blocked', 'blocked_me') then raise exception 'You can''t add this person'; end if;
  if rel = 'friends' or rel = 'outgoing' then return rel; end if;
  if rel = 'incoming' then
    update public.friendships set status = 'accepted' where requester = target and addressee = me;
    return 'friends';
  end if;
  if (select count(*) from public.friendships where requester = me and status = 'pending' and created_at > now() - interval '1 day') >= 100 then
    raise exception 'Too many friend requests today. Try again tomorrow';
  end if;
  insert into public.friendships (requester, addressee) values (me, target) on conflict do nothing;
  return 'outgoing';
end; $$;

create or replace function public.respond_friend_request(other uuid, accept boolean)
returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in'; end if;
  if accept then
    update public.friendships set status = 'accepted' where requester = other and addressee = me and status = 'pending';
  else
    delete from public.friendships where requester = other and addressee = me and status = 'pending';
  end if;
  return public.treesh_relation(me, other);
end; $$;

create or replace function public.remove_friend(other uuid)
returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in'; end if;
  delete from public.friendships where (requester = me and addressee = other) or (requester = other and addressee = me);
  return public.treesh_relation(me, other);
end; $$;

-- 9) blocking (also ends any friendship or request)
create or replace function public.block_user(target uuid)
returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in'; end if;
  if target is null or target = me then raise exception 'You can''t block yourself'; end if;
  insert into public.blocks (blocker, blocked) values (me, target) on conflict do nothing;
  delete from public.friendships where (requester = me and addressee = target) or (requester = target and addressee = me);
  return 'blocked';
end; $$;

create or replace function public.unblock_user(target uuid)
returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in'; end if;
  delete from public.blocks where blocker = me and blocked = target;
  return public.treesh_relation(me, target);
end; $$;

-- 10) my friends, requests and blocked list
drop function if exists public.my_friends();
create function public.my_friends()
returns table (id uuid, username text, display_name text, avatar_url text, relation text, role text, verified boolean)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in'; end if;
  return query
    select x.id, x.username, x.display_name, x.avatar_url, x.relation, x.role, x.verified from (
      select p.id, p.username, p.display_name, p.avatar_url,
             case when f.status = 'accepted' then 'friends' when f.requester = me then 'outgoing' else 'incoming' end as relation,
             p.role, p.verified
      from public.friendships f
      join public.treesh_pub p on p.id = case when f.requester = me then f.addressee else f.requester end
      where f.requester = me or f.addressee = me
      union all
      select p.id, p.username, p.display_name, p.avatar_url, 'blocked' as relation, p.role, p.verified
      from public.blocks b join public.treesh_pub p on p.id = b.blocked
      where b.blocker = me
    ) x
    order by x.relation, x.username;
end; $$;

-- 11) my own account status (role, badges, ban, mute, staff edits)
create or replace function public.my_status()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); m public.moderation%rowtype; p public.profiles%rowtype;
begin
  if me is null then return null; end if;
  select * into m from public.moderation where user_id = me;
  select * into p from public.profiles where id = me;
  return jsonb_build_object(
    'role', coalesce(m.role, 'user'), 'verified', coalesce(m.verified, false), 'verified_icon', case when m.verified then m.verified_icon end,
    'banned_until', case when m.banned_until > now() then m.banned_until end, 'ban_reason', case when m.banned_until > now() then m.ban_reason end,
    'muted_until', case when m.muted_until > now() then m.muted_until end, 'mute_reason', case when m.muted_until > now() then m.mute_reason end,
    'mod_rev', coalesce(m.mod_rev, 0), 'mod_edits', m.mod_edits,
    'profile', jsonb_build_object('username', p.username, 'display_name', p.display_name, 'bio', p.bio, 'avatar_url', p.avatar_url, 'banner_url', p.banner_url));
end; $$;

-- the app calls this after it has applied a staff edit on the user's device
create or replace function public.ack_mod_edits(rev int)
returns void language sql security definer set search_path = public as $$
  update public.moderation set mod_edits = null where user_id = auth.uid() and mod_rev = rev;
$$;

-- 12) staff tools. Admins: everything. Moderators: no bans, no deletes, no verification, no roles, nothing against admins.
create or replace function public.treesh_guard(target uuid, need_admin boolean, allow_self boolean)
returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); ar text; tr text;
begin
  if me is null then raise exception 'not signed in'; end if;
  ar := public.treesh_role(me);
  if ar = 'user' then raise exception 'Only Treesh staff can do that'; end if;
  if need_admin and ar <> 'admin' then raise exception 'Only admins can do that'; end if;
  if target is null or not exists (select 1 from auth.users where id = target) then raise exception 'That account doesn''t exist'; end if;
  if target = me and not allow_self then raise exception 'You can''t do that to your own account'; end if;
  tr := public.treesh_role(target);
  if ar = 'moderator' and tr = 'admin' then raise exception 'Moderators can''t moderate admins'; end if;
  insert into public.moderation (user_id) values (target) on conflict do nothing;
  return ar;
end; $$;
create or replace function public.treesh_log(target uuid, action text, detail jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.mod_log (actor, target, target_name, action, detail)
  values (auth.uid(), target, (select username from public.profiles where id = target), action, detail);
$$;
revoke all on function public.treesh_guard(uuid, boolean, boolean) from public, anon, authenticated;
revoke all on function public.treesh_log(uuid, text, jsonb) from public, anon, authenticated;

create or replace function public.staff_set_ban(target uuid, until timestamptz, reason text)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
begin
  perform public.treesh_guard(target, true, false);
  if until is not null and until <= now() then raise exception 'Pick a time in the future'; end if;
  update public.moderation set banned_until = until, ban_reason = case when until is null then null else left(nullif(trim(reason), ''), 300) end, updated_at = now() where user_id = target;
  update auth.users set banned_until = until where id = target;
  if until is not null then delete from auth.sessions where user_id = target; end if;
  perform public.treesh_log(target, case when until is null then 'unban' else 'ban' end, jsonb_build_object('until', until, 'reason', reason));
  return jsonb_build_object('banned_until', until);
end; $$;

create or replace function public.staff_set_mute(target uuid, until timestamptz, reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare cur public.moderation%rowtype; p public.profiles%rowtype;
begin
  perform public.treesh_guard(target, false, false);
  if until is not null and until <= now() then raise exception 'Pick a time in the future'; end if;
  select * into cur from public.moderation where user_id = target;
  select * into p from public.profiles where id = target;
  if until is null then
    update public.moderation set muted_until = null, mute_reason = null, frozen = null, updated_at = now() where user_id = target;
  else
    update public.moderation set muted_until = until, mute_reason = left(nullif(trim(reason), ''), 300),
      frozen = case when cur.muted_until > now() and cur.frozen is not null then cur.frozen
               else jsonb_build_object('username', p.username, 'display_name', p.display_name, 'avatar_url', p.avatar_url, 'bio', p.bio, 'banner_url', p.banner_url, 'public_data', p.public_data) end,
      updated_at = now()
    where user_id = target;
  end if;
  perform public.treesh_log(target, case when until is null then 'unmute' else 'mute' end, jsonb_build_object('until', until, 'reason', reason));
  return jsonb_build_object('muted_until', until);
end; $$;

-- changes: {"display_name": "...", "username": "...", "bio": "...", "remove_avatar": true, "remove_banner": true}
create or replace function public.staff_edit_profile(target uuid, changes jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v text; fz boolean;
begin
  perform public.treesh_guard(target, false, false);
  select coalesce(muted_until > now() and frozen is not null, false) into fz from public.moderation where user_id = target;
  if changes ? 'display_name' then
    v := left(trim(coalesce(changes->>'display_name', '')), 40);
    if length(v) < 1 then raise exception 'Enter a name'; end if;
    update public.profiles set display_name = v, public_data = jsonb_set(coalesce(public_data, '{}'::jsonb), '{nickname}', to_jsonb(v)) where id = target;
    if fz then update public.moderation set frozen = jsonb_set(jsonb_set(frozen, '{display_name}', to_jsonb(v)), '{public_data}', jsonb_set(coalesce(frozen->'public_data', '{}'::jsonb), '{nickname}', to_jsonb(v))) where user_id = target; end if;
  end if;
  if changes ? 'username' then
    v := lower(trim(both '@' from trim(coalesce(changes->>'username', ''))));
    if v !~ '^[a-z0-9_.]{3,20}$' then raise exception 'Usernames need 3-20 letters, numbers, _ or .'; end if;
    if exists (select 1 from public.profiles where username = v and id <> target)
       or exists (select 1 from public.moderation where muted_until > now() and frozen->>'username' = v and user_id <> target) then
      raise exception 'That username is taken';
    end if;
    update public.profiles set username = v where id = target;
    if fz then update public.moderation set frozen = jsonb_set(frozen, '{username}', to_jsonb(v)) where user_id = target; end if;
  end if;
  if changes ? 'bio' then
    v := nullif(left(trim(coalesce(changes->>'bio', '')), 160), '');
    update public.profiles set bio = v where id = target;
    if fz then update public.moderation set frozen = jsonb_set(frozen, '{bio}', coalesce(to_jsonb(v), 'null'::jsonb)) where user_id = target; end if;
  end if;
  if coalesce((changes->>'remove_avatar')::boolean, false) then
    update public.profiles set avatar_url = null where id = target;
    if fz then update public.moderation set frozen = jsonb_set(frozen, '{avatar_url}', 'null'::jsonb) where user_id = target; end if;
  end if;
  if coalesce((changes->>'remove_banner')::boolean, false) then
    update public.profiles set banner_url = null where id = target;
    if fz then update public.moderation set frozen = jsonb_set(frozen, '{banner_url}', 'null'::jsonb) where user_id = target; end if;
  end if;
  update public.moderation set mod_rev = mod_rev + 1, mod_edits = coalesce(mod_edits, '{}'::jsonb) || changes, updated_at = now() where user_id = target;
  perform public.treesh_log(target, 'edit', changes);
  return jsonb_build_object('ok', true);
end; $$;

create or replace function public.staff_set_verified(target uuid, on_off boolean, icon text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform public.treesh_guard(target, true, true);
  update public.moderation set verified = on_off, verified_icon = case when on_off then nullif(trim(coalesce(icon, '')), '') end, updated_at = now() where user_id = target;
  perform public.treesh_log(target, case when on_off then 'verify' else 'unverify' end, jsonb_build_object('icon', icon));
  return jsonb_build_object('verified', on_off);
end; $$;

-- admins can make anyone (except themselves) a member, moderator or admin
create or replace function public.staff_set_role(target uuid, new_role text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare cur text;
begin
  perform public.treesh_guard(target, true, false);
  if new_role not in ('user', 'moderator', 'admin') then raise exception 'Pick member, moderator or admin'; end if;
  cur := public.treesh_role(target);
  if cur = new_role then return jsonb_build_object('role', cur); end if;
  update public.moderation set role = new_role, updated_at = now() where user_id = target;
  perform public.treesh_log(target, case when new_role = 'admin' then 'make_admin' when new_role = 'moderator' then 'make_mod' when cur = 'admin' then 'remove_admin' else 'remove_mod' end, jsonb_build_object('from', cur));
  return jsonb_build_object('role', new_role);
end; $$;

create or replace function public.staff_delete_user(target uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  perform public.treesh_guard(target, true, false);
  if public.treesh_role(target) = 'admin' then raise exception 'Admins can only be removed in the Supabase SQL editor'; end if;
  perform public.treesh_log(target, 'delete', null);
  delete from public.user_data where user_id = target;
  delete from public.profiles where id = target;
  delete from auth.users where id = target;
end; $$;

-- staff lists: 'suspended' | 'muted' | 'staff' | 'verified'
create or replace function public.staff_list(kind text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.treesh_is_staff(auth.uid()) then raise exception 'Only Treesh staff can do that'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'username', p.username, 'display_name', p.display_name, 'avatar_url', p.avatar_url,
      'role', m.role, 'verified', m.verified, 'verified_icon', m.verified_icon, 'banned_until', m.banned_until, 'ban_reason', m.ban_reason,
      'muted_until', m.muted_until, 'mute_reason', m.mute_reason) order by m.updated_at desc), '[]'::jsonb)
    into r
    from public.moderation m join public.profiles p on p.id = m.user_id
    where case kind
      when 'suspended' then m.banned_until > now()
      when 'muted' then m.muted_until > now()
      when 'staff' then m.role in ('moderator', 'admin')
      when 'verified' then m.verified
      else false end;
  return r;
end; $$;

create or replace function public.staff_log(lim int)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.treesh_is_staff(auth.uid()) then raise exception 'Only Treesh staff can do that'; end if;
  select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb) into r from (
    select l.id, l.action, l.detail, l.created_at, l.target_name,
           (select username from public.profiles where id = l.target) as target_username,
           (select username from public.profiles where id = l.actor) as actor_username
    from public.mod_log l order by l.created_at desc limit least(greatest(coalesce(lim, 50), 1), 200)) x;
  return r;
end; $$;

-- 13) staff can clean up photos (avatars bucket), admins can clean up a deleted account's files
drop policy if exists "avatar_staff_select" on storage.objects;
create policy "avatar_staff_select" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and public.treesh_is_staff(auth.uid()));
drop policy if exists "avatar_staff_delete" on storage.objects;
create policy "avatar_staff_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and public.treesh_is_staff(auth.uid()));
drop policy if exists "tdata_admin_select" on storage.objects;
create policy "tdata_admin_select" on storage.objects for select to authenticated
  using (bucket_id = 'treesh-data' and public.treesh_role(auth.uid()) = 'admin');
drop policy if exists "tdata_admin_delete" on storage.objects;
create policy "tdata_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'treesh-data' and public.treesh_role(auth.uid()) = 'admin');

-- 14) permissions
revoke all on function public.send_friend_request(uuid) from public, anon;
revoke all on function public.respond_friend_request(uuid, boolean) from public, anon;
revoke all on function public.remove_friend(uuid) from public, anon;
revoke all on function public.block_user(uuid) from public, anon;
revoke all on function public.unblock_user(uuid) from public, anon;
revoke all on function public.my_friends() from public, anon;
revoke all on function public.my_status() from public, anon;
revoke all on function public.ack_mod_edits(int) from public, anon;
revoke all on function public.staff_set_ban(uuid, timestamptz, text) from public, anon;
revoke all on function public.staff_set_mute(uuid, timestamptz, text) from public, anon;
revoke all on function public.staff_edit_profile(uuid, jsonb) from public, anon;
revoke all on function public.staff_set_verified(uuid, boolean, text) from public, anon;
revoke all on function public.staff_set_role(uuid, text) from public, anon;
revoke all on function public.staff_delete_user(uuid) from public, anon;
revoke all on function public.staff_list(text) from public, anon;
revoke all on function public.staff_log(int) from public, anon;
grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;
grant execute on function public.remove_friend(uuid) to authenticated;
grant execute on function public.block_user(uuid) to authenticated;
grant execute on function public.unblock_user(uuid) to authenticated;
grant execute on function public.my_friends() to authenticated;
grant execute on function public.my_status() to authenticated;
grant execute on function public.ack_mod_edits(int) to authenticated;
grant execute on function public.staff_set_ban(uuid, timestamptz, text) to authenticated;
grant execute on function public.staff_set_mute(uuid, timestamptz, text) to authenticated;
grant execute on function public.staff_edit_profile(uuid, jsonb) to authenticated;
grant execute on function public.staff_set_verified(uuid, boolean, text) to authenticated;
grant execute on function public.staff_set_role(uuid, text) to authenticated;
grant execute on function public.staff_delete_user(uuid) to authenticated;
grant execute on function public.staff_list(text) to authenticated;
grant execute on function public.staff_log(int) to authenticated;

-- PART 3: notifications (friend activity + staff actions, live)
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
