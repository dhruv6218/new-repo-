import crypto from 'node:crypto';
import { createAdminClient } from './admin';

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

export async function claimWebhookEvent(
  provider: PaymentProvider,
  eventId: string,
  payload: unknown,
  signatureValid = true,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('gateway_webhook_events')
    .insert({ provider, provider_event_id: eventId, signature_valid: signatureValid, payload })
    .select('id');
  // Duplicate key = already processed; any other error = rethrow
  if (error) {
    if (error.code === '23505') return false; // unique constraint → duplicate
    throw new Error(`Unable to persist webhook event: ${error.message}`);
  }
  return (data?.length ?? 0) > 0;
}

export async function markInvoicePaid(invoiceId: string, _provider: PaymentProvider, _externalId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', invoiceId)
    .neq('status', 'paid');
  if (error) throw new Error(`Unable to update invoice: ${error.message}`);
}

export async function savePaymentLink(input: {
  invoiceId: string;
  provider: PaymentProvider;
  externalId: string;
  url: string;
  amount: number;
  currency: string;
}): Promise<void> {
  const admin = createAdminClient();
  // Get workspace_id from invoice for RLS-safe insert
  const { data: invoice } = await admin.from('invoices').select('workspace_id').eq('id', input.invoiceId).single();
  if (!invoice) throw new Error('Invoice not found when saving payment link');
  const tokenHash = crypto.createHash('sha256').update(`${input.invoiceId}:${input.externalId}`).digest('hex');
  const { error } = await admin.from('invoice_payment_links').upsert({
    workspace_id: invoice.workspace_id,
    invoice_id: input.invoiceId,
    token_hash: tokenHash,
    status: 'active',
  }, { onConflict: 'token_hash' });
  if (error) throw new Error(`Unable to persist payment link: ${error.message}`);
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

/**
 * Resolves gateway credentials for a given workspace.
 * First checks if the workspace user connected their own key via Gateways UI (AES-256-GCM decrypted).
 * If no user key is connected, falls back to platform environment variables.
 */
export async function resolveGatewayCredentials(
  workspaceId: string,
  provider: 'stripe' | 'razorpay',
): Promise<{ secretKey?: string; keyId?: string; keySecret?: string }> {
  const admin = createAdminClient();
  const { data: conn } = await admin
    .from('gateway_connections')
    .select('encrypted_secret_ref')
    .eq('workspace_id', workspaceId)
    .eq('provider', provider)
    .eq('is_active', true)
    .maybeSingle();

  const ref = typeof conn?.encrypted_secret_ref === 'string' ? conn.encrypted_secret_ref : null;
  if (ref && ref.startsWith('aes256gcm:')) {
    const encryptionKey = process.env.GATEWAY_ENCRYPTION_KEY;
    if (encryptionKey && encryptionKey.length >= 32) {
      try {
        const parts = ref.split(':');
        const iv = Buffer.from(parts[1], 'hex');
        const tag = Buffer.from(parts[2], 'hex');
        const encryptedText = Buffer.from(parts[3], 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(encryptionKey.slice(0, 32)), iv);
        decipher.setAuthTag(tag);
        const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]).toString('utf8');
        const parsed = JSON.parse(decrypted) as { api_key?: string; api_secret?: string };
        if (provider === 'stripe' && parsed.api_key) {
          return { secretKey: parsed.api_key };
        }
        if (provider === 'razorpay' && parsed.api_key) {
          return { keyId: parsed.api_key, keySecret: parsed.api_secret ?? '' };
        }
      } catch {
        // Fallback to platform env
      }
    }
  }

  // Fallback to platform environment variables
  if (provider === 'stripe') {
    return { secretKey: process.env.STRIPE_SECRET_KEY };
  }
  return { keyId: process.env.RAZORPAY_KEY_ID, keySecret: process.env.RAZORPAY_KEY_SECRET };
}
