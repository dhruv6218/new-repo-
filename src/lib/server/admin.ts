import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '../supabase/server.ts';
import type { Database } from '../supabase/database.types';
export { adminErrorStatus } from './auth-boundaries';

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { user: null, admin: null, error: 'Authentication required' as const };

  const { data: member, error: memberError } = await supabase
    .from('admin_members')
    .select('user_id, role')
    .eq('user_id', user.id)
    .maybeSingle();
  if (memberError) return { user: null, admin: null, error: 'Admin authorization unavailable' as const };
  if (!member) return { user: null, admin: null, error: 'Admin access required' as const };
  return { user, admin: member, error: null };
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  return createClient<Database>(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
