-- Migration: 20260923150000_admin_seed_hint.sql
-- This migration does NOT insert admin users (that would be a security risk).
-- It creates a helper view and function to make seeding the first admin easier.
-- After running migrations, run this SQL to make yourself a super_admin:
--
--   SELECT insert_first_admin('<your-auth-user-uuid>', 'super_admin');
--
-- You can find your user UUID in Supabase Dashboard → Authentication → Users

create or replace function public.insert_first_admin(target_user_id uuid, admin_role text default 'super_admin')
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only allow inserting if there are NO admins yet (bootstrap safety)
  if exists (select 1 from public.admin_members limit 1) then
    return 'SKIPPED: An admin already exists. Use Supabase SQL editor to add more admins manually.';
  end if;

  if admin_role not in ('admin', 'super_admin') then
    raise exception 'Invalid role. Must be admin or super_admin.';
  end if;

  insert into public.admin_members (user_id, role)
  values (target_user_id, admin_role)
  on conflict (user_id) do nothing;

  return format('SUCCESS: %s added as %s', target_user_id, admin_role);
end;
$$;

-- Restrict: only super_admins (or service role) can call this function after bootstrap
revoke all on function public.insert_first_admin(uuid, text) from public;
grant execute on function public.insert_first_admin(uuid, text) to service_role;

comment on function public.insert_first_admin is
  'Bootstrap helper to add the first admin. Only works when admin_members table is empty. Call with service_role or via Supabase SQL editor.';
