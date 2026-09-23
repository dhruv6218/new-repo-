# Supabase

The SQL files in `supabase/migrations` are the database source of truth. Install
the [Supabase CLI](https://supabase.com/docs/guides/cli), then run locally:

```sh
supabase start
supabase db reset
```

Copy `.env.example` to `.env.local` and set
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. These are the
only values needed by the current client helpers. **Never commit `.env.local`,
service-role keys, database passwords, or any other secrets.** The service-role
key is server-only and is intentionally not used by the browser helpers.

## Migration order and production runbook

Apply migrations in filename order. The relevant order is:

1. `20260923070000_reminder_idempotency.sql`
2. `20260923100000_astrix_foundation.sql`
3. `20260923124317_payment_integrations.sql`
4. `20260923133000_admin_security.sql`
5. `20260923133000_profile_preferences.sql`
6. `20260923140000_production_hardening.sql`

The payment migration is retained for history. Its `if not exists` tables can
leave an older invoice/webhook shape in place, so the final hardening migration
adds missing canonical columns and backfills `provider_event_id` without
dropping or rewriting existing rows.

Before a remote deploy, back up the database and inspect the generated SQL:

```sh
supabase db dump --linked --schema public > supabase/remote-public.sql
supabase db lint
supabase db push --dry-run
supabase db push
```

After deployment, run
`supabase/validation/production_hardening.sql` in the Supabase SQL editor.
Confirm the three plans, RLS flags, and the authenticated RPC privilege before
enabling application traffic that calls `increment_usage`.
