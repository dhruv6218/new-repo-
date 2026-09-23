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

This phase only adds migration source and client foundations; it does not apply
the migration to a remote project.
