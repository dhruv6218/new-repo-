-- Run in Supabase SQL editor after applying migrations.
select code, amount_minor, feature_limits
from public.plans
where code in ('hook', 'solo', 'agency')
order by code;

select to_regclass('public.notification_events') is not null as notification_events_present,
       to_regclass('public.consent_records') is not null as consent_records_present,
       to_regclass('public.audit_logs') is not null as audit_logs_present;

select has_function_privilege(
  'authenticated',
  'public.increment_usage(uuid,text,date,date,bigint)',
  'EXECUTE'
) as authenticated_can_increment;

select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('profiles', 'plans', 'usage_counters', 'consent_records',
                  'notification_events', 'audit_logs')
order by relname;
