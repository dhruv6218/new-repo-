import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextParam = requestUrl.searchParams.get('next');
  let next = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/app';

  if (code) {
    const { createSupabaseServerClient } = await import('../../../lib/supabase/server');
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent('The sign-in link is invalid or expired.')}`, requestUrl.origin));
    }

    // Smart routing: If user signed in via Google/Magic Link for the first time and has no workspace, route to onboarding
    if (data?.user && (next === '/app' || next === '/')) {
      const { data: memberships } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', data.user.id)
        .limit(1);

      if (!memberships || memberships.length === 0) {
        next = '/onboarding/step-1';
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
