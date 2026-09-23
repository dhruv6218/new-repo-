-- Migration: 20260923160000_cron_and_admin_setup.sql
-- Automatically seeds the super admin user and configures pg_cron daily chase job.

create extension if not exists pgcrypto with schema extensions;

-- 1. Create and seed super admin user in auth.users and admin_members
do $$
declare
  target_user_id uuid;
  target_email text := 'help.astrix@gmail.com';
  target_password text := 'baadshah6218@';
  hashed_password text;
begin
  select id into target_user_id from auth.users where email = target_email;
  
  if target_user_id is null then
    target_user_id := gen_random_uuid();
    hashed_password := extensions.crypt(target_password, extensions.gen_salt('bf'));
    
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      target_user_id,
      'authenticated',
      'authenticated',
      target_email,
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
      format('{"sub":"%s","email":"%s"}', target_user_id, target_email)::jsonb,
      'email',
      target_user_id::text,
      now(),
      now(),
      now()
    );
  end if;

  -- Ensure user has profile
  insert into public.profiles (id, display_name, timezone)
  values (target_user_id, 'Astrix Admin', 'UTC')
  on conflict (id) do nothing;

  -- Grant super_admin role in admin_members
  insert into public.admin_members (user_id, role)
  values (target_user_id, 'super_admin')
  on conflict (user_id) do update set role = 'super_admin';

end;
$$;

-- 2. Setup pg_cron schedule for daily chase edge function
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      perform cron.unschedule('daily-chase-job');
    exception when others then null;
    end;
    
    perform cron.schedule(
      'daily-chase-job',
      '0 9 * * *',
      'select net.http_post(url := ''https://yamqqvofbpesownknzni.supabase.co/functions/v1/daily-chase'', headers := ''{"Content-Type":"application/json","Authorization":"Bearer astrix_cron_secret_998822114455"}''::jsonb, body := ''{}''::jsonb);'
    );
  end if;
exception when others then null;
end;
$$;
