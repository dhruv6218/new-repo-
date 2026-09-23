import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/server/admin';

export async function GET() {
  const result = await requireAdmin();
  if (result.error) {
    return NextResponse.json({ isAdmin: false }, { status: result.error === 'Authentication required' ? 401 : 403 });
  }
  return NextResponse.json({ isAdmin: true, role: result.admin.role, userId: result.user.id });
}
