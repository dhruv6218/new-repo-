import { NextResponse } from 'next/server';
import { adminErrorStatus, requireAdmin } from '../../../../lib/server/admin';
import { rateLimit } from '../../../../lib/server/rate-limit';

export async function GET(request: Request) {
  if (!rateLimit(request, 'admin-session', 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const result = await requireAdmin();
  if (result.error) {
    return NextResponse.json({ isAdmin: false }, { status: adminErrorStatus(result.error) });
  }
  return NextResponse.json({ isAdmin: true, role: result.admin.role, userId: result.user.id });
}
