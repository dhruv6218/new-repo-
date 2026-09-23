import { NextResponse } from 'next/server';
import { readiness } from '../../../lib/server/health';

export function GET() {
  const result = readiness();
  return NextResponse.json(
    { status: 'ok', ready: result.ready },
    { status: result.ready ? 200 : 503 },
  );
}
