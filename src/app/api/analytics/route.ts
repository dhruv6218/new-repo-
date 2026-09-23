import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { rateLimit } from '../../../lib/server/rate-limit';

export async function GET(request: Request) {
  if (!rateLimit(request, 'analytics', 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get('workspace_id');
  if (!workspaceId) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });

  // Verify membership
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

  // Run analytics queries in parallel
  const [invoicesResult, remindersResult] = await Promise.all([
    supabase
      .from('invoices')
      .select('status, total_minor, currency, created_at, paid_at, due_at')
      .eq('workspace_id', workspaceId),
    supabase
      .from('reminder_logs')
      .select('sent_at, invoice_id')
      .eq('workspace_id', workspaceId)
      .gte('sent_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const invoices = invoicesResult.data ?? [];
  const reminders = remindersResult.data ?? [];
  const paidInvoices = invoices.filter(inv => inv.status === 'paid' && inv.paid_at);

  // Amounts are stored in minor units (cents) — convert to major units for display
  const toMajor = (minor: number) => minor / 100;
  const totalInvoiced = toMajor(invoices.reduce((s, inv) => s + (Number(inv.total_minor) || 0), 0));
  const totalRecovered = toMajor(paidInvoices.reduce((s, inv) => s + (Number(inv.total_minor) || 0), 0));
  const pendingCount = invoices.filter(inv => inv.status === 'pending').length;
  const paidCount = invoices.filter(inv => inv.status === 'paid').length;
  const overdueCount = invoices.filter(inv => inv.status === 'pending' && inv.due_at && new Date(inv.due_at) < new Date()).length;
  const recoveryRate = invoices.length > 0 ? Math.round((paidCount / invoices.length) * 100) : 0;

  const avgDaysToPay = paidInvoices.length > 0
    ? Math.round(
        paidInvoices.reduce((sum, inv) => {
          const created = new Date(inv.created_at).getTime();
          const paid = new Date(inv.paid_at as string).getTime();
          return sum + (paid - created) / (1000 * 60 * 60 * 24);
        }, 0) / paidInvoices.length,
      )
    : null;

  // Monthly trend — last 6 months
  const monthlyTrend: Array<{ month: string; invoiced: number; recovered: number; reminders: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const monthInvoiced = toMajor(invoices
      .filter(inv => inv.created_at >= monthStart && inv.created_at <= monthEnd)
      .reduce((s, inv) => s + (Number(inv.total_minor) || 0), 0));

    const monthRecovered = toMajor(paidInvoices
      .filter(inv => (inv.paid_at as string) >= monthStart && (inv.paid_at as string) <= monthEnd)
      .reduce((s, inv) => s + (Number(inv.total_minor) || 0), 0));

    const monthReminders = reminders
      .filter(r => (r.sent_at as string) >= monthStart && (r.sent_at as string) <= monthEnd).length;

    monthlyTrend.push({ month: label, invoiced: monthInvoiced, recovered: monthRecovered, reminders: monthReminders });
  }

  return NextResponse.json({
    summary: { totalInvoiced, totalRecovered, recoveryRate, pendingCount, paidCount, overdueCount, avgDaysToPay, remindersLast30Days: reminders.length },
    monthlyTrend,
  });
}
