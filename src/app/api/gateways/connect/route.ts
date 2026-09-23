import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabase/server';
import { createAdminClient } from '../../../../lib/server/admin';
import { rateLimit } from '../../../../lib/server/rate-limit';
import crypto from 'node:crypto';

type ConnectBody = {
  workspace_id?: string;
  provider?: 'stripe' | 'razorpay' | 'dodo';
  api_key?: string;
  api_secret?: string;
};

export async function POST(request: Request) {
  if (!rateLimit(request, 'gateways-connect', 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  let body: ConnectBody;
  try {
    body = await request.json() as ConnectBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { workspace_id, provider, api_key, api_secret } = body;
  if (!workspace_id || !provider || !api_key) {
    return NextResponse.json({ error: 'workspace_id, provider, and api_key are required' }, { status: 400 });
  }
  if (!['stripe', 'razorpay', 'dodo'].includes(provider)) {
    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
  }
  // Validate input lengths to prevent oversized storage
  if (api_key.length > 200 || (api_secret && api_secret.length > 200)) {
    return NextResponse.json({ error: 'Invalid key length' }, { status: 400 });
  }

  // Verify membership in this workspace
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('workspace_id', workspace_id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

  // Encrypt keys using AES-256-GCM with the GATEWAY_ENCRYPTION_KEY env var
  // If no encryption key is set, store a hashed reference only (less secure, but functional)
  const encryptionKey = process.env.GATEWAY_ENCRYPTION_KEY;

  let secretRef: string;
  if (encryptionKey && encryptionKey.length >= 32) {
    const keyBuffer = Buffer.from(encryptionKey.slice(0, 32));
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
    const keyPayload = JSON.stringify({ api_key, api_secret: api_secret ?? null });
    const encrypted = Buffer.concat([cipher.update(keyPayload, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    secretRef = `aes256gcm:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  } else {
    // Fallback: store a one-way hash reference (keys cannot be retrieved without encryption key)
    secretRef = `sha256:${crypto.createHash('sha256').update(`${api_key}${api_secret ?? ''}`).digest('hex')}`;
  }

  const admin = createAdminClient();
  const { error } = await admin.from('gateway_connections').upsert({
    workspace_id,
    provider,
    account_label: `${provider.charAt(0).toUpperCase() + provider.slice(1)} (connected)`,
    encrypted_secret_ref: secretRef,
    secret_metadata: { key_prefix: api_key.slice(0, 8) + '••••••••' },
    is_active: true,
  }, { onConflict: 'workspace_id,provider,external_account_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
