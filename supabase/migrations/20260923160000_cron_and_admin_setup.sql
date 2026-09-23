-- Migration: 20260923160000_cron_and_admin_setup.sql
-- Safe helper procedures for operator-managed admin bootstrapping and cron scheduling.
-- Does NOT contain source-controlled plain passwords or hardcoded secret tokens.

create extension if not exists pgcrypto with schema extensions;

-- Function: Public admin bootstrap procedure (parameterized, security definer)
create or replace function public.bootstrap_admin(admin_email text, admin_password text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  target_user_id uuid;
  hashed_password text;
begin
  if admin_email is null or admin_password is null or length(admin_password) < 8 then
    raise exception 'Invalid input: Email and password (min 8 chars) are required.';
  end if;

  select id into target_user_id from auth.users where email = admin_email;
  
  if target_user_id is null then
    target_user_id := gen_random_uuid();
    hashed_password := extensions.crypt(admin_password, extensions.gen_salt('bf'));
    
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      target_user_id,
      'authenticated',
      'authenticated',
      admin_email,
      hashed_password,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"Astrix Admin"}'::jsonb,
      now(),
      now(),
      '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(),
      target_user_id,
      format('{"sub":"%s","email":"%s"}', target_user_id, admin_email)::jsonb,
      'email',
      target_user_id::text,
      now(),
      now(),
      now()
    );
  end if;

  insert into public.profiles (id, display_name, timezone)
  values (target_user_id, 'Astrix Admin', 'UTC')
  on conflict (id) do nothing;

  insert into public.admin_members (user_id, role)
  values (target_user_id, 'super_admin')
  on conflict (user_id) do update set role = 'super_admin';

  return format('SUCCESS: Admin %s configured as super_admin', admin_email);
end;
$$;

revoke all on function public.bootstrap_admin(text, text) from public;
grant execute on function public.bootstrap_admin(text, text) to service_role;

-- Function: Parameterized pg_cron scheduler procedure
create or replace function public.schedule_daily_chase(cron_secret text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  project_url text := 'https://yamqqvofbpesownknzni.supabase.co/functions/v1/daily-chase';
begin
  if cron_secret is null or length(cron_secret) < 16 then
    raise exception 'Invalid cron_secret: Must be at least 16 characters.';
  end if;

  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      perform cron.unschedule('daily-chase-job');
    exception when others then null;
    end;
    
    perform cron.schedule(
      'daily-chase-job',
      '0 9 * * *',
      format(
        'select net.http_post(url := %L, headers := %L::jsonb, body := %L::jsonb);',
        project_url,
        jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || cron_secret
        )::text,
        '{}'
      )
    );
    return 'SUCCESS: daily-chase-job scheduled at 0 9 * * *';
  end if;
  return 'SKIPPED: pg_cron extension not installed in this environment';
end;
$$;

revoke all on function public.schedule_daily_chase(text) from public;
grant execute on function public.schedule_daily_chase(text) to service_role;
