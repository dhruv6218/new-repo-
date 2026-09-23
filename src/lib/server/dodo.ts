import crypto from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export interface DodoConfig {
  apiKey?: string;
  webhookSecret?: string;
  environment: 'test_mode' | 'live_mode';
  productMap: {
    solo_monthly: string;
    solo_yearly: string;
    agency_monthly: string;
    agency_yearly: string;
  };
}

export function getDodoConfig(): DodoConfig {
  return {
    apiKey: process.env.DODO_PAYMENTS_API_KEY,
    webhookSecret: process.env.DODO_PAYMENTS_WEBHOOK_SECRET,
    environment: process.env.DODO_PAYMENTS_ENV === 'live_mode' ? 'live_mode' : 'test_mode',
    productMap: {
      solo_monthly: process.env.DODO_PRODUCT_SOLO_MONTHLY_ID || process.env.DODO_PRODUCT_SOLO_ID || 'pdt_0NcBuLfSXkF4hSJFs0AbV',
      solo_yearly: process.env.DODO_PRODUCT_SOLO_YEARLY_ID || 'pdt_0NbFhELrTC3P4kNf8On24',
      agency_monthly: process.env.DODO_PRODUCT_AGENCY_MONTHLY_ID || process.env.DODO_PRODUCT_AGENCY_ID || 'pdt_0NbC7p1x3vArb3CYIqAT6',
      agency_yearly: process.env.DODO_PRODUCT_AGENCY_YEARLY_ID || 'pdt_0NbC5NQsoxq2leqmoeDmB',
    },
  };
}

function safeTimingEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verifies standard webhook signatures from Dodo Payments.
 * Supports standard HMAC-SHA256 signatures with timestamp validation.
 */
export function verifyDodoSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string,
  webhookId?: string | null,
  webhookTimestamp?: string | null,
  toleranceSeconds = 300,
): boolean {
  if (!signatureHeader || !webhookSecret) return false;

  if (webhookId && webhookTimestamp) {
    const timestamp = Number(webhookTimestamp);
    if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) {
      return false;
    }
    const signaturePayload = `${webhookId}.${webhookTimestamp}.${rawBody}`;
    const expected = crypto.createHmac('sha256', webhookSecret).update(signaturePayload).digest('base64');
    const parts = signatureHeader.split(' ');
    for (const part of parts) {
      const [, sig] = part.split(',');
      if (sig && safeTimingEqual(sig, expected)) {
        return true;
      }
      if (safeTimingEqual(part, expected)) {
        return true;
      }
    }
  }

  try {
    const expectedHex = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    if (safeTimingEqual(signatureHeader, expectedHex)) return true;
    const expectedBase64 = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('base64');
    if (safeTimingEqual(signatureHeader, expectedBase64)) return true;
  } catch {
    return false;
  }

  return false;
}

/**
 * Creates a Dodo Payments checkout session for subscription billing.
 */
export async function createDodoCheckoutSession(params: {
  workspaceId: string;
  planCode: 'solo' | 'agency';
  interval?: 'monthly' | 'yearly';
  userEmail: string;
  userName?: string;
  returnUrl: string;
}): Promise<{ checkoutUrl: string }> {
  const config = getDodoConfig();
  const interval = params.interval || 'monthly';
  const productKey = `${params.planCode}_${interval}` as keyof typeof config.productMap;
  const productId = config.productMap[productKey] || config.productMap[`${params.planCode}_monthly` as keyof typeof config.productMap];

  if (!config.apiKey || !productId) {
    throw new Error(`Dodo Payments configuration missing for plan: ${params.planCode} (${interval})`);
  }

  const baseUrl = config.environment === 'live_mode'
    ? 'https://live.dodopayments.com'
    : 'https://test.dodopayments.com';

  const response = await fetch(`${baseUrl}/subscriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: productId,
      customer: {
        email: params.userEmail,
        name: params.userName || params.userEmail.split('@')[0],
      },
      metadata: {
        workspace_id: params.workspaceId,
        plan_code: params.planCode,
        interval,
      },
      return_url: params.returnUrl,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Dodo checkout creation failed (${response.status}): ${errorText}`);
  }

  const data = await response.json() as { payment_link?: string; checkout_url?: string; url?: string };
  const checkoutUrl = data.payment_link || data.checkout_url || data.url;
  if (!checkoutUrl) {
    throw new Error('Dodo Payments returned an empty checkout URL.');
  }

  return { checkoutUrl };
}

/**
 * Activates or updates a workspace subscription in Supabase from a Dodo webhook.
 */
export async function updateWorkspaceSubscription(params: {
  workspaceId: string;
  planCode: string;
  status: 'active' | 'trialing' | 'canceled' | 'past_due';
  providerSubscriptionId: string;
  periodStart?: string;
  periodEnd?: string;
}): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;
  const url = SUPABASE_URL.replace(/\/$/, '');
  const key = SUPABASE_SERVICE_ROLE_KEY;

  const planRes = await fetch(`${url}/rest/v1/plans?code=eq.${encodeURIComponent(params.planCode)}&select=id`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!planRes.ok) return;
  const plans = await planRes.json() as Array<{ id: string }>;
  if (!plans.length) return;
  const planId = plans[0].id;

  await fetch(`${url}/rest/v1/subscriptions`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      workspace_id: params.workspaceId,
      plan_id: planId,
      status: params.status,
      provider: 'dodo',
      provider_subscription_id: params.providerSubscriptionId,
      current_period_start: params.periodStart || new Date().toISOString(),
      current_period_end: params.periodEnd || new Date(Date.now() + 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });
}
