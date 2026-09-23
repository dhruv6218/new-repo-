'use client';

import React, { useEffect, useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useToast } from '../../contexts/ToastContext';
import { BarChart3, TrendingUp, DollarSign, Clock, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';

type AnalyticsSummary = {
  totalInvoiced: number;
  totalRecovered: number;
  recoveryRate: number;
  pendingCount: number;
  paidCount: number;
  overdueCount: number;
  avgDaysToPay: number | null;
  remindersLast30Days: number;
};

type MonthPoint = { month: string; invoiced: number; recovered: number; reminders: number };

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value.toLocaleString()}`;
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={`h-2 rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export const Analytics = () => {
  const { activeWorkspace, isWorkspaceInitializing } = useWorkspace();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trend, setTrend] = useState<MonthPoint[]>([]);

  useEffect(() => {
    if (isWorkspaceInitializing || !activeWorkspace) return;
    let isCancelled = false;

    const loadData = async () => {
      if (activeWorkspace.id === 'ws-demo-astrix') {
        if (!isCancelled) {
          setSummary({ totalInvoiced: 24800, totalRecovered: 18600, recoveryRate: 75, pendingCount: 3, paidCount: 12, overdueCount: 2, avgDaysToPay: 8, remindersLast30Days: 27 });
          setTrend([
            { month: 'Apr\'25', invoiced: 3200, recovered: 2100, reminders: 12 },
            { month: 'May\'25', invoiced: 4800, recovered: 3600, reminders: 18 },
            { month: 'Jun\'25', invoiced: 3900, recovered: 2900, reminders: 14 },
            { month: 'Jul\'25', invoiced: 5100, recovered: 4000, reminders: 22 },
            { month: 'Aug\'25', invoiced: 4200, recovered: 3200, reminders: 19 },
            { month: 'Sep\'25', invoiced: 3600, recovered: 2800, reminders: 15 },
          ]);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/analytics?workspace_id=${activeWorkspace.id}`);
        if (!res.ok) throw new Error('Could not load analytics');
        const data = await res.json() as { summary: AnalyticsSummary; monthlyTrend: MonthPoint[] };
        if (!isCancelled) {
          setSummary(data.summary);
          setTrend(data.monthlyTrend);
        }
      } catch (error) {
        if (!isCancelled) {
          addToast(error instanceof Error ? error.message : 'Could not load analytics', 'error');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => { isCancelled = true; };
  }, [activeWorkspace, isWorkspaceInitializing, addToast]);

  const maxInvoiced = Math.max(...trend.map(t => t.invoiced), 1);
  const maxBarHeight = 100; // px

  return (
    <AppLayout title="Analytics" subtitle="Recovery performance & trends">
      <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />) : [
            { icon: DollarSign, label: 'Total Invoiced', value: formatCurrency(summary?.totalInvoiced ?? 0), color: 'text-gray-900', bg: 'bg-gray-50' },
            { icon: CheckCircle2, label: 'Total Recovered', value: formatCurrency(summary?.totalRecovered ?? 0), color: 'text-green-700', bg: 'bg-green-50' },
            { icon: TrendingUp, label: 'Recovery Rate', value: `${summary?.recoveryRate ?? 0}%`, color: 'text-brand-blue', bg: 'bg-blue-50' },
            { icon: Clock, label: 'Avg Days to Pay', value: summary?.avgDaysToPay != null ? `${summary.avgDaysToPay} days` : '—', color: 'text-purple-700', bg: 'bg-purple-50' },
          ].map((card, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className={`inline-flex p-2 rounded-xl ${card.bg} mb-3`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className={`text-2xl font-black font-heading ${card.color} mb-0.5`}>{card.value}</div>
              <div className="text-xs text-gray-500 font-medium">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Status Breakdown + Reminders */}
        {!isLoading && summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-heading font-bold text-gray-900 mb-4">Invoice Status</h3>
              <div className="space-y-4">
                {[
                  { label: 'Paid', count: summary.paidCount, color: 'bg-green-500', textColor: 'text-green-700' },
                  { label: 'Pending', count: summary.pendingCount, color: 'bg-amber-400', textColor: 'text-amber-700' },
                  { label: 'Overdue', count: summary.overdueCount, color: 'bg-red-500', textColor: 'text-red-700' },
                ].map(({ label, count, color, textColor }) => {
                  const total = summary.paidCount + summary.pendingCount + summary.overdueCount;
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-bold text-gray-700">{label}</span>
                        <span className={`font-black ${textColor}`}>{count}</span>
                      </div>
                      <MiniBar value={count} max={total} color={color} />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-heading font-bold text-gray-900 mb-4">AI Activity (Last 30 Days)</h3>
              <div className="flex flex-col items-center justify-center h-28 gap-2">
                <div className="w-16 h-16 bg-brand-blue/10 rounded-2xl flex items-center justify-center">
                  <Mail className="w-8 h-8 text-brand-blue" />
                </div>
                <div className="text-3xl font-black font-heading text-brand-blue">{summary.remindersLast30Days}</div>
                <div className="text-xs text-gray-500 font-medium">AI reminders sent</div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Bar Chart */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-heading font-bold text-gray-900">6-Month Recovery Trend</h3>
              <p className="text-xs text-gray-500 mt-0.5">Invoiced vs Recovered by month</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-200 inline-block" /> Invoiced</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-blue inline-block" /> Recovered</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 text-gray-400 animate-spin" /></div>
          ) : trend.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <BarChart3 className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No data yet — add invoices to see trends</p>
            </div>
          ) : (
            <div className="flex items-end justify-between gap-2 h-36 px-2">
              {trend.map(point => {
                const invoicedH = maxInvoiced > 0 ? Math.round((point.invoiced / maxInvoiced) * maxBarHeight) : 0;
                const recoveredH = maxInvoiced > 0 ? Math.round((point.recovered / maxInvoiced) * maxBarHeight) : 0;
                return (
                  <div key={point.month} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="relative w-full flex items-end justify-center gap-1" style={{ height: `${maxBarHeight}px` }}>
                      {/* Tooltip */}
                      <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                        <div>Invoiced: {formatCurrency(point.invoiced)}</div>
                        <div>Recovered: {formatCurrency(point.recovered)}</div>
                        <div>Reminders: {point.reminders}</div>
                      </div>
                      <div className="w-2/5 bg-gray-100 rounded-t-md transition-all" style={{ height: `${invoicedH}px` }} />
                      <div className="w-2/5 bg-brand-blue rounded-t-md transition-all" style={{ height: `${recoveredH}px` }} />
                    </div>
                    <span className="text-xs text-gray-400 font-medium">{point.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Empty state hint */}
        {!isLoading && summary && summary.totalInvoiced === 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-brand-blue shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-gray-900 mb-1">No invoice data yet</h4>
              <p className="text-sm text-gray-600">Add your first invoice to start seeing recovery analytics and trends here.</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Analytics;
