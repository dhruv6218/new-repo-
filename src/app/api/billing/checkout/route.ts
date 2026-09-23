import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabase/server';
import { createDodoCheckoutSession } from '../../../../lib/server/dodo';
import { rateLimit } from '../../../../lib/server/rate-limit';

export async function POST(request: Request) {
  if (!rateLimit(request, 'billing-checkout', 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Try again shortly.' }, { status: 429 });
  }

  let body: { planCode?: 'solo' | 'agency'; workspaceId?: string; interval?: 'monthly' | 'yearly' };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const { planCode, workspaceId, interval } = body;
  if (!planCode || !['solo', 'agency'].includes(planCode) || !workspaceId) {
    return NextResponse.json({ error: 'Valid planCode and workspaceId are required.' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  // Verify workspace membership (admin / owner)
  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError || !membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Admin permission required for this workspace.' }, { status: 403 });
  }

  const host = request.headers.get('origin') || request.headers.get('host') || 'http://localhost:3000';
  const returnUrl = `${host.startsWith('http') ? host : `https://${host}`}/app/settings?billing_updated=true`;

  try {
    const { checkoutUrl } = await createDodoCheckoutSession({
      workspaceId,
      planCode,
      interval: interval === 'yearly' ? 'yearly' : 'monthly',
      userEmail: user.email || '',
      userName: (user.user_metadata?.full_name as string) || undefined,
      returnUrl,
    });

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error('Dodo checkout creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not create checkout session.' },
      { status: 502 },
    );
  }
}
