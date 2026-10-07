-- Treesh update: admins can make other people admins, and birthdays show on public profiles.
-- Already ran supabase_social.sql? Run just this in Supabase -> SQL Editor.

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
    d := jsonb_build_object('nickname', src->'nickname', 'joined', src->'joined', 'accent', src->'accent', 'theme', src->'theme', 'custom', src->'custom', 'talents', src->'talents', 'favs', src->'favs');
    foreach k in array array['zodiac', 'badges', 'favorites', 'lyrics', 'disliked', 'playlists', 'listening'] loop
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

revoke all on function public.get_user_profile(text) from public;
grant execute on function public.get_user_profile(text) to anon, authenticated;
revoke all on function public.staff_set_role(uuid, text) from public, anon;
grant execute on function public.staff_set_role(uuid, text) to authenticated;
