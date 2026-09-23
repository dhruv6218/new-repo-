import { NextResponse } from 'next/server';
import { adminErrorStatus, createAdminClient, requireAdmin } from '../../../../lib/server/admin';
import { rateLimit } from '../../../../lib/server/rate-limit';

export async function GET(request: Request) {
  if (!rateLimit(request, 'admin-users-read', 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const result = await requireAdmin();
  if (result.error) return NextResponse.json({ error: result.error }, { status: adminErrorStatus(result.error) });

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
    if (error) return NextResponse.json({ error: 'Could not load users' }, { status: 502 });
    return NextResponse.json({
      users: data.users.map(user => ({
        id: user.id,
        email: user.email ?? '',
        full_name: typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : user.email?.split('@')[0] ?? 'User',
        plan: 'Unknown',
        credits_used: 0,
        status: user.banned_until && new Date(user.banned_until) > new Date() ? 'blocked' : 'active',
        created_at: user.created_at,
        invoice_count: 0,
        total_recovered: 0,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Admin service is not configured' }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!rateLimit(request, 'admin-users-write', 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const result = await requireAdmin();
  if (result.error) return NextResponse.json({ error: result.error }, { status: adminErrorStatus(result.error) });
  let body: { id?: unknown; status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (typeof body.id !== 'string' || !['active', 'blocked', 'suspended'].includes(String(body.status))) {
    return NextResponse.json({ error: 'id and a supported status are required' }, { status: 400 });
  }
  if (body.id === result.user.id) return NextResponse.json({ error: 'You cannot change your own access' }, { status: 400 });
  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(body.id, {
      ban_duration: body.status === 'active' ? 'none' : '876000h',
    });
    if (error) return NextResponse.json({ error: 'Could not update user' }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Admin service is not configured' }, { status: 503 });
  }
}
