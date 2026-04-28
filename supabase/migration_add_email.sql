-- ============================================================================
-- Migration: add email column to profiles
-- Paste into Supabase SQL editor and run.
-- Idempotent: safe to re-run.
-- ============================================================================

-- 1. Add the column (nullable for now so the backfill can run)
alter table public.profiles
  add column if not exists email text;

-- 2. Backfill existing rows from auth.users
update public.profiles p
   set email = u.email
  from auth.users u
 where p.id = u.id
   and p.email is null;

-- 3. Now make it required and unique
alter table public.profiles
  alter column email set not null;

create unique index if not exists profiles_email_unique
  on public.profiles (lower(email));

-- 4. Update handle_new_user so future signups populate email automatically
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, role, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'patient'),
    new.email
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;
