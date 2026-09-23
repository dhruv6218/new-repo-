create extension if not exists pgcrypto;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  client_name text not null,
  client_email text not null,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'USD',
  due_date date not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'paused', 'disputed')),
  paid_provider text check (paid_provider in ('stripe', 'razorpay')),
  paid_external_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.invoice_payment_links (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  provider text not null check (provider in ('stripe', 'razorpay')),
  external_id text not null,
  url text not null,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null,
  status text not null default 'active' check (status in ('active', 'paid', 'expired')),
  created_at timestamptz not null default now(),
  unique (provider, external_id)
);

create table if not exists public.gateway_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('stripe', 'razorpay')),
  event_id text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  unique (provider, event_id)
);

alter table public.invoices enable row level security;
alter table public.invoice_payment_links enable row level security;
alter table public.gateway_webhook_events enable row level security;
