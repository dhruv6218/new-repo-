'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users, Shield, Activity, AlertTriangle, CheckCircle2,
  Ban, LogIn, LogOut, BarChart3, Mail, Zap,
  TrendingUp, RefreshCw, Loader2, Search, DollarSign,
  Megaphone, ExternalLink, Send
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminUsers, api } from '../../lib/api';
import { AdminUser } from '../../types';
import { useToast } from '../../contexts/ToastContext';

type Tab = 'users' | 'financials' | 'health' | 'announcements';

const ADMIN_NAV = [
  { name: 'User Management', icon: Users, id: 'users' },
  { name: 'Financials', icon: DollarSign, id: 'financials' },
  { name: 'System Health', icon: Activity, id: 'health' },
  { name: 'Announcements', icon: Megaphone, id: 'announcements' },
];

export const AdminDashboard: React.FC = () => {
  const { signOut, user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const { data: adminUsers, isLoading, refetch } = useAdminUsers();
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Announcement state
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [currentAnnouncement, setCurrentAnnouncement] = useState('');

  const handleSignOut = async () => { await signOut(); router.push('/godview'); };

  const handleBlock = async (u: AdminUser) => {
    setProcessingId(u.id);
    await api.admin.updateUser(u.id, { status: u.status === 'blocked' ? 'active' : 'blocked' });
    addToast(`User ${u.status === 'blocked' ? 'unblocked' : 'blocked'} successfully`, 'success');
    refetch(); setProcessingId(null);
  };

  const handleSuspend = async (u: AdminUser) => {
    setProcessingId(u.id);
    await api.admin.updateUser(u.id, { status: u.status === 'suspended' ? 'active' : 'suspended' });
    addToast(`User ${u.status === 'suspended' ? 'reactivated' : 'suspended'} successfully`, 'success');
    refetch(); setProcessingId(null);
  };

  const handleSendAnnouncement = () => {
    if (!announcementMsg.trim()) return;
    setCurrentAnnouncement(announcementMsg);
    setAnnouncementMsg('');
    addToast('Global announcement sent!', 'success');
  };

  const handleClearAnnouncement = () => {
    setCurrentAnnouncement('');
    addToast('Announcement cleared.', 'success');
  };

  const filtered = adminUsers.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalRecovered = adminUsers.reduce((s, u) => s + u.total_recovered, 0);
  const activeUsers = adminUsers.filter(u => u.status === 'active').length;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans selection:bg-brand-blue selection:text-white">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-sidebar-dark border-r border-slate-800 fixed h-full flex flex-col z-50">
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-astrix-teal" />
            <span className="font-heading text-lg font-black tracking-tighter text-white">God View</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {ADMIN_NAV.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === item.id ? 'bg-astrix-teal text-white shadow-md' : 'text-slate-400 hover:bg-sidebar-hover hover:text-white'}`}>
              <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.id ? 'text-white' : 'text-slate-400'}`} />
              {item.name}
            </button>
          ))}
          <div className="pt-4 border-t border-slate-800 mt-4">
            <Link href="/app" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-slate-400 hover:bg-sidebar-hover hover:text-white transition-all">
              <LogIn className="w-4 h-4" /> View App
            </Link>
          </div>
        </nav>
        <div className="p-4 border-t border-slate-800 shrink-0">
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
          <div className="mt-2 px-3">
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-[1200px] mx-auto animate-[fadeIn_0.4s_ease-out]">
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold text-gray-900 mb-1">
              {ADMIN_NAV.find(n => n.id === activeTab)?.name}
            </h1>
            <p className="text-gray-500 text-sm">Astrix AI Admin Dashboard</p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Users', value: adminUsers.length, icon: Users, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
              { label: 'Active', value: activeUsers, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
              { label: 'Total Recovered', value: `$${(totalRecovered / 1000).toFixed(1)}k`, icon: TrendingUp, color: 'text-brand-yellow', bg: 'bg-brand-yellow/20' },
              { label: 'Suspended', value: adminUsers.filter(u => u.status === 'suspended').length, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className={`p-2 ${stat.bg} rounded-lg w-fit mb-3`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-2xl font-heading font-black text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* --- USER MANAGEMENT --- */}
          {activeTab === 'users' && (
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="font-heading text-lg font-bold text-gray-900">All Users</h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 gap-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search users..." className="bg-transparent text-sm text-gray-900 outline-none placeholder-gray-400 w-40" />
                  </div>
                  <button onClick={() => refetch()} className="p-2 text-gray-500 hover:text-gray-900 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-100 bg-gray-50/50">
                      <tr>
                        {['User', 'Plan', 'Status', 'Credits Used', 'Recovered', 'Actions'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filtered.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-bold text-gray-900">{u.full_name}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${u.plan === 'Agency' ? 'bg-purple-50 text-purple-700 border border-purple-200' : u.plan === 'Solo' ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                              {u.plan}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${u.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : u.status === 'suspended' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-mono font-bold text-gray-600">{u.credits_used}</td>
                          <td className="px-5 py-4 font-mono font-bold text-green-600">
                            ${(u.total_recovered / 1000).toFixed(1)}k
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 flex-nowrap">
                              <button onClick={() => handleSuspend(u)} disabled={processingId === u.id} title={u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                                className="p-1.5 bg-gray-50 hover:bg-orange-100 text-gray-500 hover:text-orange-600 rounded-lg border border-gray-200 transition-colors disabled:opacity-50" aria-label={u.status === 'suspended' ? `Reactivate ${u.full_name}` : `Suspend ${u.full_name}`}>
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleBlock(u)} disabled={processingId === u.id} title={u.status === 'blocked' ? 'Unblock' : 'Block'}
                                className="p-1.5 bg-gray-50 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded-lg border border-gray-200 transition-colors disabled:opacity-50" aria-label={u.status === 'blocked' ? `Unblock ${u.full_name}` : `Block ${u.full_name}`}>
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* --- FINANCIALS --- */}
          {activeTab === 'financials' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Total MRR</div>
                  <div className="text-4xl font-heading font-black text-gray-900 mb-2">$841.00</div>
                  <div className="text-sm text-green-600 flex items-center gap-1 font-bold">
                    <TrendingUp className="w-4 h-4" /> +12% this month
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Paid Users</div>
                  <div className="text-4xl font-heading font-black text-gray-900 mb-2">29</div>
                  <div className="text-sm text-gray-500 font-bold">25 Solo, 4 Agency</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Churn Rate</div>
                  <div className="text-4xl font-heading font-black text-gray-900 mb-2">3.4%</div>
                  <div className="text-sm text-red-500 flex items-center gap-1 font-bold">
                    1 user cancelled
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading text-lg font-bold text-gray-900 mb-1">Billing & Invoices</h3>
                  <p className="text-sm text-gray-500">View detailed analytics, process refunds, and manage your SaaS subscriptions.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => addToast('Redirecting to Billing...', 'success')} className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-black transition-colors text-sm shadow-sm">
                    <ExternalLink className="w-4 h-4" /> Manage Billing
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --- SYSTEM HEALTH --- */}
          {activeTab === 'health' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'AI API Tokens (Today)', value: '142,500', limit: '500,000', pct: 28, color: 'bg-brand-blue', icon: Zap },
                  { label: 'Emails Sent (Today)', value: '89', limit: '500', pct: 17, color: 'bg-green-500', icon: Mail },
                  { label: 'Active Chase Jobs', value: '24', limit: '8', pct: 45, color: 'bg-purple-500', icon: Activity },
                ].map((item, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gray-50 rounded-lg"><item.icon className="w-5 h-5 text-gray-500" /></div>
                      <div>
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">{item.label}</div>
                        <div className="text-2xl font-heading font-black text-gray-900">{item.value}</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                      <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.pct}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">Limit: {item.limit}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-heading text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-brand-blue" /> Cost Breakdown (This Month)
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: 'OpenAI API (Tone Cloning + Drafts)', cost: '$18.42', trend: '+5%' },
                      { label: 'Resend (Transactional Email)', cost: '$3.20', trend: '-2%' },
                      { label: 'Vercel (Edge Functions + Cron)', cost: '$9.00', trend: '0%' },
                      { label: 'Cloud Infrastructure & Database', cost: '$25.00', trend: '0%' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-600 font-medium">{item.label}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-gray-400 font-mono">{item.trend}</span>
                          <span className="font-mono font-bold text-gray-900">{item.cost}</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2">
                      <span className="font-bold text-gray-900">Total MRR Cost</span>
                      <span className="font-heading font-black text-brand-yellow text-xl">$55.62</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-heading text-lg font-bold text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" /> Error Logs
                    </h3>
                  </div>
                  <div className="flex-1 p-0 overflow-y-auto max-h-[300px]">
                    <div className="divide-y divide-gray-100">
                      <div className="p-4 bg-red-50/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-red-600">Stripe Webhook Failed</span>
                          <span className="text-xs text-gray-400">12 mins ago</span>
                        </div>
                        <div className="text-sm text-gray-600 font-mono">Error 500: signature verification failed for user_id: 8492.</div>
                      </div>
                      <div className="p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-orange-500">Resend API Rate Limit</span>
                          <span className="text-xs text-gray-400">2 hours ago</span>
                        </div>
                        <div className="text-sm text-gray-600 font-mono">Status 429: Too many requests for batch send. Retrying.</div>
                      </div>
                      <div className="p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-orange-500">Auth Token Timeout</span>
                          <span className="text-xs text-gray-400">Yesterday</span>
                        </div>
                        <div className="text-sm text-gray-600 font-mono">Connection reset by peer during token refresh.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-green-800 text-sm mb-1">All Systems Operational</div>
                  <div className="text-xs text-green-700">Last checked: Just now. Daily Chase Engine is healthy and scheduled for 09:00 UTC.</div>
                </div>
              </div>
            </div>
          )}

          {/* --- ANNOUNCEMENTS --- */}
          {activeTab === 'announcements' && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
                <h2 className="font-heading text-lg font-bold text-gray-900 mb-2">Global Announcement</h2>
                <p className="text-sm text-gray-500 mb-6">Send a notification banner to all active users on their dashboard.</p>
                
                <textarea 
                  value={announcementMsg}
                  onChange={e => setAnnouncementMsg(e.target.value)}
                  placeholder="e.g. We just added a new AI feature! Check it out in Tone Studio."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-brand-blue outline-none resize-none h-32 mb-4 text-sm"
                ></textarea>
                
                <button 
                  onClick={handleSendAnnouncement}
                  disabled={!announcementMsg.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-brand-blue text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm shadow-sm"
                >
                  <Send className="w-4 h-4" /> Broadcast to All Users
                </button>
              </div>

              {currentAnnouncement && (
                <div className="bg-brand-blue/10 border border-brand-blue/20 rounded-2xl p-6 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-brand-blue uppercase tracking-widest mb-2">Currently Active Banner</h3>
                    <p className="text-sm text-gray-900 font-medium">{currentAnnouncement}</p>
                  </div>
                  <button 
                    onClick={handleClearAnnouncement}
                    className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 border border-red-100 hover:bg-red-100 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors"
                  >
                    Clear Active
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
