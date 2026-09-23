export function readiness(): { ready: boolean; missing: string[] } {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  const missing = required.filter((name) => !process.env[name]);
  return { ready: missing.length === 0, missing };
}
