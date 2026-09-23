import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  claimWebhookEvent,
  markInvoicePaid,
  providerConfig,
  verifyStripeSignature,
} from '../../../../lib/server/payments';
import { rateLimit } from '../../../../lib/server/rate-limit';

export async function POST(request: NextRequest) {
  if (!rateLimit(request, 'stripe-webhook', 120, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const config = providerConfig('stripe');
  if (!config.webhookSecret) return NextResponse.json({ error: 'Stripe webhook is not configured' }, { status: 503 });

  const body = await request.text();
  if (!verifyStripeSignature(body, request.headers.get('stripe-signature'), config.webhookSecret)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  let event: {
    id?: string;
    type?: string;
    data?: { object?: { id?: string; metadata?: { invoice_id?: string } } };
  };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid webhook body' }, { status: 400 });
  }
  if (!event.id) return NextResponse.json({ error: 'Missing event id' }, { status: 400 });

  const claimed = await claimWebhookEvent('stripe', event.id, event);
  if (!claimed) return NextResponse.json({ received: true, duplicate: true });

  if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
    const object = event.data?.object;
    if (object?.metadata?.invoice_id) {
      await markInvoicePaid(object.metadata.invoice_id, 'stripe', object.id ?? event.id);
    }
  }
  return NextResponse.json({ received: true });
}
