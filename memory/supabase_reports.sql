-- Treesh reports: anyone signed in can report someone; Treesh staff (admins + moderators) review them.
-- Run in Supabase -> SQL Editor AFTER supabase_social.sql. Safe to run again.

create table if not exists public.reports (
  id bigint generated always as identity primary key,
  reporter uuid references auth.users(id) on delete set null,
  target uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('harassment','hate','spam','profile','impersonation','threats','sexual','underage','other')),
  details text check (details is null or length(details) <= 500),
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  handled_by uuid references auth.users(id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists reports_status_created on public.reports (status, created_at desc);
create index if not exists reports_target on public.reports (target);
create index if not exists reports_reporter on public.reports (reporter, created_at desc);
alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;

-- send a report (the person you report never sees who sent it)
create or replace function public.report_user(who uuid, why text, note text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); d text := nullif(left(trim(coalesce(note, '')), 500), ''); rid bigint;
begin
  if me is null then raise exception 'Sign in to report someone'; end if;
  if who is null or who = me then raise exception 'You can''t report yourself'; end if;
  if not exists (select 1 from public.profiles p where p.id = who) then raise exception 'That person isn''t on Treesh'; end if;
  if why not in ('harassment','hate','spam','profile','impersonation','threats','sexual','underage','other') then raise exception 'Pick a reason'; end if;
  if why = 'other' and d is null then raise exception 'Tell us what happened'; end if;
  if (select count(*) from public.reports r where r.reporter = me and r.created_at > now() - interval '1 day') >= 20 then
    raise exception 'You''ve sent a lot of reports today. Try again tomorrow';
  end if;
  select r.id into rid from public.reports r where r.reporter = me and r.target = who and r.reason = why and r.status = 'open' limit 1;
  if rid is not null then
    update public.reports set details = coalesce(d, details), created_at = now() where id = rid;
  else
    insert into public.reports (reporter, target, reason, details) values (me, who, why, d);
  end if;
  return jsonb_build_object('ok', true);
end; $$;

-- staff: list reports. kind = 'open' | 'closed' | 'all'; who = only reports about this person (or null for everyone)
create or replace function public.staff_reports(kind text, who uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare res jsonb;
begin
  if not public.treesh_is_staff(auth.uid()) then raise exception 'Only Treesh staff can do that'; end if;
  select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb) into res from (
    select rp.id, rp.reason, rp.details, rp.status, rp.created_at, rp.handled_at,
      jsonb_build_object('id', t.id, 'username', t.username, 'display_name', t.display_name, 'avatar_url', t.avatar_url, 'role', t.role, 'verified', t.verified, 'suspended', t.suspended, 'muted', t.muted) as target,
      case when f.id is null then null else jsonb_build_object('id', f.id, 'username', f.username, 'display_name', f.display_name, 'avatar_url', f.avatar_url) end as reporter,
      (select h.username from public.profiles h where h.id = rp.handled_by) as handled_by,
      (select count(*) from public.reports o where o.target = rp.target and o.status = 'open') as open_on_target
    from public.reports rp
    left join public.treesh_pub t on t.id = rp.target
    left join public.treesh_pub f on f.id = rp.reporter
    where (who is null or rp.target = who)
      and (case when kind = 'closed' then rp.status <> 'open' when kind = 'all' then true else rp.status = 'open' end)
    order by rp.created_at desc
    limit 100) x;
  return res;
end; $$;

-- staff: how many reports are waiting
create or replace function public.staff_report_count()
returns int language plpgsql stable security definer set search_path = public as $$
begin
  if not public.treesh_is_staff(auth.uid()) then return 0; end if;
  return (select count(*)::int from public.reports where status = 'open');
end; $$;

-- staff: mark a report resolved or dismissed (all_for_target closes every open report about that person)
create or replace function public.staff_resolve_report(rid bigint, new_status text, all_for_target boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t uuid; n int;
begin
  if not public.treesh_is_staff(auth.uid()) then raise exception 'Only Treesh staff can do that'; end if;
  if new_status not in ('resolved', 'dismissed') then raise exception 'Pick resolved or dismissed'; end if;
  select r.target into t from public.reports r where r.id = rid;
  if t is null then raise exception 'That report is gone'; end if;
  update public.reports set status = new_status, handled_by = auth.uid(), handled_at = now()
    where status = 'open' and (id = rid or (coalesce(all_for_target, false) and target = t));
  get diagnostics n = row_count;
  perform public.treesh_log(t, 'report_' || new_status, jsonb_build_object('report', rid, 'count', n));
  return jsonb_build_object('status', new_status, 'count', n);
end; $$;

revoke all on function public.report_user(uuid, text, text) from public, anon;
revoke all on function public.staff_reports(text, uuid) from public, anon;
revoke all on function public.staff_report_count() from public, anon;
revoke all on function public.staff_resolve_report(bigint, text, boolean) from public, anon;
grant execute on function public.report_user(uuid, text, text) to authenticated;
grant execute on function public.staff_reports(text, uuid) to authenticated;
grant execute on function public.staff_report_count() to authenticated;
grant execute on function public.staff_resolve_report(bigint, text, boolean) to authenticated;
