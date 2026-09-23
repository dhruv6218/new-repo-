import { NextRequest, NextResponse } from 'next/server';

const CONSENT_COOKIE = 'astrix_consent';
const CONSENT_TYPES = new Set(['analytics', 'marketing']);
const CONSENT_VERSION = '2026-09-23';

interface ConsentState {
  version: string;
  analytics: boolean;
  marketing: boolean;
  recordedAt: string;
}

function readConsent(request: NextRequest): ConsentState | null {
  const value = request.cookies.get(CONSENT_COOKIE)?.value;
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as ConsentState;
    return parsed.version === CONSENT_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ consent: readConsent(request), version: CONSENT_VERSION });
}

export async function POST(request: NextRequest) {
  let body: { consentType?: unknown; granted?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body.consentType !== 'string' || !CONSENT_TYPES.has(body.consentType) || typeof body.granted !== 'boolean') {
    return NextResponse.json({ error: 'consentType and boolean granted are required' }, { status: 400 });
  }

  const current = readConsent(request) ?? {
    version: CONSENT_VERSION,
    analytics: false,
    marketing: false,
    recordedAt: new Date().toISOString(),
  };
  const consent: ConsentState = {
    ...current,
    [body.consentType]: body.granted,
    recordedAt: new Date().toISOString(),
  };

  const response = NextResponse.json({ consent });
  response.cookies.set(CONSENT_COOKIE, JSON.stringify(consent), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });
  return response;
}
