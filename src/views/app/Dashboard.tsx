'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { 
  TrendingUp, DollarSign, AlertCircle, Zap, Activity,
  Send, Bot, FileText, ChevronRight, UploadCloud, CreditCard
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import type { ActivityItem, DashboardMetrics } from '../../types';
import { Skeleton } from '../../components/ui/Skeleton';

const formatCurrency = (value: number, currency = 'USD') => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
};

export const Dashboard = () => {
  const { user } = useAuth();
  const { activeWorkspace, isWorkspaceInitializing } = useWorkspace();
  const { addToast } = useToast();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fullName = typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '';
  const firstName = fullName.split(' ')[0] || 'there';

  useEffect(() => {
    if (isWorkspaceInitializing) return;
    let cancelled = false;
    if (!activeWorkspace) {
      queueMicrotask(() => {
        if (!cancelled) {
          setMetrics(null);
          setActivities([]);
          setIsLoading(false);
        }
      });
      return;
    }
    queueMicrotask(() => {
      if (!cancelled) {
        setIsLoading(true);
        setError(null);
      }
    });
    api.dashboard.get(activeWorkspace.id).then(result => {
      if (!cancelled) {
        setMetrics(result.metrics);
        setActivities(result.activities);
      }
    }).catch(reason => {
      if (!cancelled) {
        setMetrics(null);
        setActivities([]);
        setError(reason instanceof Error ? reason.message : 'Could not load dashboard data.');
        addToast('Could not load dashboard data.', 'error');
      }
    }).finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [activeWorkspace, isWorkspaceInitializing, addToast]);


  if (isLoading) {
    return (
      <AppLayout title={`Welcome back, ${firstName}.`} subtitle="Loading your recovery dashboard...">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title={`Welcome back, ${firstName}.`} 
      subtitle={activeWorkspace?.id === 'ws-demo-astrix' ? "Here's your revenue recovery overview (demo mode)." : "Here's your revenue recovery overview."}
    >
      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
      <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
        
        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-green-100 rounded-xl"><DollarSign className="w-4 h-4 text-green-600" /></div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Total Recovered</span>
              </div>
              <div className="text-3xl font-heading font-black text-gray-900">{formatCurrency(metrics?.total_recovered || 0)}</div>
              <div className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +{formatCurrency(metrics?.this_month_recovered || 0)} this month
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-50 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-red-100 rounded-xl"><AlertCircle className="w-4 h-4 text-red-500" /></div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Outstanding</span>
              </div>
              <div className="text-3xl font-heading font-black text-gray-900">{formatCurrency(metrics?.currently_outstanding || 0)}</div>
              <div className="text-xs text-gray-500 font-bold mt-2">{metrics?.pending_invoices} invoices awaiting payment</div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-teal-50 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-teal-100 rounded-xl"><Zap className="w-4 h-4 text-astrix-teal" /></div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Recovery Rate</span>
              </div>
              <div className="text-3xl font-heading font-black text-astrix-teal">{metrics?.recovery_rate}%</div>
              <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-astrix-teal h-1.5 rounded-full" style={{ width: `${metrics?.recovery_rate}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-100 rounded-xl"><Activity className="w-4 h-4 text-brand-blue" /></div>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Active Chases</span>
              </div>
              <div className="text-3xl font-heading font-black text-gray-900">{metrics?.active_chases}</div>
              <div className="text-xs text-brand-blue font-bold mt-2 flex items-center gap-1">
                <Bot className="w-3 h-3" />                 Demo activity preview
              </div>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Activity Feed */}
          <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-heading text-base font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-blue" /> Activity Feed
              </h2>
              <span className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live
              </span>
            </div>
            <div className="divide-y divide-gray-50 max-h-[380px] overflow-y-auto">
              {activities.map(activity => (
                <div key={activity.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    activity.type === 'payment_received' ? 'bg-green-100' :
                    activity.type === 'reminder_sent' ? 'bg-blue-100' :
                    activity.type === 'ai_action' ? 'bg-purple-100' : 'bg-gray-100'
                  }`}>
                    {activity.type === 'payment_received' ? <DollarSign className="w-5 h-5 text-green-600" /> :
                     activity.type === 'reminder_sent' ? <Send className="w-5 h-5 text-blue-600" /> :
                     activity.type === 'ai_action' ? <Bot className="w-5 h-5 text-purple-600" /> :
                     <FileText className="w-5 h-5 text-gray-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium leading-snug">{activity.message}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">{activity.timestamp}</span>
                      {activity.amount && (
                        <span className="text-xs font-bold text-gray-600">{formatCurrency(activity.amount)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* AI Engine Status Card */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-astrix-teal/10 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Daily Chase Engine</span>
                  </div>
                </div>
                <h3 className="font-heading text-lg font-bold text-white mb-1">Demo chase activity</h3>
                <p className="text-sm text-gray-400 mb-5">No automated messages are sent from this demo.</p>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-gray-500">
                    <span>Last run</span><span className="text-white font-bold">Today 9:00 AM</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Reminders sent</span><span className="text-green-400 font-bold">3 today</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Guardrail</span><span className="text-astrix-teal font-bold">3-5 day gap active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => router.push('/app/invoices')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left group"
                >
                  <div className="p-1.5 bg-brand-blue/10 rounded-lg group-hover:bg-brand-blue/20 transition-colors">
                    <UploadCloud className="w-4 h-4 text-brand-blue" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Manage Invoices</div>
                    <div className="text-[11px] text-gray-400">View and import invoices</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                </button>
                <button 
                  onClick={() => router.push('/app/tone')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left group"
                >
                  <div className="p-1.5 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <Bot className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Train AI Tone</div>
                    <div className="text-[11px] text-gray-400">Customize your voice</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                </button>
                <button 
                  onClick={() => router.push('/app/gateways')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left group"
                >
                  <div className="p-1.5 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <CreditCard className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Connect Gateway</div>
                    <div className="text-[11px] text-gray-400">Stripe, Razorpay, UPI</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
