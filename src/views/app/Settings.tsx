'use client';

import React, { useEffect, useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  User, Bell, CreditCard, ShieldAlert, Sparkles, 
  AlertTriangle, LogOut, Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { api, NotificationPreferences } from '../../lib/api';

type SettingsTab = 'profile' | 'billing' | 'notifications' | 'agency' | 'danger';

export const Settings = () => {
  const { user, signOut } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const { activeWorkspace, updateWorkspaceName } = useWorkspace();

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    payment_received: true, reminder_sent: true, invoice_dispute: true, weekly_summary: false,
  });
  const [billing, setBilling] = useState<{ plan: { code: string; name: string }; subscription: { status: string } | null; limits: { recoveries: number | null } | null } | null>(null);

  const fullName = typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : 'User';
  const email = user?.email || 'user@example.com';
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  useEffect(() => {
    if (!user || !activeWorkspace) return;
    if (activeWorkspace.id === 'ws-demo-astrix') {
      queueMicrotask(() => {
        setDisplayName(fullName);
        setBusinessName(activeWorkspace.name);
        setIsLoading(false);
      });
      return;
    }
    api.settings.get(user.id).then(settings => {
      setDisplayName(settings.display_name || fullName);
      setBusinessName(activeWorkspace.name);
      setPreferences(settings.notification_preferences);
    }).catch(error => addToast(error instanceof Error ? error.message : 'Could not load settings.', 'error'))
      .finally(() => setIsLoading(false));
  }, [user, activeWorkspace, fullName, addToast]);

  useEffect(() => {
    if (!user || activeTab !== 'billing' || activeWorkspace?.id === 'ws-demo-astrix') return;
    fetch('/api/billing/status').then(async response => {
      if (!response.ok) throw new Error('Could not load billing status.');
      return response.json() as Promise<typeof billing>;
    }).then(setBilling).catch(error => addToast(error instanceof Error ? error.message : 'Could not load billing status.', 'error'));
  }, [user, activeTab, activeWorkspace, addToast]);

  const saveProfile = async () => {
    if (!user || !activeWorkspace) return;
    setIsSaving(true);
    try {
      if (activeWorkspace.id === 'ws-demo-astrix') {
        await updateWorkspaceName(businessName.trim() || activeWorkspace.name);
      } else {
        await api.settings.save(user.id, { display_name: displayName, business_name: businessName, notification_preferences: preferences });
        if (businessName.trim() && businessName.trim() !== activeWorkspace.name) await updateWorkspaceName(businessName);
      }
      addToast('Profile updated.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Could not save profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const saveNotifications = async (next: NotificationPreferences) => {
    setPreferences(next);
    if (!user || activeWorkspace?.id === 'ws-demo-astrix') return;
    try {
      await api.settings.save(user.id, { display_name: displayName, business_name: businessName, notification_preferences: next });
      addToast('Notification preferences updated.', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Could not save notification preferences.', 'error');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone and all data will be lost.")) {
      setIsDeleting(true);
      setTimeout(() => {
        addToast("Account deletion mockup. (Backend not connected)", "success");
        setIsDeleting(false);
      }, 1500);
    }
  };

  const handleManageSubscription = () => {
    addToast("Redirecting to Stripe Billing Portal... (Mockup)", "success");
  };

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'agency', label: 'Team & Agency', icon: Sparkles, color: 'text-brand-blue hover:bg-blue-50 hover:text-blue-700' },
    { id: 'danger', label: 'Danger Zone', icon: ShieldAlert, color: 'text-red-500 hover:bg-red-50 hover:text-red-600' },
  ] as const;

  return (
    <AppLayout 
      title="Settings" 
      subtitle="Manage your account, billing, and preferences."
    >
      <div className="flex flex-col md:flex-row gap-8 animate-[fadeIn_0.3s_ease-out]">
        
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="space-y-1 bg-white border border-gray-200 rounded-2xl p-2 shadow-sm">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? tab.id === 'danger' ? 'bg-red-50 text-red-600' : 'bg-gray-900 text-white shadow-sm'
                    : ('color' in tab ? tab.color : undefined) || 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-astrix-teal/20 border border-astrix-teal/30 flex items-center justify-center text-astrix-teal font-bold text-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-gray-900 truncate">{fullName}</div>
              <div className="text-xs text-gray-500 truncate">{email}</div>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 min-w-0 space-y-6">
          
          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="font-heading text-lg font-bold text-gray-900">Profile Information</h2>
                <p className="text-sm text-gray-500 mt-1">Update your personal and business details.</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Full Name</label>
                    <input type="text" value={displayName} onChange={event => setDisplayName(event.target.value)} disabled={isLoading} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-blue transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Email Address</label>
                    <input type="email" defaultValue={email} disabled className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-500 outline-none cursor-not-allowed" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Business Name</label>
                  <input type="text" value={businessName} onChange={event => setBusinessName(event.target.value)} disabled={isLoading} placeholder="e.g. Acme Design Studio" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-blue transition-all" />
                </div>
                <div className="flex justify-end pt-4">
                  <button onClick={saveProfile} disabled={isLoading || isSaving} className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-black transition-colors shadow-sm disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BILLING */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-xl overflow-hidden relative">
                <div className="absolute right-0 top-0 h-full w-48 bg-gradient-to-l from-brand-blue/20 to-transparent"></div>
                <div className="p-6 md:p-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-brand-yellow" />
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Current Plan</span>
                    </div>
                    <h2 className="font-heading text-3xl font-black text-white mb-2">{billing?.plan.name ?? 'Hook'} Plan</h2>
                    <p className="text-gray-400 text-sm">
                      {billing?.subscription ? `Subscription ${billing.subscription.status}.` : '3 free automated recoveries per month.'}
                    </p>
                  </div>
                  <button onClick={() => router.push('/pricing')} className="w-full md:w-auto bg-brand-blue text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg text-sm whitespace-nowrap">
                    Upgrade to Solo � $29/mo
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-gray-900">Subscription & Billing</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your active subscription and payment methods.</p>
                  </div>
                </div>
                <div className="p-6">
                  <button 
                    onClick={handleManageSubscription}
                    className="flex items-center gap-2 text-sm font-bold text-brand-blue hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl"
                  >
                    <CreditCard className="w-4 h-4" /> Manage Billing
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="font-heading text-lg font-bold text-gray-900">Notification Preferences</h2>
                <p className="text-sm text-gray-500 mt-1">Control how and when we alert you.</p>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { label: 'Payment received alert', desc: 'Get notified instantly when a client pays via 1-Click Checkout.', checked: preferences.payment_received },
                  { label: 'AI Reminder sent confirmation', desc: 'Daily digest of emails the AI sent on your behalf.', checked: preferences.reminder_sent },
                  { label: 'Invoice dispute alert', desc: 'If a client replies to a reminder with a dispute or question.', checked: preferences.invoice_dispute },
                  { label: 'Weekly recovery summary', desc: 'A Monday morning report of your metrics.', checked: preferences.weekly_summary },
                ].map((item, i) => (
                  <button key={i} type="button" onClick={() => void saveNotifications({ ...preferences, [(['payment_received', 'reminder_sent', 'invoice_dispute', 'weekly_summary'] as const)[i]]: !item.checked })} className="w-full flex items-start justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer group text-left">
                    <div className="pr-4">
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand-blue transition-colors">{item.label}</h4>
                      <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                    </div>
                    <div className="pt-1">
                      <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${item.checked ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${item.checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
                      </div>
                    </div>
                    </button>
                ))}
              </div>
            </div>
          )}

          {/* TEAM & AGENCY */}
          {activeTab === 'agency' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden relative">
                {/* Lock Overlay for non-agency plans */}
                <div className="absolute inset-0 bg-white/40 z-10 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 shadow-sm border border-blue-200">
                    <Sparkles className="w-6 h-6 text-brand-blue" />
                  </div>
                  <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">Agency Features Locked</h3>
                  <p className="text-sm text-gray-600 max-w-md mb-6">Upgrade to the Agency plan to invite team members, setup custom domains, and configure white-label branding.</p>
                  <button onClick={() => router.push('/pricing')} className="bg-brand-blue text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm">
                    Upgrade to Agency
                  </button>
                </div>

                <div className="px-6 py-5 border-b border-gray-100 select-none">
                  <h2 className="font-heading text-lg font-bold text-gray-900">Team & Agency Settings</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage your team members and white-label branding.</p>
                </div>
                
                <div className="p-6 space-y-8 select-none pointer-events-none">
                  {/* Invite Team */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Invite Team Members</h3>
                    <div className="flex gap-3">
                      <input type="email" placeholder="colleague@agency.com" className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none" disabled />
                      <button className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm" disabled>Send Invite</button>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* White-Label Domain */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3">White-Label Domain</h3>
                    <p className="text-xs text-gray-500 mb-3">Serve payment links and client dashboards from your own domain.</p>
                    <div className="flex gap-3">
                      <input type="text" placeholder="e.g. payments.youragency.com" className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none" disabled />
                      <button className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm" disabled>Verify Domain</button>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Custom Branding */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Custom Branding</h3>
                    <p className="text-xs text-gray-500 mb-4">Upload your agency logo and set your primary brand color.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"><Sparkles className="w-5 h-5 text-gray-400" /></div>
                        <span className="text-xs font-bold text-gray-500">Upload Logo</span>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-900 mb-2">Brand Color (Hex)</label>
                        <input type="text" defaultValue="#000000" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none font-mono" disabled />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* DANGER ZONE */}
          {activeTab === 'danger' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="font-heading text-lg font-bold text-gray-900">Danger Zone</h2>
                  <p className="text-sm text-gray-500 mt-1">Irreversible and destructive actions.</p>
                </div>
                <div className="p-6 space-y-6">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-red-50 border border-red-100 rounded-xl">
                    <div>
                      <h4 className="text-sm font-bold text-red-900 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Delete Account
                      </h4>
                      <p className="text-xs text-red-700 mt-1">Permanently delete your account, all invoices, and AI training data. This cannot be undone.</p>
                    </div>
                    <button 
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isDeleting ? 'Deleting...' : <><Trash2 className="w-4 h-4" /> Delete Account</>}
                    </button>
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <button 
                      onClick={handleSignOut}
                      className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-xl w-full sm:w-auto justify-center"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out of all devices
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
