import { NextResponse } from 'next/server';
import { providerConfig, savePaymentLink } from '../../../lib/server/payments';

type LinkRequest = {
  provider?: 'stripe' | 'razorpay';
  invoice_id?: string;
  amount?: number;
  currency?: string;
  description?: string;
};

export async function POST(request: Request) {
  const input = await request.json() as LinkRequest;
  const amount = input.amount;
  if (!input.provider || !input.invoice_id || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || !input.currency) {
    return NextResponse.json({ error: 'provider, invoice_id, amount, and currency are required' }, { status: 400 });
  }

  if (input.provider === 'stripe') {
    const config = providerConfig('stripe');
    if (!config.secretKey) return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });
    const params = new URLSearchParams({
      'line_items[0][price_data][currency]': input.currency.toLowerCase(),
      'line_items[0][price_data][unit_amount]': String(Math.round(amount * 100)),
      'line_items[0][price_data][product_data][name]': input.description ?? `Invoice ${input.invoice_id}`,
      'line_items[0][quantity]': '1',
      'metadata[invoice_id]': input.invoice_id,
      mode: 'payment',
    });
    const response = await fetch('https://api.stripe.com/v1/payment_links', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    if (!response.ok) return NextResponse.json({ error: 'Stripe payment link creation failed' }, { status: 502 });
    const link = await response.json() as { id?: string; url?: string };
    if (!link.id || !link.url) return NextResponse.json({ error: 'Stripe returned an incomplete payment link' }, { status: 502 });
    await savePaymentLink({ invoiceId: input.invoice_id, provider: 'stripe', externalId: link.id, url: link.url, amount, currency: input.currency });
    return NextResponse.json({ url: link.url });
  }

  const config = providerConfig('razorpay');
  if (!config.keyId || !config.keySecret) return NextResponse.json({ error: 'Razorpay is not configured' }, { status: 503 });
  const response = await fetch('https://api.razorpay.com/v1/payment_links', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency: input.currency.toUpperCase(),
      description: input.description ?? `Invoice ${input.invoice_id}`,
      reference_id: input.invoice_id,
      notes: { invoice_id: input.invoice_id },
    }),
  });
  if (!response.ok) return NextResponse.json({ error: 'Razorpay payment link creation failed' }, { status: 502 });
  const link = await response.json() as { id?: string; short_url?: string };
  if (!link.id || !link.short_url) return NextResponse.json({ error: 'Razorpay returned an incomplete payment link' }, { status: 502 });
  await savePaymentLink({ invoiceId: input.invoice_id, provider: 'razorpay', externalId: link.id, url: link.short_url, amount, currency: input.currency });
  return NextResponse.json({ url: link.short_url });
}
