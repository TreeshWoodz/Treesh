-- Treesh: stronger moderation (edit or delete birthdays, delete anything on a profile, hide sections) + the All users page. Paste into Supabase -> SQL Editor -> Run. Safe to run again.
-- changes: {"display_name","username","bio","remove_avatar","remove_banner",
--   "birthday" (device), "pd_set" {k:v}, "pd_remove" [keys], "pl_remove" [playlist ids], "ly_remove" [song ids], "hide" [sections],
--   "remove_talents","remove_favs","remove_custom","remove_space","reset_accent" (device)}
create or replace function public.staff_edit_profile(target uuid, changes jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v text; fz boolean; pd jsonb; k text; old jsonb; ce jsonb;
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
  -- the public page: set or delete keys, drop single playlists / saved lyrics, hide sections
  select coalesce(public_data, '{}'::jsonb) into pd from public.profiles where id = target;
  if jsonb_typeof(changes->'pd_set') = 'object' then pd := pd || (changes->'pd_set'); end if;
  if jsonb_typeof(changes->'pd_remove') = 'array' then pd := pd - array(select jsonb_array_elements_text(changes->'pd_remove')); end if;
  if jsonb_typeof(changes->'pl_remove') = 'array' and jsonb_typeof(pd->'playlists') = 'array' then
    pd := jsonb_set(pd, '{playlists}', coalesce((select jsonb_agg(x) from jsonb_array_elements(pd->'playlists') x where not (changes->'pl_remove') ? (x->>'id')), '[]'::jsonb));
  end if;
  if jsonb_typeof(changes->'ly_remove') = 'array' and jsonb_typeof(pd->'lyrics') = 'array' then
    pd := jsonb_set(pd, '{lyrics}', coalesce((select jsonb_agg(x) from jsonb_array_elements(pd->'lyrics') x where not (changes->'ly_remove') ? (x->>'id')), '[]'::jsonb));
  end if;
  if changes ?| array['pd_set', 'pd_remove', 'pl_remove', 'ly_remove'] then
    update public.profiles set public_data = pd where id = target;
    if fz then update public.moderation set frozen = jsonb_set(frozen, '{public_data}', pd) where user_id = target; end if;
  end if;
  if jsonb_typeof(changes->'hide') = 'array' then
    for k in select jsonb_array_elements_text(changes->'hide') loop
      update public.profiles set privacy = jsonb_set(coalesce(privacy, '{}'::jsonb), array[k], '"me"'::jsonb) where id = target;
    end loop;
  end if;
  -- list edits add up until their device applies them (two deleted playlists stay two)
  select coalesce(mod_edits, '{}'::jsonb) into old from public.moderation where user_id = target;
  ce := changes - 'pd_set';
  foreach k in array array['pl_remove', 'ly_remove', 'hide', 'pd_remove'] loop
    if jsonb_typeof(ce->k) = 'array' and jsonb_typeof(old->k) = 'array' then
      ce := jsonb_set(ce, array[k], (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select jsonb_array_elements(old->k) x union select jsonb_array_elements(ce->k)) t));
    end if;
  end loop;
  update public.moderation set mod_rev = mod_rev + 1, mod_edits = old || ce, updated_at = now() where user_id = target;
  perform public.treesh_log(target, 'edit', changes - 'pd_set');
  return jsonb_build_object('ok', true);
end; $$;

-- every account for the All users page: filt 'all'|'active'|'inactive'|'new'|'setup'|'banned'|'muted'|'verified'|'staff',
-- sort_by 'new'|'old'|'seen'|'az'. last_seen = last sign-in or last settings sync. Emails only go to admins.
create or replace function public.staff_users(filt text, sort_by text, q text, lim int, skip int)
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare ar text := public.treesh_role(auth.uid()); adm boolean; qq text; r jsonb;
begin
  if auth.uid() is null or ar not in ('moderator', 'admin') then raise exception 'Only Treesh staff can do that'; end if;
  adm := ar = 'admin';
  qq := lower(trim(both '@' from trim(coalesce(q, ''))));
  lim := least(greatest(coalesce(lim, 50), 1), 200); skip := greatest(coalesce(skip, 0), 0);
  with base as (
    select u.id, u.email, u.created_at, (u.email_confirmed_at is not null) as confirmed,
      nullif(greatest(coalesce(u.last_sign_in_at, '-infinity'::timestamptz), coalesce(ud.updated_at, '-infinity'::timestamptz)), '-infinity'::timestamptz) as last_seen,
      p.username, p.display_name, p.avatar_url, coalesce(m.role, 'user') as role, coalesce(m.verified, false) as verified, m.verified_icon,
      case when m.banned_until > now() then m.banned_until end as banned_until, case when m.muted_until > now() then m.muted_until end as muted_until
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join public.user_data ud on ud.user_id = u.id
    left join public.moderation m on m.user_id = u.id
  ), b as (
    select * from base where qq = '' or position(qq in lower(coalesce(username, ''))) > 0 or position(qq in lower(coalesce(display_name, ''))) > 0
      or (adm and position(qq in lower(coalesce(email, ''))) > 0)
  ), f as (
    select * from b where case coalesce(filt, 'all')
      when 'active' then last_seen > now() - interval '30 days'
      when 'inactive' then last_seen is null or last_seen <= now() - interval '30 days'
      when 'new' then created_at > now() - interval '7 days'
      when 'setup' then username is null
      when 'banned' then banned_until is not null
      when 'muted' then muted_until is not null
      when 'verified' then verified
      when 'staff' then role in ('moderator', 'admin')
      else true end
  ), pg as (
    select f.*, row_number() over (order by
      case when sort_by = 'old' then created_at end asc,
      case when sort_by = 'seen' then last_seen end desc nulls last,
      case when sort_by = 'az' then lower(coalesce(display_name, username)) end asc nulls last,
      created_at desc, id) as rn
    from f
  )
  select jsonb_build_object(
    'total', (select count(*) from f),
    'counts', (select jsonb_build_object('all', count(*),
      'active', count(*) filter (where last_seen > now() - interval '30 days'),
      'inactive', count(*) filter (where last_seen is null or last_seen <= now() - interval '30 days'),
      'new', count(*) filter (where created_at > now() - interval '7 days'),
      'setup', count(*) filter (where username is null),
      'banned', count(*) filter (where banned_until is not null),
      'muted', count(*) filter (where muted_until is not null),
      'verified', count(*) filter (where verified),
      'staff', count(*) filter (where role in ('moderator', 'admin'))) from b),
    'rows', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'username', username, 'display_name', display_name, 'avatar_url', avatar_url,
        'email', case when adm then email end, 'confirmed', confirmed, 'created_at', created_at, 'last_seen', last_seen, 'role', role,
        'verified', verified, 'verified_icon', verified_icon, 'banned_until', banned_until, 'muted_until', muted_until) order by rn)
      from pg where rn > skip and rn <= skip + lim), '[]'::jsonb))
  into r;
  return r;
end; $$;
revoke all on function public.staff_users(text, text, text, int, int) from public, anon;
grant execute on function public.staff_users(text, text, text, int, int) to authenticated;
