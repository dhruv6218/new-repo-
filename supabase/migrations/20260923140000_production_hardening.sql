-- Additive production hardening. Never drops tables, columns, or rows.
create extension if not exists pgcrypto;

-- Reconcile installations that ran the legacy payment migration first.
alter table if exists public.invoices
  add column if not exists workspace_id uuid,
  add column if not exists subscription_id uuid,
  add column if not exists invoice_number text,
  add column if not exists ai_status text,
  add column if not exists currency text,
  add column if not exists subtotal_minor bigint,
  add column if not exists tax_minor bigint,
  add column if not exists total_minor bigint,
  add column if not exists due_at timestamptz,
  add column if not exists last_chased_at timestamptz,
  add column if not exists reminder_count integer,
  add column if not exists paused_at timestamptz,
  add column if not exists disputed_at timestamptz,
  add column if not exists provider_invoice_id text,
  add column if not exists updated_at timestamptz;

alter table if exists public.invoice_payment_links
  add column if not exists workspace_id uuid,
  add column if not exists token_hash text,
  add column if not exists expires_at timestamptz,
  add column if not exists used_at timestamptz,
  add column if not exists updated_at timestamptz;

alter table if exists public.gateway_webhook_events
  add column if not exists workspace_id uuid,
  add column if not exists provider_event_id text,
  add column if not exists signature_valid boolean,
  add column if not exists processed_at timestamptz,
  add column if not exists processing_error text;

do $$
begin
  if to_regclass('public.gateway_webhook_events') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'gateway_webhook_events'
         and column_name = 'event_id'
     ) then
    update public.gateway_webhook_events
    set provider_event_id = event_id
    where provider_event_id is null;
  end if;
end
$$;

create unique index if not exists gateway_webhook_events_provider_event_id_idx
  on public.gateway_webhook_events (provider, provider_event_id)
  where provider_event_id is not null;

-- Durable notification state is separate from profile preferences.
create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null check (length(trim(notification_type)) between 1 and 120),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notification_events_user_created_idx
  on public.notification_events (user_id, created_at desc);

alter table if exists public.profiles
  add column if not exists notification_preferences jsonb not null
  default '{"payment_received":true,"reminder_sent":true,"invoice_dispute":true,"weekly_summary":false}'::jsonb;

alter table if exists public.consent_records
  add column if not exists ip_address inet,
  add column if not exists user_agent text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Keep the catalog deterministic across environments without overwriting prices
-- or provider-specific fields already configured by an operator.
insert into public.plans (code, name, description, amount_minor, currency, interval, feature_limits)
values
  ('hook', 'Hook', 'First three successful invoice recoveries are free.', 0, 'USD', 'month',
    '{"recoveries":3,"invoices":null,"team_members":1,"white_label":false}'::jsonb),
  ('solo', 'Solo', 'Unlimited recovery for independent operators.', 2900, 'USD', 'month',
    '{"recoveries":null,"invoices":null,"team_members":1,"white_label":false}'::jsonb),
  ('agency', 'Agency', 'Unlimited recovery with team and white-label support.', 9900, 'USD', 'month',
    '{"recoveries":null,"invoices":null,"team_members":5,"white_label":true}'::jsonb)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    feature_limits = excluded.feature_limits,
    updated_at = now();

create or replace function public.is_workspace_editor(target_workspace uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace
      and user_id = (select auth.uid())
      and role in ('owner', 'admin', 'member')
  );
$$;

-- The original broad "for all" policies let viewers write workspace data.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'subscriptions', 'usage_counters', 'invoices', 'invoice_payment_links',
    'reminder_logs', 'gateway_connections', 'tone_settings', 'activity_events'
  ] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format('drop policy if exists %I on public.%I', table_name || '_member_access', table_name);
      execute format(
        'create policy %I on public.%I for select using (public.is_workspace_member(workspace_id))',
        table_name || '_member_select', table_name
      );
      execute format(
        'create policy %I on public.%I for insert with check (public.is_workspace_editor(workspace_id))',
        table_name || '_editor_insert', table_name
      );
      execute format(
        'create policy %I on public.%I for update using (public.is_workspace_editor(workspace_id)) with check (public.is_workspace_editor(workspace_id))',
        table_name || '_editor_update', table_name
      );
      execute format(
        'create policy %I on public.%I for delete using (public.is_workspace_editor(workspace_id))',
        table_name || '_editor_delete', table_name
      );
    end if;
  end loop;
end
$$;

alter table public.consent_records enable row level security;
drop policy if exists consent_records_member_access on public.consent_records;
drop policy if exists consent_records_self_select on public.consent_records;
drop policy if exists consent_records_self_insert on public.consent_records;
create policy consent_records_self_select on public.consent_records
  for select using (user_id = (select auth.uid()) or public.is_workspace_admin(workspace_id));
create policy consent_records_self_insert on public.consent_records
  for insert with check (
    user_id = (select auth.uid()) and public.is_workspace_member(workspace_id)
  );

alter table public.audit_logs enable row level security;
drop policy if exists audit_logs_member_read on public.audit_logs;
create policy audit_logs_member_read on public.audit_logs
  for select using (workspace_id is not null and public.is_workspace_member(workspace_id));

alter table public.notification_events enable row level security;
create policy notification_events_self_read on public.notification_events
  for select using (
    user_id = (select auth.uid()) and public.is_workspace_member(workspace_id)
  );
create policy notification_events_self_update on public.notification_events
  for update using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Atomically reserve usage under the active/trialing subscription.
create or replace function public.increment_usage(
  p_workspace_id uuid,
  p_metric text,
  p_period_start date,
  p_period_end date,
  p_increment bigint default 1
)
returns table (allowed boolean, quantity bigint, usage_limit bigint)
language plpgsql security definer set search_path = public
as $$
declare
  plan_limits jsonb;
  current_quantity bigint;
  metric_limit bigint;
  metric_configured boolean;
begin
  if p_increment < 1 or p_period_end < p_period_start
     or p_metric !~ '^[a-z0-9_.-]+$'
     or not public.is_workspace_member(p_workspace_id) then
    return query select false, 0::bigint, null::bigint;
    return;
  end if;

  select p.feature_limits
  into plan_limits
  from public.subscriptions s
  join public.plans p on p.id = s.plan_id
  where s.workspace_id = p_workspace_id
    and s.status in ('trialing', 'active')
  order by s.created_at desc
  limit 1;

  if plan_limits is null then
    return query select false, 0::bigint, null::bigint;
    return;
  end if;

  metric_configured := plan_limits ? p_metric;
  if not metric_configured then
    return query select false, 0::bigint, null::bigint;
    return;
  end if;

  metric_limit := case
    when jsonb_typeof(plan_limits -> p_metric) = 'number'
      then (plan_limits ->> p_metric)::bigint
    else null
  end;

  insert into public.usage_counters (workspace_id, metric, period_start, period_end, quantity)
  values (p_workspace_id, p_metric, p_period_start, p_period_end, 0)
  on conflict (workspace_id, metric, period_start, period_end) do nothing;

  select u.quantity
  into current_quantity
  from public.usage_counters u
  where u.workspace_id = p_workspace_id
    and u.metric = p_metric
    and u.period_start = p_period_start
    and u.period_end = p_period_end
  for update;

  if metric_limit is not null and current_quantity + p_increment > metric_limit then
    return query select false, current_quantity, metric_limit;
    return;
  end if;

  update public.usage_counters
  set quantity = quantity + p_increment
  where workspace_id = p_workspace_id
    and metric = p_metric
    and period_start = p_period_start
    and period_end = p_period_end
  returning usage_counters.quantity into current_quantity;

  return query select true, current_quantity, metric_limit;
end;
$$;

revoke all on function public.increment_usage(uuid, text, date, date, bigint) from public;
grant execute on function public.increment_usage(uuid, text, date, date, bigint) to authenticated;
