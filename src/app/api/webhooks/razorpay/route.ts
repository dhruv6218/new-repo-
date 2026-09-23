import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  claimWebhookEvent,
  markInvoicePaid,
  providerConfig,
  verifyRazorpaySignature,
} from '../../../../lib/server/payments';
import { rateLimit } from '../../../../lib/server/rate-limit';

export async function POST(request: NextRequest) {
  if (!rateLimit(request, 'razorpay-webhook', 120, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const config = providerConfig('razorpay');
  if (!config.webhookSecret) return NextResponse.json({ error: 'Razorpay webhook is not configured' }, { status: 503 });

  const body = await request.text();
  if (!verifyRazorpaySignature(body, request.headers.get('x-razorpay-signature'), config.webhookSecret)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; notes?: { invoice_id?: string } } };
      payment_link?: { entity?: { id?: string; notes?: { invoice_id?: string } } };
    };
  };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid webhook body' }, { status: 400 });
  }
  const eventId = request.headers.get('x-razorpay-event-id') ?? `${event.event}:${body}`;
  const claimed = await claimWebhookEvent('razorpay', eventId, event);
  if (!claimed) return NextResponse.json({ received: true, duplicate: true });

  if (event.event === 'payment_link.paid' || event.event === 'payment.captured') {
    const entity = event.payload?.payment_link?.entity ?? event.payload?.payment?.entity;
    if (entity?.notes?.invoice_id) {
      await markInvoicePaid(entity.notes.invoice_id, 'razorpay', entity.id ?? eventId);
    }
  }
  return NextResponse.json({ received: true });
}
