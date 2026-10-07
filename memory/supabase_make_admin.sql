-- Make your Treesh account an admin. Run in Supabase -> SQL Editor AFTER supabase_social.sql.
-- 1) Replace you@example.com with the email you sign in to Treesh with, then Run.
insert into public.moderation (user_id, role)
select id, 'admin' from auth.users where email = 'you@example.com'
on conflict (user_id) do update set role = 'admin', updated_at = now();

-- 2) Check it worked (should show your @username and role = admin)
select p.username, m.role from public.moderation m join public.profiles p on p.id = m.user_id where m.role = 'admin';

-- To remove an admin later: update public.moderation set role = 'user' where user_id = (select id from auth.users where email = 'them@example.com');
