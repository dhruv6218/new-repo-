import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabase/server';
import { getPlanLimits, normalizePlanCode } from '../../../../lib/server/entitlements';

type BillingSubscription = {
  workspace_id: string;
  status: string;
  provider: string | null;
  provider_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  plans: { code: string; name: string } | null;
};

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { data: memberships, error: membershipError } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id);
  if (membershipError) return NextResponse.json({ error: membershipError.message }, { status: 500 });

  const workspaceIds = (memberships ?? []).map(({ workspace_id }) => workspace_id);
  if (!workspaceIds.length) return NextResponse.json({ subscription: null, plan: null, limits: null });

  const { data: subscriptions, error: subscriptionError } = await supabase
    .from('subscriptions')
    .select('workspace_id, status, provider, provider_subscription_id, current_period_start, current_period_end, cancel_at_period_end, plans(code, name, feature_limits)')
    .in('workspace_id', workspaceIds)
    .in('status', ['trialing', 'active', 'past_due', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1) as unknown as { data: BillingSubscription[] | null; error: { message: string } | null };
  if (subscriptionError) return NextResponse.json({ error: subscriptionError.message }, { status: 500 });

  const subscription = subscriptions?.[0] ?? null;
  const planCode = normalizePlanCode(
    subscription && typeof subscription.plans === 'object' && subscription.plans && 'code' in subscription.plans
      ? String(subscription.plans.code)
      : null,
  );
  return NextResponse.json({
    subscription: subscription
      ? {
        workspace_id: subscription.workspace_id,
        status: subscription.status,
        provider: subscription.provider,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
      }
      : null,
    plan: planCode ? {
      code: planCode,
      name: subscription?.plans && typeof subscription.plans === 'object' && 'name' in subscription.plans
        ? String(subscription.plans.name)
        : planCode,
    } : { code: 'hook', name: 'Hook' },
    limits: getPlanLimits(planCode ?? 'hook'),
  });
}
