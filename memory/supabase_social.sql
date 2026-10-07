-- Treesh social: public/private profiles, friends, blocking, people search
-- Run once in Supabase Dashboard -> SQL Editor (after supabase_setup.sql). Safe to run again.

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

-- only the functions below can touch these tables
alter table public.friendships enable row level security;
alter table public.blocks enable row level security;
revoke all on public.friendships from anon, authenticated;
revoke all on public.blocks from anon, authenticated;

-- 4) how "me" relates to "other"
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

-- 5) search people by @username or name (name, @username and photo only)
create or replace function public.search_users(q text)
returns table (id uuid, username text, display_name text, avatar_url text, is_private boolean, relation text)
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
    select p.id, p.username, p.display_name, p.avatar_url, coalesce(p.is_private, false), public.treesh_relation(me, p.id)
    from public.profiles p
    where p.username is not null
      and (me is null or p.id <> me)
      and (p.username like pat || '%' or lower(coalesce(p.display_name, '')) like '%' || pat || '%')
      and not exists (select 1 from public.blocks b where b.blocker = p.id and b.blocked = me)
    order by (p.username = s) desc, (p.username like pat || '%') desc, p.username
    limit 25;
end; $$;
revoke all on function public.search_users(text) from public;
grant execute on function public.search_users(text) to anon, authenticated;

-- 6) someone's page, filtered by their privacy choices
create or replace function public.get_user_profile(uname text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  p public.profiles%rowtype;
  rel text;
  see_all boolean;
  src jsonb;
  d jsonb;
  locked text[] := '{}';
  k text; vis text; keys text[]; i int; fr int;
begin
  select * into p from public.profiles where username = lower(trim(both '@' from trim(coalesce(uname, ''))));
  if not found then return null; end if;
  rel := public.treesh_relation(me, p.id);
  if rel = 'blocked_me' then return null; end if;
  select count(*) into fr from public.friendships f where f.status = 'accepted' and (f.requester = p.id or f.addressee = p.id);
  see_all := rel <> 'blocked' and (rel in ('self', 'friends') or not coalesce(p.is_private, false));
  src := coalesce(p.public_data, '{}'::jsonb);
  if see_all then
    d := jsonb_build_object('nickname', src->'nickname', 'joined', src->'joined', 'accent', src->'accent', 'theme', src->'theme', 'custom', src->'custom');
    foreach k in array array['zodiac', 'badges', 'favorites', 'lyrics', 'disliked', 'playlists'] loop
      vis := coalesce(p.privacy->>k, 'everyone');
      keys := case k when 'badges' then array['badges', 'stats', 'top'] else array[k] end;
      if rel = 'self' or vis = 'everyone' or (vis = 'friends' and rel = 'friends') then
        for i in 1..array_length(keys, 1) loop
          if src ? keys[i] then d := d || jsonb_build_object(keys[i], src->keys[i]); end if;
        end loop;
      elsif vis = 'friends' then
        locked := locked || k;
      end if;
    end loop;
    d := jsonb_strip_nulls(d);
  else
    d := jsonb_strip_nulls(jsonb_build_object('nickname', src->'nickname'));
  end if;
  return jsonb_build_object(
    'id', p.id, 'username', p.username, 'display_name', p.display_name, 'avatar_url', p.avatar_url,
    'bio', case when see_all then p.bio end, 'banner_url', case when see_all then p.banner_url end,
    'created_at', p.created_at, 'is_private', coalesce(p.is_private, false), 'relation', rel, 'friends', fr,
    'locked_all', (not see_all and rel <> 'blocked'), 'locked', to_jsonb(locked), 'data', d);
end; $$;
revoke all on function public.get_user_profile(text) from public;
grant execute on function public.get_user_profile(text) to anon, authenticated;

-- 7) friend requests
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

-- 8) blocking (also ends any friendship or request)
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

-- 9) my friends, requests and blocked list
create or replace function public.my_friends()
returns table (id uuid, username text, display_name text, avatar_url text, relation text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in'; end if;
  return query
    select x.id, x.username, x.display_name, x.avatar_url, x.relation from (
      select p.id, p.username, p.display_name, p.avatar_url,
             case when f.status = 'accepted' then 'friends' when f.requester = me then 'outgoing' else 'incoming' end as relation
      from public.friendships f
      join public.profiles p on p.id = case when f.requester = me then f.addressee else f.requester end
      where f.requester = me or f.addressee = me
      union all
      select p.id, p.username, p.display_name, p.avatar_url, 'blocked' as relation
      from public.blocks b join public.profiles p on p.id = b.blocked
      where b.blocker = me
    ) x
    order by x.relation, x.username;
end; $$;

revoke all on function public.send_friend_request(uuid) from public, anon;
revoke all on function public.respond_friend_request(uuid, boolean) from public, anon;
revoke all on function public.remove_friend(uuid) from public, anon;
revoke all on function public.block_user(uuid) from public, anon;
revoke all on function public.unblock_user(uuid) from public, anon;
revoke all on function public.my_friends() from public, anon;
grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;
grant execute on function public.remove_friend(uuid) to authenticated;
grant execute on function public.block_user(uuid) to authenticated;
grant execute on function public.unblock_user(uuid) to authenticated;
grant execute on function public.my_friends() to authenticated;
