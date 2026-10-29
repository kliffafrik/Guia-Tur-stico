create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

alter table public.profiles
  add column if not exists email text,
  add column if not exists created_at timestamptz not null default now();

create unique index if not exists profiles_username_ci_unique
  on public.profiles (lower(username));

create table if not exists private.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table private.site_admins enable row level security;
revoke all on private.site_admins from public, anon, authenticated;

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.site_admins
    where user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_site_admin() from public, anon;
grant execute on function public.is_site_admin() to authenticated;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    username,
    full_name,
    email,
    city,
    age,
    gender_identity
  ) values (
    new.id,
    lower(trim(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)))),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'city'), ''),
    nullif(new.raw_user_meta_data ->> 'age', '')::smallint,
    nullif(trim(new.raw_user_meta_data ->> 'gender_identity'), '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sync_profile_email();

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

drop policy if exists "Users can read own profile or admin can read all" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = (select auth.uid()) or (select public.is_site_admin()));

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  destination_slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, destination_slug)
);
alter table public.favorites enable row level security;
revoke all on public.favorites from anon, authenticated;
grant select, insert, delete on public.favorites to authenticated;

drop policy if exists "Users can read own favorites" on public.favorites;
drop policy if exists "Users can add own favorites" on public.favorites;
drop policy if exists "Users can remove own favorites" on public.favorites;

create policy "Users can read own favorites"
on public.favorites
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can add own favorites"
on public.favorites
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can remove own favorites"
on public.favorites
for delete
to authenticated
using (user_id = (select auth.uid()));
