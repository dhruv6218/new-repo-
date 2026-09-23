import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDodoConfig, verifyDodoSignature, updateWorkspaceSubscription } from '../../../../lib/server/dodo';
import { claimWebhookEvent } from '../../../../lib/server/payments';
import { rateLimit } from '../../../../lib/server/rate-limit';

export async function POST(request: NextRequest) {
  if (!rateLimit(request, 'dodo-webhook', 120, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const config = getDodoConfig();
  if (!config.webhookSecret) {
    return NextResponse.json({ error: 'Dodo webhook secret is not configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('webhook-signature') || request.headers.get('x-dodo-signature');
  const webhookId = request.headers.get('webhook-id');
  const webhookTimestamp = request.headers.get('webhook-timestamp');

  const isValid = verifyDodoSignature(
    rawBody,
    signature,
    config.webhookSecret,
    webhookId,
    webhookTimestamp,
  );

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  let event: {
    event_id?: string;
    id?: string;
    type?: string;
    data?: {
      subscription_id?: string;
      id?: string;
      status?: string;
      metadata?: {
        workspace_id?: string;
        plan_code?: string;
      };
      customer?: { email?: string };
      current_period_start?: string;
      current_period_end?: string;
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const eventId = event.event_id || event.id || webhookId;
  if (!eventId) {
    return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });
  }

  // Deduplicate webhook event in database
  const claimed = await claimWebhookEvent('dodo', eventId, event);
  if (!claimed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const eventType = event.type || '';
  const data = event.data || {};
  const metadata = data.metadata || {};
  const workspaceId = metadata.workspace_id;
  const planCode = metadata.plan_code;
  const subscriptionId = data.subscription_id || data.id || eventId;

  if (workspaceId && planCode) {
    if (eventType.includes('subscription.active') || eventType.includes('payment.succeeded')) {
      await updateWorkspaceSubscription({
        workspaceId,
        planCode,
        status: 'active',
        providerSubscriptionId: subscriptionId,
        periodStart: data.current_period_start,
        periodEnd: data.current_period_end,
      });
    } else if (eventType.includes('subscription.cancelled') || eventType.includes('subscription.expired')) {
      await updateWorkspaceSubscription({
        workspaceId,
        planCode,
        status: 'canceled',
        providerSubscriptionId: subscriptionId,
      });
    }
  }

  return NextResponse.json({ received: true });
}
