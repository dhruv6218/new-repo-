import crypto from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type PaymentProvider = 'stripe' | 'razorpay' | 'dodo';

export function verifyStripeSignature(
  payload: string,
  signature: string | null,
  secret: string,
  toleranceSeconds = 300,
): boolean {
  if (!signature) return false;
  const values = Object.fromEntries(signature.split(',').map((part) => part.split('=')));
  const timestamp = Number(values.t);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) return false;
  return timingSafeEqual(
    crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex'),
    values.v1 ?? '',
  );
}

export function verifyRazorpaySignature(payload: string, signature: string | null, secret: string): boolean {
  return timingSafeEqual(crypto.createHmac('sha256', secret).update(payload).digest('hex'), signature ?? '');
}

function timingSafeEqual(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function requireSupabase(): { url: string; key: string } {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Payment persistence is not configured: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }
  return { url: SUPABASE_URL.replace(/\/$/, ''), key: SUPABASE_SERVICE_ROLE_KEY };
}

async function supabaseRequest(path: string, init: RequestInit): Promise<Response> {
  const { url, key } = requireSupabase();
  return fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

export async function claimWebhookEvent(
  provider: PaymentProvider,
  eventId: string,
  payload: unknown,
  signatureValid = true,
): Promise<boolean> {
  const response = await supabaseRequest('gateway_webhook_events', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
    body: JSON.stringify({ provider, provider_event_id: eventId, signature_valid: signatureValid, payload }),
  });
  if (!response.ok) throw new Error(`Unable to persist webhook event (${response.status})`);
  return (await response.json() as unknown[]).length > 0;
}

export async function markInvoicePaid(invoiceId: string, provider: PaymentProvider, externalId: string): Promise<void> {
  const response = await supabaseRequest(
    `invoices?id=eq.${encodeURIComponent(invoiceId)}&status=neq.paid`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'paid', paid_provider: provider, paid_external_id: externalId, paid_at: new Date().toISOString() }),
    },
  );
  if (!response.ok) throw new Error(`Unable to update invoice (${response.status})`);
}

export async function savePaymentLink(input: {
  invoiceId: string;
  provider: PaymentProvider;
  externalId: string;
  url: string;
  amount: number;
  currency: string;
}): Promise<void> {
  const response = await supabaseRequest('invoice_payment_links', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      invoice_id: input.invoiceId,
      provider: input.provider,
      external_id: input.externalId,
      url: input.url,
      amount: input.amount,
      currency: input.currency.toUpperCase(),
      status: 'active',
    }),
  });
  if (!response.ok) throw new Error(`Unable to persist payment link (${response.status})`);
}

export function providerConfig(provider: PaymentProvider) {
  if (provider === 'stripe') {
    return {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    };
  }
  return {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  };
}
