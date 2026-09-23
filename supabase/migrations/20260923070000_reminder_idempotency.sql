create unique index if not exists reminder_logs_idempotency_key_idx
  on public.reminder_logs (idempotency_key);

create index if not exists invoices_daily_chase_idx
  on public.invoices (status, due_at, last_chased_at)
  where status = 'pending' and paused_at is null and disputed_at is null and paid_at is null;
