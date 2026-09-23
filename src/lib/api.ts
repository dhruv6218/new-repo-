'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Invoice, GatewaySettings, ToneSettings, ActivityItem, AdminUser, DashboardMetrics,
} from '../types';
import { createSupabaseBrowserClient } from './supabase/client';

// ─── Storage Keys ───────────────────────────────────────────────────────────
const KEYS = {
  INVOICES: 'astrix_invoices',
  GATEWAYS: 'astrix_gateways',
  TONE: 'astrix_tone_settings',
  ACTIVITY: 'astrix_activity',
  WORKSPACE: 'astrix_demo_workspace',
  ADMIN_USERS: 'astrix_admin_users',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const genId = () => Math.random().toString(36).substring(2, 15);

const getStorage = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const setStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage error:', e);
  }
};

export const triggerUpdate = () => window.dispatchEvent(new Event('data-updated'));

const isDemoWorkspace = (workspaceId: string) => workspaceId === 'ws-demo-astrix';
const supabaseClient = () => createSupabaseBrowserClient();
const invoiceNumber = () => `INV-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
type GatewayRow = {
  id: string; workspace_id: string; provider: string; account_label: string | null;
  secret_metadata: Record<string, unknown>; is_active: boolean; created_at: string;
};
type ToneRow = {
  workspace_id: string; settings: Record<string, unknown>; updated_at: string;
};
type ActivityRow = {
  id: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
};
export type NotificationPreferences = {
  payment_received: boolean;
  reminder_sent: boolean;
  invoice_dispute: boolean;
  weekly_summary: boolean;
};
export type ProfileSettings = {
  display_name: string;
  business_name: string;
  notification_preferences: NotificationPreferences;
};
const mapSupabaseInvoice = (row: {
  id: string; workspace_id: string; client_name: string; client_email: string; currency: string;
  total_minor: number; due_at: string | null; status: string; ai_status: Invoice['ai_status'];
  last_chased_at: string | null; reminder_count: number; created_at: string;
}): Invoice => {
  const due = row.due_at ? new Date(row.due_at) : null;
  const daysOverdue = due ? Math.max(0, Math.floor((Date.now() - due.getTime()) / 86400000)) : 0;
  return {
    id: row.id, workspace_id: row.workspace_id, client_name: row.client_name, client_email: row.client_email,
    amount: row.total_minor / 100, currency: row.currency, due_date: row.due_at ?? '',
      status: row.status === 'paid' || row.status === 'paused' || row.status === 'disputed' ? row.status : 'pending',
      ai_status: row.ai_status, last_chased_at: row.last_chased_at,
    reminder_count: row.reminder_count, days_overdue: row.status === 'paid' ? 0 : daysOverdue, created_at: row.created_at,
  };
};

// ─── Seed Data ────────────────────────────────────────────────────────────────
export const initializeWorkspace = (workspaceId: string) => {
  const existing = getStorage<Invoice[]>(KEYS.INVOICES, []);
  if (existing.length > 0) return;

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString().split('T')[0];

  const sampleInvoices: Invoice[] = [
    { id: genId(), workspace_id: workspaceId, client_name: 'Acme Corp', client_email: 'billing@acme.com', amount: 2400, currency: 'USD', due_date: daysAgo(14), status: 'pending', ai_status: 'nudge_sent', last_chased_at: daysAgo(4), reminder_count: 2, days_overdue: 14, created_at: daysAgo(20) },
    { id: genId(), workspace_id: workspaceId, client_name: 'TechStart GmbH', client_email: 'finance@techstart.de', amount: 1800, currency: 'EUR', due_date: daysAgo(18), status: 'pending', ai_status: 'escalated', last_chased_at: daysAgo(3), reminder_count: 3, days_overdue: 18, created_at: daysAgo(25) },
    { id: genId(), workspace_id: workspaceId, client_name: 'DataFlow Ltd', client_email: 'accounts@dataflow.co', amount: 890, currency: 'USD', due_date: daysAgo(10), status: 'pending', ai_status: 'pending', last_chased_at: null, reminder_count: 0, days_overdue: 10, created_at: daysAgo(15) },
    { id: genId(), workspace_id: workspaceId, client_name: 'InnovateLab', client_email: 'pay@innovatelab.com', amount: 1500, currency: 'USD', due_date: daysAgo(30), status: 'paid', ai_status: 'paid', last_chased_at: daysAgo(10), reminder_count: 1, days_overdue: 0, created_at: daysAgo(35) },
    { id: genId(), workspace_id: workspaceId, client_name: 'CloudScale Inc', client_email: 'ap@cloudscale.io', amount: 3200, currency: 'USD', due_date: daysAgo(25), status: 'paused', ai_status: 'nudge_sent', last_chased_at: daysAgo(5), reminder_count: 2, days_overdue: 25, created_at: daysAgo(30) },
    { id: genId(), workspace_id: workspaceId, client_name: 'DesignPro Studio', client_email: 'hello@designpro.io', amount: 4500, currency: 'USD', due_date: daysAgo(7), status: 'pending', ai_status: 'nudge_sent', last_chased_at: daysAgo(2), reminder_count: 1, days_overdue: 7, created_at: daysAgo(12) },
  ];
  setStorage(KEYS.INVOICES, sampleInvoices);

  const sampleGateways: GatewaySettings[] = [
    { id: genId(), workspace_id: workspaceId, type: 'stripe', label: 'Stripe', api_key: 'sk_demo_****', is_active: true, created_at: new Date().toISOString() },
  ];
  setStorage(KEYS.GATEWAYS, sampleGateways);

  const sampleActivity: ActivityItem[] = [
    { id: genId(), type: 'reminder_sent', message: 'AI sent a friendly nudge to Acme Corp for Invoice #1042', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), amount: 2400 },
    { id: genId(), type: 'payment_received', message: 'Payment received from InnovateLab — Invoice cleared', timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), amount: 1500 },
    { id: genId(), type: 'escalated', message: 'AI escalated TechStart GmbH to Level 2 (Firm tone)', timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: genId(), type: 'invoice_created', message: 'New invoice added for DataFlow Ltd', timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), amount: 890 },
    { id: genId(), type: 'reminder_sent', message: 'AI sent 2nd reminder to CloudScale Inc', timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), amount: 3200 },
  ];
  setStorage(KEYS.ACTIVITY, sampleActivity);

  const sampleAdminUsers: AdminUser[] = [
    { id: genId(), email: 'sarah@freelance.com', full_name: 'Sarah Johnson', plan: 'Solo', credits_used: 12, status: 'active', created_at: daysAgo(45), invoice_count: 8, total_recovered: 18400 },
    { id: genId(), email: 'mike@agency.co', full_name: 'Mike Chen', plan: 'Agency', credits_used: 5, status: 'active', created_at: daysAgo(30), invoice_count: 24, total_recovered: 67200 },
    { id: genId(), email: 'raj@indie.dev', full_name: 'Raj Patel', plan: 'Hook', credits_used: 3, status: 'active', created_at: daysAgo(10), invoice_count: 3, total_recovered: 4200 },
    { id: genId(), email: 'anna@studio.com', full_name: 'Anna Mueller', plan: 'Solo', credits_used: 0, status: 'suspended', created_at: daysAgo(60), invoice_count: 0, total_recovered: 0 },
  ];
  setStorage(KEYS.ADMIN_USERS, sampleAdminUsers);
};

// ─── Invoice API ──────────────────────────────────────────────────────────────
export const api = {
  invoices: {
    list: async (wsId: string): Promise<Invoice[]> => {
      if (!isDemoWorkspace(wsId)) {
        const { data, error } = await supabaseClient().from('invoices').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return (data ?? []).map(mapSupabaseInvoice);
      }
      return getStorage<Invoice[]>(KEYS.INVOICES, []).filter(i => i.workspace_id === wsId);
    },
    create: async (data: Omit<Invoice, 'id' | 'created_at' | 'ai_status' | 'last_chased_at' | 'reminder_count' | 'days_overdue'>): Promise<Invoice> => {
      if (!isDemoWorkspace(data.workspace_id)) {
        const amountMinor = Math.round(data.amount * 100);
        const { data: created, error } = await supabaseClient().from('invoices').insert({
          workspace_id: data.workspace_id, invoice_number: invoiceNumber(), client_name: data.client_name,
          client_email: data.client_email, currency: data.currency.toUpperCase(), total_minor: amountMinor,
          subtotal_minor: amountMinor, due_at: new Date(data.due_date).toISOString(), status: data.status,
        }).select('*').single();
        if (error || !created) throw new Error(error?.message || 'Could not create invoice.');
        triggerUpdate();
        return mapSupabaseInvoice(created);
      }
      const invoices = getStorage<Invoice[]>(KEYS.INVOICES, []);
      const dueDate = new Date(data.due_date);
      const today = new Date();
      const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / 86400000));
      const newInvoice: Invoice = {
        ...data,
        id: genId(),
        ai_status: 'pending',
        last_chased_at: null,
        reminder_count: 0,
        days_overdue: daysOverdue,
        created_at: new Date().toISOString(),
      };
      invoices.push(newInvoice);
      setStorage(KEYS.INVOICES, invoices);

      const activity = getStorage<ActivityItem[]>(KEYS.ACTIVITY, []);
      activity.unshift({ id: genId(), type: 'invoice_created', message: `New invoice added for ${data.client_name}`, timestamp: new Date().toISOString(), amount: data.amount });
      setStorage(KEYS.ACTIVITY, activity.slice(0, 20));

      triggerUpdate();
      return newInvoice;
    },
    update: async (id: string, data: Partial<Invoice>): Promise<void> => {
      const localInvoice = getStorage<Invoice[]>(KEYS.INVOICES, []).find(invoice => invoice.id === id);
      if (!localInvoice) {
        const update: { status?: Invoice['status']; paused_at?: string | null } = {};
        if (data.status) update.status = data.status;
        if (data.status === 'paused') update.paused_at = new Date().toISOString();
        if (data.status === 'pending') update.paused_at = null;
        const { error } = await supabaseClient().from('invoices').update(update).eq('id', id);
        if (error) throw new Error(error.message);
        triggerUpdate();
        return;
      }
      const invoices = getStorage<Invoice[]>(KEYS.INVOICES, []);
      const idx = invoices.findIndex(i => i.id === id);
      if (idx !== -1) {
        invoices[idx] = { ...invoices[idx], ...data };
        setStorage(KEYS.INVOICES, invoices);
        triggerUpdate();
      }
    },
  },

  gateways: {
    list: async (wsId: string): Promise<GatewaySettings[]> => {
      if (!isDemoWorkspace(wsId)) {
        const { data, error } = await supabaseClient().from('gateway_connections').select('*').eq('workspace_id', wsId).order('created_at', { ascending: true });
        if (error) throw new Error(error.message);
        return ((data ?? []) as GatewayRow[]).map(row => ({
          id: row.id,
          workspace_id: row.workspace_id,
          type: row.provider === 'other' ? 'custom' : row.provider,
          label: row.account_label || row.provider,
          static_url: typeof row.secret_metadata?.url === 'string' ? row.secret_metadata.url : undefined,
          is_active: row.is_active,
          created_at: row.created_at,
        } as GatewaySettings));
      }
      return getStorage<GatewaySettings[]>(KEYS.GATEWAYS, []).filter(g => g.workspace_id === wsId);
    },
    create: async (data: Omit<GatewaySettings, 'id' | 'created_at'>): Promise<GatewaySettings> => {
      if (!isDemoWorkspace(data.workspace_id)) {
        const provider = data.type === 'custom' || data.type === 'upi' ? 'other' : data.type;
        const metadata = data.static_url ? { url: data.static_url } : {};
        const { data: created, error } = await supabaseClient().from('gateway_connections').upsert({
          workspace_id: data.workspace_id,
          provider,
          account_label: data.label,
          encrypted_secret_ref: 'pending-server-connection',
          secret_metadata: metadata,
          is_active: data.is_active,
        }, { onConflict: 'workspace_id,provider,external_account_id' }).select('*').single();
        if (error || !created) throw new Error(error?.message || 'Could not save gateway connection.');
        triggerUpdate();
        const saved = created as GatewayRow;
        return {
          id: saved.id, workspace_id: saved.workspace_id,
          type: saved.provider === 'other' ? 'custom' : saved.provider as GatewaySettings['type'],
          label: saved.account_label || saved.provider,
          static_url: typeof saved.secret_metadata.url === 'string' ? saved.secret_metadata.url : undefined,
          is_active: saved.is_active, created_at: saved.created_at,
        } as GatewaySettings;
      }
      const gateways = getStorage<GatewaySettings[]>(KEYS.GATEWAYS, []);
      const newGw: GatewaySettings = { ...data, id: genId(), created_at: new Date().toISOString() };
      gateways.push(newGw);
      setStorage(KEYS.GATEWAYS, gateways);
      triggerUpdate();
      return newGw;
    },
    remove: async (id: string): Promise<void> => {
      const localGateways = getStorage<GatewaySettings[]>(KEYS.GATEWAYS, []);
      if (localGateways.some(gateway => gateway.id === id)) {
        setStorage(KEYS.GATEWAYS, localGateways.filter(gateway => gateway.id !== id));
        triggerUpdate();
        return;
      }
      const { error } = await supabaseClient().from('gateway_connections').update({ is_active: false }).eq('id', id);
      if (!error) {
        triggerUpdate();
        return;
      }
      throw new Error(error.message);
    },
  },

  tone: {
    get: async (wsId: string): Promise<ToneSettings | null> => {
      if (!isDemoWorkspace(wsId)) {
        const { data, error } = await supabaseClient().from('tone_settings').select('*').eq('workspace_id', wsId).maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) return null;
        const settings = (data as ToneRow).settings;
        const tone = data as ToneRow;
        return {
          workspace_id: tone.workspace_id,
          sample_emails: typeof settings.sample_emails === 'string' ? settings.sample_emails : '',
          tone_level: typeof settings.tone_level === 'number' ? settings.tone_level : 2,
          ai_prompt: typeof settings.ai_prompt === 'string' ? settings.ai_prompt : '',
          updated_at: tone.updated_at,
        };
      }
      const settings = getStorage<ToneSettings | null>(KEYS.TONE, null);
      return settings?.workspace_id === wsId ? settings : null;
    },
    save: async (data: ToneSettings): Promise<void> => {
      if (!isDemoWorkspace(data.workspace_id)) {
        const { error } = await supabaseClient().from('tone_settings').upsert({
          workspace_id: data.workspace_id,
          tone: data.tone_level === 1 ? 'friendly' : data.tone_level === 3 ? 'firm' : 'professional',
          settings: {
            sample_emails: data.sample_emails,
            tone_level: data.tone_level,
            ai_prompt: data.ai_prompt,
          },
        }, { onConflict: 'workspace_id' });
        if (error) throw new Error(error.message);
        triggerUpdate();
        return;
      }
      setStorage(KEYS.TONE, { ...data, updated_at: new Date().toISOString() });
      triggerUpdate();
    },
  },

  activity: {
    list: async (wsId?: string): Promise<ActivityItem[]> => {
      if (wsId && !isDemoWorkspace(wsId)) {
        const { data, error } = await supabaseClient().from('activity_events').select('*').eq('workspace_id', wsId).order('created_at', { ascending: false }).limit(20);
        if (error) throw new Error(error.message);
        return (data as ActivityRow[] ?? []).map(row => {
          const metadata = row.metadata;
          return {
            id: row.id,
            type: (row.event_type === 'payment_received' ? 'payment_received' : row.event_type === 'reminder_sent' ? 'reminder_sent' : row.event_type === 'invoice_created' ? 'invoice_created' : 'ai_action') as ActivityItem['type'],
            message: typeof metadata.message === 'string' ? metadata.message : row.event_type.replace(/_/g, ' '),
            timestamp: row.created_at,
            amount: typeof metadata.amount === 'number' ? metadata.amount : undefined,
          };
        });
      }
      return getStorage<ActivityItem[]>(KEYS.ACTIVITY, []);
    },
  },

  dashboard: {
    get: async (wsId: string): Promise<{ metrics: DashboardMetrics; activities: ActivityItem[] }> => {
      if (isDemoWorkspace(wsId)) {
        const invoices = getStorage<Invoice[]>(KEYS.INVOICES, []).filter(i => i.workspace_id === wsId);
        const recovered = invoices.filter(i => i.status === 'paid').reduce((sum, invoice) => sum + invoice.amount, 0);
        const outstanding = invoices.filter(i => i.status !== 'paid').reduce((sum, invoice) => sum + invoice.amount, 0);
        return {
          metrics: {
            total_recovered: recovered, currently_outstanding: outstanding,
            active_chases: invoices.filter(i => i.status === 'pending').length,
            recovery_rate: invoices.length ? Math.round((invoices.filter(i => i.status === 'paid').length / invoices.length) * 100) : 0,
            pending_invoices: invoices.filter(i => i.status === 'pending').length,
            this_month_recovered: recovered,
          },
          activities: getStorage<ActivityItem[]>(KEYS.ACTIVITY, []).slice(0, 20),
        };
      }
      const [invoiceResult, activityResult] = await Promise.all([
        supabaseClient().from('invoices').select('status,total_minor,created_at,paid_at').eq('workspace_id', wsId),
        api.activity.list(wsId),
      ]);
      if (invoiceResult.error) throw new Error(invoiceResult.error.message);
      const invoices = (invoiceResult.data ?? []) as Array<{
        status: string;
        total_minor: number;
        created_at: string;
        paid_at: string | null;
      }>;
      const paid = invoices.filter((invoice) => invoice.status === 'paid');
      const pending = invoices.filter((invoice) => invoice.status === 'pending' || invoice.status === 'paused' || invoice.status === 'disputed');
      const totalRecovered = paid.reduce((sum: number, invoice) => sum + Number(invoice.total_minor) / 100, 0);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonthRecovered = paid
        .filter((invoice) => {
          if (!invoice.paid_at) return false;
          const paidDate = new Date(invoice.paid_at);
          return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
        })
        .reduce((sum: number, invoice) => sum + Number(invoice.total_minor) / 100, 0);

      return {
        metrics: {
          total_recovered: totalRecovered,
          currently_outstanding: pending.reduce((sum: number, invoice) => sum + Number(invoice.total_minor) / 100, 0),
          active_chases: invoices.filter((invoice) => invoice.status === 'pending').length,
          recovery_rate: invoices.length ? Math.round((paid.length / invoices.length) * 100) : 0,
          pending_invoices: pending.length,
          this_month_recovered: thisMonthRecovered,
        },
        activities: activityResult,
      };
    },
  },

  settings: {
    get: async (userId: string): Promise<ProfileSettings> => {
      const { data, error } = await supabaseClient().from('profiles').select('display_name,notification_preferences').eq('id', userId).single();
      if (error) throw new Error(error.message);
      const preferences = (data.notification_preferences ?? {}) as Partial<NotificationPreferences>;
      return {
        display_name: data.display_name ?? '',
        business_name: '',
        notification_preferences: {
          payment_received: preferences.payment_received !== false,
          reminder_sent: preferences.reminder_sent !== false,
          invoice_dispute: preferences.invoice_dispute !== false,
          weekly_summary: preferences.weekly_summary === true,
        },
      };
    },
    save: async (userId: string, settings: ProfileSettings): Promise<void> => {
      const { error } = await supabaseClient().from('profiles').update({
        display_name: settings.display_name.trim() || null,
        notification_preferences: settings.notification_preferences,
      }).eq('id', userId);
      if (error) throw new Error(error.message);
    },
  },

  admin: {
    listUsers: async (): Promise<AdminUser[]> => {
      const response = await fetch('/api/admin/users');
      const body = await response.json() as { users?: AdminUser[]; error?: string };
      if (!response.ok) throw new Error(body.error || 'Could not load admin users');
      return body.users || [];
    },
    updateUser: async (id: string, data: Partial<AdminUser>): Promise<void> => {
      const response = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: data.status }) });
      if (!response.ok) throw new Error((await response.json() as { error?: string }).error || 'Could not update user');
    },
    addCredits: async (id: string, credits: number): Promise<void> => {
      throw new Error(`Credits are not available in the production admin API (${id}, ${credits})`);
    },
  },
};

// ─── React Hooks ──────────────────────────────────────────────────────────────
export function useQuery<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetcher();
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo
  }, deps);

  useEffect(() => {
    execute();
    window.addEventListener('data-updated', execute);
    return () => window.removeEventListener('data-updated', execute);
  }, [execute]);

  return { data, isLoading, error, refetch: execute };
}

export const useInvoices = (wsId?: string) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId) return [];
    return api.invoices.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading, refetch };
};

export const useGateways = (wsId?: string) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId) return [];
    return api.gateways.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading, refetch };
};

export const useToneSettings = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return null;
    return api.tone.get(wsId);
  }, [wsId]);
  return { data, isLoading };
};

export const useActivity = () => {
  const { data, isLoading } = useQuery(async () => api.activity.list(), []);
  return { data: data || [], isLoading };
};

export const useAdminUsers = () => {
  const { data, isLoading, refetch } = useQuery(async () => api.admin.listUsers(), []);
  return { data: data || [], isLoading, refetch };
};
