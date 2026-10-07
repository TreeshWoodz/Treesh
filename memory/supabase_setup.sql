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
