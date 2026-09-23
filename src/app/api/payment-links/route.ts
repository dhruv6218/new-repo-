import { NextResponse } from 'next/server';
import { resolveGatewayCredentials, savePaymentLink } from '../../../lib/server/payments';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { rateLimit } from '../../../lib/server/rate-limit';

type LinkRequest = {
  provider?: 'stripe' | 'razorpay';
  invoice_id?: string;
  amount?: number;
  currency?: string;
  description?: string;
};

export async function POST(request: Request) {
  if (!rateLimit(request, 'payment-links', 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Try again shortly.' }, { status: 429 });
  }
  let input: LinkRequest;
  try {
    input = await request.json() as LinkRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!['stripe', 'razorpay'].includes(input.provider ?? '') || !input.invoice_id) {
    return NextResponse.json({ error: 'provider and invoice_id are required' }, { status: 400 });
  }
  if (input.description !== undefined && (typeof input.description !== 'string' || input.description.length > 200)) {
    return NextResponse.json({ error: 'Invalid description' }, { status: 400 });
  }
  if (!/^[0-9a-f-]{36}$/i.test(input.invoice_id)) return NextResponse.json({ error: 'Invalid invoice id' }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('id,workspace_id,client_name,total_minor,currency,status')
    .eq('id', input.invoice_id)
    .maybeSingle();
  if (invoiceError) return NextResponse.json({ error: invoiceError.message }, { status: 500 });
  if (!invoice || invoice.status === 'paid') return NextResponse.json({ error: 'Invoice is unavailable for payment' }, { status: 404 });
  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('workspace_id', invoice.workspace_id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (membershipError) return NextResponse.json({ error: membershipError.message }, { status: 500 });
  if (!membership) return NextResponse.json({ error: 'You do not have access to this invoice' }, { status: 403 });
  const amount = Number(invoice.total_minor) / 100;
  const currency = invoice.currency;

  if (input.provider === 'stripe') {
    const creds = await resolveGatewayCredentials(invoice.workspace_id, 'stripe');
    if (!creds.secretKey) return NextResponse.json({ error: 'Stripe is not configured. Please add your Stripe API key in Gateways settings.' }, { status: 503 });
    const params = new URLSearchParams({
      'line_items[0][price_data][currency]': currency.toLowerCase(),
      'line_items[0][price_data][unit_amount]': String(Math.round(amount * 100)),
      'line_items[0][price_data][product_data][name]': input.description ?? `Invoice ${input.invoice_id}`,
      'line_items[0][quantity]': '1',
      'metadata[invoice_id]': input.invoice_id,
      mode: 'payment',
    });
    const response = await fetch('https://api.stripe.com/v1/payment_links', {
      method: 'POST',
      headers: { Authorization: `Bearer ${creds.secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    if (!response.ok) return NextResponse.json({ error: 'Stripe payment link creation failed' }, { status: 502 });
    const link = await response.json() as { id?: string; url?: string };
    if (!link.id || !link.url) return NextResponse.json({ error: 'Stripe returned an incomplete payment link' }, { status: 502 });
    await savePaymentLink({ invoiceId: input.invoice_id, provider: 'stripe', externalId: link.id, url: link.url, amount, currency });
    return NextResponse.json({ url: link.url });
  }

  const creds = await resolveGatewayCredentials(invoice.workspace_id, 'razorpay');
  if (!creds.keyId || !creds.keySecret) return NextResponse.json({ error: 'Razorpay is not configured. Please add your Razorpay credentials in Gateways settings.' }, { status: 503 });
  const response = await fetch('https://api.razorpay.com/v1/payment_links', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency: currency.toUpperCase(),
      description: input.description ?? `Invoice ${input.invoice_id}`,
      reference_id: input.invoice_id,
      notes: { invoice_id: input.invoice_id },
    }),
  });
  if (!response.ok) return NextResponse.json({ error: 'Razorpay payment link creation failed' }, { status: 502 });
  const link = await response.json() as { id?: string; short_url?: string };
  if (!link.id || !link.short_url) return NextResponse.json({ error: 'Razorpay returned an incomplete payment link' }, { status: 502 });
  await savePaymentLink({ invoiceId: input.invoice_id, provider: 'razorpay', externalId: link.id, url: link.short_url, amount, currency });
  return NextResponse.json({ url: link.short_url });
}
