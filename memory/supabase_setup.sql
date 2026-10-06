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
