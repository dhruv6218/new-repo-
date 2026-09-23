-- Dodo remains provider-configured: no provider IDs or webhook fields are
-- assumed here. These catalog rows are the app's stable entitlement contract.
insert into public.plans (code, name, description, amount_minor, currency, interval, feature_limits)
values
  ('hook', 'Hook', 'Free recovery starter plan', 0, 'USD', 'month', '{"recoveries":3,"invoices":null,"team_members":1,"white_label":false}'),
  ('solo', 'Solo', 'Unlimited recovery for one operator', 2900, 'USD', 'month', '{"recoveries":null,"invoices":null,"team_members":1,"white_label":false}'),
  ('agency', 'Agency', 'Recovery and white-label tools for teams', 9900, 'USD', 'month', '{"recoveries":null,"invoices":null,"team_members":5,"white_label":true}')
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  amount_minor = excluded.amount_minor,
  currency = excluded.currency,
  interval = excluded.interval,
  feature_limits = excluded.feature_limits,
  is_active = true,
  updated_at = now();
