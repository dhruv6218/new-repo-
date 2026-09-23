-- Astrix foundation schema. Apply with Supabase CLI; do not run against a
-- remote project until the application rollout is ready.
create extension if not exists pgcrypto;

do $$ begin create type public.workspace_role as enum ('owner', 'admin', 'member', 'viewer'); exception when duplicate_object then null; end $$;
do $$ begin create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'paused'); exception when duplicate_object then null; end $$;
do $$ begin create type public.invoice_status as enum ('draft', 'pending', 'paid', 'paused', 'disputed', 'void', 'uncollectible'); exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_link_status as enum ('active', 'expired', 'used', 'disabled'); exception when duplicate_object then null; end $$;
do $$ begin create type public.reminder_kind as enum ('upcoming', 'due', 'overdue', 'final'); exception when duplicate_object then null; end $$;
do $$ begin create type public.gateway_provider as enum ('stripe', 'razorpay', 'paypal', 'dodo', 'other'); exception when duplicate_object then null; end $$;
do $$ begin create type public.invoice_ai_status as enum ('pending', 'nudge_sent', 'escalated', 'paid'); exception when duplicate_object then null; end $$;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9_-]+$'),
  name text not null,
  description text,
  amount_minor bigint not null default 0 check (amount_minor >= 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  interval text not null default 'month' check (interval in ('month', 'year', 'one_time')),
  feature_limits jsonb not null default '{}'::jsonb check (jsonb_typeof(feature_limits) = 'object'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status public.subscription_status not null default 'trialing',
  provider public.gateway_provider,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider, provider_subscription_id)
);

create table public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  metric text not null check (metric ~ '^[a-z0-9_.-]+$'),
  period_start date not null,
  period_end date not null,
  quantity bigint not null default 0 check (quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start),
  unique (workspace_id, metric, period_start, period_end)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  invoice_number text not null,
  client_name text not null check (length(trim(client_name)) between 1 and 200),
  client_email text not null check (client_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  status public.invoice_status not null default 'draft',
  ai_status public.invoice_ai_status not null default 'pending',
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  subtotal_minor bigint not null default 0 check (subtotal_minor >= 0),
  tax_minor bigint not null default 0 check (tax_minor >= 0),
  total_minor bigint not null default 0 check (total_minor >= 0),
  due_at timestamptz,
  last_chased_at timestamptz,
  reminder_count integer not null default 0 check (reminder_count >= 0),
  paused_at timestamptz,
  disputed_at timestamptz,
  paid_at timestamptz,
  provider_invoice_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, invoice_number),
  unique (workspace_id, provider_invoice_id)
);

create table public.invoice_payment_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  token_hash text not null unique,
  status public.payment_link_status not null default 'active',
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reminder_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  kind public.reminder_kind not null,
  idempotency_key text not null,
  sent_at timestamptz not null default now(),
  provider_message_id text,
  created_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key)
);

create table public.gateway_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider public.gateway_provider not null,
  account_label text,
  external_account_id text,
  encrypted_secret_ref text not null,
  secret_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(secret_metadata) = 'object'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider, external_account_id)
);

create table public.tone_settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  tone text not null default 'professional',
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (length(trim(event_type)) between 1 and 120),
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null check (length(trim(consent_type)) between 1 and 120),
  version text not null,
  granted boolean not null,
  recorded_at timestamptz not null default now(),
  unique (workspace_id, user_id, consent_type, version)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  before_data jsonb,
  after_data jsonb,
  request_id text,
  created_at timestamptz not null default now()
);

create table public.billing_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  provider public.gateway_provider not null,
  event_type text not null,
  provider_event_id text not null,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create table public.gateway_webhook_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  provider public.gateway_provider not null,
  provider_event_id text not null,
  signature_valid boolean not null default false,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text,
  unique (provider, provider_event_id)
);

create index workspace_members_user_idx on public.workspace_members (user_id);
create index subscriptions_workspace_idx on public.subscriptions (workspace_id, status);
create index usage_counters_workspace_period_idx on public.usage_counters (workspace_id, period_start, period_end);
create index invoices_workspace_status_idx on public.invoices (workspace_id, status, due_at);
create index invoices_chase_eligibility_idx on public.invoices (workspace_id, status, due_at, last_chased_at);
create index invoice_payment_links_invoice_idx on public.invoice_payment_links (invoice_id);
create index reminder_logs_invoice_idx on public.reminder_logs (invoice_id, sent_at);
create index activity_events_workspace_created_idx on public.activity_events (workspace_id, created_at desc);
create index audit_logs_workspace_created_idx on public.audit_logs (workspace_id, created_at desc);

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger workspaces_updated_at before update on public.workspaces for each row execute function public.set_updated_at();
create trigger workspace_members_updated_at before update on public.workspace_members for each row execute function public.set_updated_at();
create trigger plans_updated_at before update on public.plans for each row execute function public.set_updated_at();
create trigger subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
create trigger usage_counters_updated_at before update on public.usage_counters for each row execute function public.set_updated_at();
create trigger invoices_updated_at before update on public.invoices for each row execute function public.set_updated_at();
create trigger invoice_payment_links_updated_at before update on public.invoice_payment_links for each row execute function public.set_updated_at();
create trigger gateway_connections_updated_at before update on public.gateway_connections for each row execute function public.set_updated_at();
create trigger tone_settings_updated_at before update on public.tone_settings for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.add_workspace_creator()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (workspace_id, user_id) do nothing;
  return new;
end;
$$;

create trigger on_workspace_created
  after insert on public.workspaces for each row execute function public.add_workspace_creator();

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace and user_id = (select auth.uid())
  );
$$;

create or replace function public.is_workspace_admin(target_workspace uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = target_workspace
      and user_id = (select auth.uid())
      and role in ('owner', 'admin')
  );
$$;

alter table public.profiles enable row level security;
create policy profiles_self_access on public.profiles
  for all using (id = (select auth.uid())) with check (id = (select auth.uid()));

alter table public.workspaces enable row level security;
create policy workspaces_member_access on public.workspaces
  for select using (public.is_workspace_member(id));
create policy workspaces_creator_insert on public.workspaces
  for insert with check (created_by = (select auth.uid()));
create policy workspaces_admin_update on public.workspaces
  for update using (public.is_workspace_admin(id)) with check (public.is_workspace_admin(id));
create policy workspaces_admin_delete on public.workspaces
  for delete using (public.is_workspace_admin(id));

alter table public.workspace_members enable row level security;
create policy members_self_or_admin_select on public.workspace_members
  for select using (user_id = (select auth.uid()) or public.is_workspace_member(workspace_id));
create policy members_admin_insert on public.workspace_members
  for insert with check (public.is_workspace_admin(workspace_id));
create policy members_admin_update on public.workspace_members
  for update using (public.is_workspace_admin(workspace_id)) with check (public.is_workspace_admin(workspace_id));
create policy members_admin_delete on public.workspace_members
  for delete using (public.is_workspace_admin(workspace_id));

-- Workspace-scoped data follows the same least-privilege membership boundary.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'subscriptions', 'usage_counters', 'invoices', 'invoice_payment_links',
    'reminder_logs', 'gateway_connections', 'tone_settings', 'activity_events',
    'consent_records'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy %I on public.%I for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id))',
      table_name || '_member_access', table_name
    );
  end loop;
end $$;

-- Plans are public catalog data; writes remain server-side/service-role only.
alter table public.plans enable row level security;
create policy plans_authenticated_read on public.plans
  for select to authenticated using (is_active);

-- Logs and webhook/event ingestion are never client-writable. Members may read
-- only events belonging to a workspace they belong to.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['audit_logs', 'billing_events', 'gateway_webhook_events'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy %I on public.%I for select using (workspace_id is not null and public.is_workspace_member(workspace_id))',
      table_name || '_member_read', table_name
    );
  end loop;
end $$;
