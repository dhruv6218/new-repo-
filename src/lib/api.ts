'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Invoice, GatewaySettings, ToneSettings, ActivityItem, AdminUser,
  Account, Signal, Problem, Opportunity, Decision, Artifact, Launch,
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
  ACCOUNTS: 'astrix_accounts',
  SIGNALS: 'astrix_signals',
  PROBLEMS: 'astrix_problems',
  OPPORTUNITIES: 'astrix_opportunities',
  DECISIONS: 'astrix_decisions',
  ARTIFACTS: 'astrix_artifacts',
  LAUNCHES: 'astrix_launches',
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
  const isoDaysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

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

  // ── Accounts ──
  const sampleAccounts: Account[] = [
    { id: genId(), workspace_id: workspaceId, name: 'Acme Corp', domain: 'acme.com', arr: 120000, plan: 'Enterprise', health_score: 82, renewal_date: daysAgo(-60), signal_count: 4 },
    { id: genId(), workspace_id: workspaceId, name: 'TechStart GmbH', domain: 'techstart.de', arr: 48000, plan: 'Pro', health_score: 45, renewal_date: daysAgo(-30), signal_count: 3 },
    { id: genId(), workspace_id: workspaceId, name: 'DataFlow Ltd', domain: 'dataflow.co', arr: 24000, plan: 'Standard', health_score: 30, renewal_date: daysAgo(-90), signal_count: 1 },
    { id: genId(), workspace_id: workspaceId, name: 'InnovateLab', domain: 'innovatelab.com', arr: 36000, plan: 'Pro', health_score: 90, renewal_date: daysAgo(-120), signal_count: 0 },
  ];
  setStorage(KEYS.ACCOUNTS, sampleAccounts);

  // ── Signals ──
  const sampleSignals: Signal[] = [
    { id: genId(), workspace_id: workspaceId, raw_text: 'We really need SAML SSO to integrate with our corporate IDP. Without it, our security team won\'t approve renewal.', normalized_text: 'User is requesting SAML SSO integration to comply with internal security policies.', source_type: 'Support Ticket', severity_label: 'Critical', sentiment_label: 'Negative', product_area: 'Authentication', account_id: sampleAccounts[0].id, created_at: isoDaysAgo(3), accounts: { name: 'Acme Corp', arr: 120000, plan: 'Enterprise' } },
    { id: genId(), workspace_id: workspaceId, raw_text: 'The export to CSV feature is broken. I get a 500 error every time I try to download my reports.', normalized_text: 'CSV export feature is failing with a 500 error.', source_type: 'Email', severity_label: 'High', sentiment_label: 'Negative', product_area: 'Reporting', account_id: sampleAccounts[1].id, created_at: isoDaysAgo(5), accounts: { name: 'TechStart GmbH', arr: 48000, plan: 'Pro' } },
    { id: genId(), workspace_id: workspaceId, raw_text: 'Love the new dashboard layout! Much easier to navigate than the old one.', normalized_text: 'Positive feedback on new dashboard layout.', source_type: 'Manual', severity_label: 'Low', sentiment_label: 'Positive', product_area: 'Core UI', account_id: sampleAccounts[2].id, created_at: isoDaysAgo(7), accounts: { name: 'DataFlow Ltd', arr: 24000, plan: 'Standard' } },
    { id: genId(), workspace_id: workspaceId, raw_text: 'SAML SSO is a dealbreaker for us. We\'re evaluating competitors who offer it out of the box.', normalized_text: 'User is churning due to missing SAML SSO.', source_type: 'Support Ticket', severity_label: 'Critical', sentiment_label: 'Negative', product_area: 'Authentication', account_id: sampleAccounts[0].id, created_at: isoDaysAgo(10), accounts: { name: 'Acme Corp', arr: 120000, plan: 'Enterprise' } },
    { id: genId(), workspace_id: workspaceId, raw_text: 'The API rate limits are too low for our usage. We need at least 10k requests per hour.', normalized_text: 'User requests higher API rate limits.', source_type: 'Email', severity_label: 'Medium', sentiment_label: 'Neutral', product_area: 'API', account_id: sampleAccounts[3].id, created_at: isoDaysAgo(12), accounts: { name: 'InnovateLab', arr: 36000, plan: 'Pro' } },
  ];
  setStorage(KEYS.SIGNALS, sampleSignals);

  // ── Problems ──
  const sampleProblems: Problem[] = [
    { id: genId(), workspace_id: workspaceId, title: 'SAML SSO Integration Missing', description: 'Multiple enterprise accounts are requesting SAML SSO integration. Two accounts have explicitly stated this is a dealbreaker and are evaluating competitors. Combined ARR at risk is significant.', severity: 'Critical', status: 'Active', product_area: 'Authentication', evidence_count: 2, affected_arr: 120000, trend: 'Rising', created_at: isoDaysAgo(8), users: { full_name: 'AI Cluster Engine' } },
    { id: genId(), workspace_id: workspaceId, title: 'CSV Export 500 Error', description: 'Users are experiencing a 500 error when attempting to export reports to CSV. This is blocking a core workflow.', severity: 'High', status: 'Active', product_area: 'Reporting', evidence_count: 1, affected_arr: 48000, trend: 'Stable', created_at: isoDaysAgo(6), users: { full_name: 'AI Cluster Engine' } },
    { id: genId(), workspace_id: workspaceId, title: 'API Rate Limits Too Low', description: 'Pro plan users are hitting API rate limits. Requests for higher limits (10k/hr).', severity: 'Medium', status: 'Active', product_area: 'API', evidence_count: 1, affected_arr: 36000, trend: 'Stable', created_at: isoDaysAgo(11), users: { full_name: 'AI Cluster Engine' } },
  ];
  setStorage(KEYS.PROBLEMS, sampleProblems);

  // ── Opportunities ──
  const sampleOpportunities: Opportunity[] = [
    { id: genId(), workspace_id: workspaceId, problem_id: sampleProblems[0].id, opportunity_score: 92, demand_score: 85, pain_score: 90, arr_score: 95, trend_score: 80, recommended_action: 'Build', problems: sampleProblems[0] },
    { id: genId(), workspace_id: workspaceId, problem_id: sampleProblems[1].id, opportunity_score: 78, demand_score: 70, pain_score: 75, arr_score: 65, trend_score: 60, recommended_action: 'Fix', problems: sampleProblems[1] },
    { id: genId(), workspace_id: workspaceId, problem_id: sampleProblems[2].id, opportunity_score: 64, demand_score: 60, pain_score: 50, arr_score: 55, trend_score: 50, recommended_action: 'Review', problems: sampleProblems[2] },
  ];
  setStorage(KEYS.OPPORTUNITIES, sampleOpportunities);

  // ── Decisions ──
  const sampleDecisions: Decision[] = [
    { id: genId(), workspace_id: workspaceId, opportunity_id: sampleOpportunities[0].id, problem_id: sampleProblems[0].id, title: 'SAML SSO Integration Missing', action: 'Build', rationale: 'Two enterprise accounts representing $120k ARR have flagged this as a dealbreaker. One is actively evaluating competitors. Building SAML SSO will prevent churn and unlock upsell to other enterprise prospects.', author_id: 'demo-user', created_at: isoDaysAgo(5), users: { full_name: 'Sarah Johnson' } },
    { id: genId(), workspace_id: workspaceId, opportunity_id: sampleOpportunities[1].id, problem_id: sampleProblems[1].id, title: 'CSV Export 500 Error', action: 'Fix', rationale: 'Core workflow is broken for Pro users. Quick fix — likely a server-side null reference in the export endpoint. Should be patched within 24 hours.', author_id: 'demo-user', created_at: isoDaysAgo(4), users: { full_name: 'Sarah Johnson' } },
  ];
  setStorage(KEYS.DECISIONS, sampleDecisions);

  // ── Artifacts ──
  const sampleArtifacts: Artifact[] = [
    { id: genId(), workspace_id: workspaceId, decision_id: sampleDecisions[0].id, title: 'Decision Memo: SAML SSO', type: 'decision_memo', content: '# Decision Memo: SAML SSO Integration\n\n## Context\nTwo enterprise accounts (Acme Corp, TechStart GmbH) have flagged missing SAML SSO as a dealbreaker. Combined ARR at risk: $168k.\n\n## Decision\n**Build** SAML SSO integration in Q1.\n\n## Rationale\n- 2 critical signals from enterprise accounts\n- 1 account actively evaluating competitors\n- SAML SSO is table-stakes for enterprise security compliance\n- Estimated effort: 3-4 engineering weeks\n\n## Success Metrics\n- Zero churn from enterprise accounts post-launch\n- 2+ new enterprise deals unlocked within 90 days\n- NPS improvement from enterprise segment', author_id: 'demo-user', created_at: isoDaysAgo(5), updated_at: isoDaysAgo(5), users: { full_name: 'Sarah Johnson' }, decisions: { title: 'SAML SSO Integration Missing' } },
  ];
  setStorage(KEYS.ARTIFACTS, sampleArtifacts);

  // ── Launches ──
  const sampleLaunches: Launch[] = [
    { id: genId(), workspace_id: workspaceId, decision_id: sampleDecisions[1].id, title: 'CSV Export 500 Error Fix', action: 'Fix', launched_at: isoDaysAgo(3), created_by: 'demo-user', expected_outcome: 'Eliminate 500 errors on CSV export. Reduce support tickets to zero within 7 days.', before_count: 12, after_count: 2, pm_verdict: 'Partially Solved', notes: 'Fixed the primary null reference, but a secondary edge case with large datasets (>10k rows) still fails. Will address in follow-up.' },
  ];
  setStorage(KEYS.LAUNCHES, sampleLaunches);
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
    list: async (): Promise<ActivityItem[]> => {
      return getStorage<ActivityItem[]>(KEYS.ACTIVITY, []);
    },
  },

  admin: {
    listUsers: async (): Promise<AdminUser[]> => {
      return getStorage<AdminUser[]>(KEYS.ADMIN_USERS, []);
    },
    updateUser: async (id: string, data: Partial<AdminUser>): Promise<void> => {
      const users = getStorage<AdminUser[]>(KEYS.ADMIN_USERS, []);
      const idx = users.findIndex(u => u.id === id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...data };
        setStorage(KEYS.ADMIN_USERS, users);
        triggerUpdate();
      }
    },
    addCredits: async (id: string, credits: number): Promise<void> => {
      const users = getStorage<AdminUser[]>(KEYS.ADMIN_USERS, []);
      const idx = users.findIndex(u => u.id === id);
      if (idx !== -1) {
        users[idx].credits_used = Math.max(0, users[idx].credits_used - credits);
        setStorage(KEYS.ADMIN_USERS, users);
        triggerUpdate();
      }
    },
  },

  // ─── Accounts ──────────────────────────────────────────────────────────────
  accounts: {
    list: async (wsId: string): Promise<Account[]> => {
      return getStorage<Account[]>(KEYS.ACCOUNTS, []).filter(a => a.workspace_id === wsId);
    },
    create: async (data: Omit<Account, 'id' | 'signal_count'>): Promise<Account> => {
      const accounts = getStorage<Account[]>(KEYS.ACCOUNTS, []);
      const newAcc: Account = { ...data, id: genId(), signal_count: 0 };
      accounts.push(newAcc);
      setStorage(KEYS.ACCOUNTS, accounts);
      triggerUpdate();
      return newAcc;
    },
  },

  // ─── Signals ───────────────────────────────────────────────────────────────
  signals: {
    list: async (wsId: string): Promise<Signal[]> => {
      return getStorage<Signal[]>(KEYS.SIGNALS, []).filter(s => s.workspace_id === wsId);
    },
    create: async (data: Omit<Signal, 'id' | 'created_at'>): Promise<Signal> => {
      const signals = getStorage<Signal[]>(KEYS.SIGNALS, []);
      const newSig: Signal = { ...data, id: genId(), created_at: new Date().toISOString() };
      signals.push(newSig);
      setStorage(KEYS.SIGNALS, signals);
      triggerUpdate();
      return newSig;
    },
  },

  // ─── Problems ──────────────────────────────────────────────────────────────
  problems: {
    list: async (wsId: string): Promise<Problem[]> => {
      return getStorage<Problem[]>(KEYS.PROBLEMS, []).filter(p => p.workspace_id === wsId);
    },
    create: async (data: Omit<Problem, 'id' | 'created_at' | 'evidence_count' | 'affected_arr' | 'trend' | 'status' | 'users'>): Promise<Problem> => {
      const problems = getStorage<Problem[]>(KEYS.PROBLEMS, []);
      const newProb: Problem = {
        ...data,
        id: genId(),
        status: 'Active',
        evidence_count: 0,
        affected_arr: 0,
        trend: 'Stable',
        created_at: new Date().toISOString(),
      };
      problems.push(newProb);
      setStorage(KEYS.PROBLEMS, problems);
      triggerUpdate();
      return newProb;
    },
  },

  // ─── Opportunities ─────────────────────────────────────────────────────────
  opportunities: {
    list: async (wsId: string): Promise<Opportunity[]> => {
      return getStorage<Opportunity[]>(KEYS.OPPORTUNITIES, []).filter(o => o.workspace_id === wsId);
    },
  },

  // ─── Decisions ─────────────────────────────────────────────────────────────
  decisions: {
    list: async (wsId: string): Promise<Decision[]> => {
      return getStorage<Decision[]>(KEYS.DECISIONS, []).filter(d => d.workspace_id === wsId);
    },
    create: async (data: Omit<Decision, 'id' | 'created_at' | 'users'>): Promise<Decision> => {
      const decisions = getStorage<Decision[]>(KEYS.DECISIONS, []);
      const newDec: Decision = { ...data, id: genId(), created_at: new Date().toISOString(), users: null };
      decisions.push(newDec);
      setStorage(KEYS.DECISIONS, decisions);
      triggerUpdate();
      return newDec;
    },
  },

  // ─── Artifacts ─────────────────────────────────────────────────────────────
  artifacts: {
    list: async (wsId: string): Promise<Artifact[]> => {
      return getStorage<Artifact[]>(KEYS.ARTIFACTS, []).filter(a => a.workspace_id === wsId);
    },
    create: async (data: Omit<Artifact, 'id' | 'created_at' | 'updated_at' | 'users'>): Promise<Artifact> => {
      const artifacts = getStorage<Artifact[]>(KEYS.ARTIFACTS, []);
      const now = new Date().toISOString();
      const newArt: Artifact = { ...data, id: genId(), created_at: now, updated_at: now, users: null };
      artifacts.push(newArt);
      setStorage(KEYS.ARTIFACTS, artifacts);
      triggerUpdate();
      return newArt;
    },
    update: async (id: string, data: Partial<Artifact>): Promise<void> => {
      const artifacts = getStorage<Artifact[]>(KEYS.ARTIFACTS, []);
      const idx = artifacts.findIndex(a => a.id === id);
      if (idx !== -1) {
        artifacts[idx] = { ...artifacts[idx], ...data, updated_at: new Date().toISOString() };
        setStorage(KEYS.ARTIFACTS, artifacts);
        triggerUpdate();
      }
    },
  },

  // ─── Launches ───────────────────────────────────────────────────────────────
  launches: {
    list: async (wsId: string): Promise<Launch[]> => {
      return getStorage<Launch[]>(KEYS.LAUNCHES, []).filter(l => l.workspace_id === wsId);
    },
    create: async (data: Omit<Launch, 'id'>): Promise<Launch> => {
      const launches = getStorage<Launch[]>(KEYS.LAUNCHES, []);
      const newLaunch: Launch = { ...data, id: genId() };
      launches.push(newLaunch);
      setStorage(KEYS.LAUNCHES, launches);
      triggerUpdate();
      return newLaunch;
    },
    update: async (id: string, data: Partial<Launch>): Promise<void> => {
      const launches = getStorage<Launch[]>(KEYS.LAUNCHES, []);
      const idx = launches.findIndex(l => l.id === id);
      if (idx !== -1) {
        launches[idx] = { ...launches[idx], ...data };
        setStorage(KEYS.LAUNCHES, launches);
        triggerUpdate();
      }
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

// ─── New Hooks ───────────────────────────────────────────────────────────────
export const useAccounts = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return [];
    return api.accounts.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading };
};

export const useAccount = (id?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!id) return null;
    const accounts = await api.accounts.list('');
    const account = accounts.find(a => a.id === id);
    if (!account) return null;
    const signals = await api.signals.list('');
    const accountSignals = signals.filter(s => s.account_id === id);
    const problems = await api.problems.list('');
    return { account, signals: accountSignals, problems };
  }, [id]);
  return { data, isLoading };
};

export const useSignals = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return [];
    return api.signals.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading };
};

export const useProblems = (wsId?: string) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId) return [];
    return api.problems.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading, refetch };
};

export const useProblem = (id?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!id) return null;
    const problems = await api.problems.list('');
    const problem = problems.find(p => p.id === id);
    if (!problem) return null;
    const signals = await api.signals.list('');
    const problemSignals = signals.filter(s => s.product_area === problem.product_area);
    const accounts = await api.accounts.list('');
    const problemAccounts = accounts.filter(a => problemSignals.some(s => s.account_id === a.id));
    return { problem, signals: problemSignals, accounts: problemAccounts };
  }, [id]);
  return { data, isLoading };
};

export const useOpportunities = (wsId?: string) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId) return [];
    return api.opportunities.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading, refetch };
};

export const useOpportunity = (id?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!id) return null;
    const opps = await api.opportunities.list('');
    return opps.find(o => o.id === id) || null;
  }, [id]);
  return { data, isLoading };
};

export const useDecisions = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return [];
    return api.decisions.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading };
};

export const useDecision = (id?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!id) return null;
    const decisions = await api.decisions.list('');
    return decisions.find(d => d.id === id) || null;
  }, [id]);
  return { data, isLoading };
};

export const useArtifacts = (wsId?: string) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId) return [];
    return api.artifacts.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading, refetch };
};

export const useArtifact = (id?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!id) return null;
    const artifacts = await api.artifacts.list('');
    return artifacts.find(a => a.id === id) || null;
  }, [id]);
  return { data, isLoading };
};

export const useLaunches = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return [];
    return api.launches.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading };
};
