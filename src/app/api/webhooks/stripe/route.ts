import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  claimWebhookEvent,
  markInvoicePaid,
  providerConfig,
  verifyStripeSignature,
} from '../../../../lib/server/payments';

export async function POST(request: NextRequest) {
  const config = providerConfig('stripe');
  if (!config.webhookSecret) return NextResponse.json({ error: 'Stripe webhook is not configured' }, { status: 503 });

  const body = await request.text();
  if (!verifyStripeSignature(body, request.headers.get('stripe-signature'), config.webhookSecret)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  const event = JSON.parse(body) as {
    id?: string;
    type?: string;
    data?: { object?: { id?: string; metadata?: { invoice_id?: string } } };
  };
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
