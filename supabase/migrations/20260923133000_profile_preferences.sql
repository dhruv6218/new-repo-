alter table public.profiles
  add column if not exists notification_preferences jsonb not null default '{"payment_received":true,"reminder_sent":true,"invoice_dispute":true,"weekly_summary":false}'::jsonb
  check (jsonb_typeof(notification_preferences) = 'object');
