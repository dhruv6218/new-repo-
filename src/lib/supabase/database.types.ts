export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Row = Record<string, unknown>;
type Tables = { Row: Row; Insert: Row; Update: Row; Relationships: [] };

type Profile = {
  Row: { id: string; display_name: string | null; avatar_url: string | null; timezone: string; notification_preferences: Json; created_at: string; updated_at: string };
  Insert: { id: string; display_name?: string | null; avatar_url?: string | null; timezone?: string; notification_preferences?: Json };
  Update: Partial<{ display_name: string | null; avatar_url: string | null; timezone: string; notification_preferences: Json }>;
  Relationships: [];
};
type Workspace = {
  Row: { id: string; name: string; slug: string; created_by: string; created_at: string; updated_at: string };
  Insert: { name: string; slug: string; created_by: string };
  Update: Partial<{ name: string; slug: string }>;
  Relationships: [];
};
type WorkspaceMember = {
  Row: { workspace_id: string; user_id: string; role: 'owner' | 'admin' | 'member' | 'viewer'; created_at: string; updated_at: string };
  Insert: { workspace_id: string; user_id: string; role?: 'owner' | 'admin' | 'member' | 'viewer' };
  Update: Partial<{ role: 'owner' | 'admin' | 'member' | 'viewer' }>;
  Relationships: [];
};
type AdminMember = {
  Row: { user_id: string; role: 'admin' | 'super_admin'; created_at: string };
  Insert: { user_id: string; role?: 'admin' | 'super_admin' };
  Update: Partial<{ role: 'admin' | 'super_admin' }>;
  Relationships: [];
};
type Invoice = {
  Row: {
    id: string; workspace_id: string; subscription_id: string | null; invoice_number: string;
    client_name: string; client_email: string; status: 'draft' | 'pending' | 'paid' | 'paused' | 'disputed' | 'void' | 'uncollectible';
    ai_status: 'pending' | 'nudge_sent' | 'escalated' | 'paid'; currency: string;
    subtotal_minor: number; tax_minor: number; total_minor: number; due_at: string | null;
    last_chased_at: string | null; reminder_count: number; paused_at: string | null;
    disputed_at: string | null; paid_at: string | null; provider_invoice_id: string | null;
    created_at: string; updated_at: string;
  };
  Insert: {
    workspace_id: string; invoice_number: string; client_name: string; client_email: string;
    status?: Invoice['Row']['status']; ai_status?: Invoice['Row']['ai_status']; currency?: string;
    subtotal_minor?: number; tax_minor?: number; total_minor: number; due_at?: string | null;
  };
  Update: Partial<Invoice['Insert']> & { paused_at?: string | null; disputed_at?: string | null; paid_at?: string | null };
  Relationships: [];
};

/** The migration is the source of truth; regenerate this type with `supabase gen types` after applying it. */
export interface Database {
  public: {
    Tables: {
      profiles: Profile;
      workspaces: Workspace;
      workspace_members: WorkspaceMember;
      admin_members: AdminMember;
      plans: Tables;
      subscriptions: Tables;
      usage_counters: Tables;
      invoices: Invoice;
      invoice_payment_links: Tables;
      reminder_logs: Tables;
      gateway_connections: Tables;
      tone_settings: Tables;
      activity_events: Tables;
      consent_records: Tables;
      audit_logs: Tables;
      billing_events: Tables;
      gateway_webhook_events: Tables;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, never>;
  };
}
