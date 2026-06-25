-- ============================================================================
-- Auth → profile bridge + role helper functions (used by RLS).
-- Helpers are SECURITY DEFINER so policies can read the caller's role without
-- triggering recursive RLS on public.profiles.
-- ============================================================================

-- Create a profile automatically whenever an auth user is created. The admin
-- "create user" server action calls auth.admin.createUser({ user_metadata }),
-- and this trigger materializes the matching profile row.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name, role, phone, department_id, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'viewer'),
    new.raw_user_meta_data->>'phone',
    nullif(new.raw_user_meta_data->>'department_id', '')::uuid,
    coalesce((new.raw_user_meta_data->>'is_active')::boolean, true)
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── role helpers ─────────────────────────
create or replace function public.current_role_name()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_active);
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active and role in ('super_admin','admin')
  );
$$;

create or replace function public.is_security()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active and role = 'security_staff'
  );
$$;

create or replace function public.is_officer()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active and role = 'officer'
  );
$$;
