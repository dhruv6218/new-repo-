export type InvoiceStatus = 'pending' | 'paid' | 'paused' | 'disputed';
export type AIStatus = 'nudge_sent' | 'escalated' | 'pending' | 'paid';
export type GatewayType = 'stripe' | 'razorpay' | 'dodo' | 'upi' | 'custom';
export type PlanType = 'Hook' | 'Solo' | 'Agency';

export interface Invoice {
  id: string;
  workspace_id: string;
  client_name: string;
  client_email: string;
  amount: number;
  currency: string;
  due_date: string;
  status: InvoiceStatus;
  ai_status: AIStatus;
  last_chased_at: string | null;
  reminder_count: number;
  days_overdue: number;
  created_at: string;
}

export interface ReminderLog {
  id: string;
  invoice_id: string;
  sent_at: string;
  email_content: string;
  tone_level: number;
  decline_reason?: string;
}

export interface GatewaySettings {
  id: string;
  workspace_id: string;
  type: GatewayType;
  label: string;
  api_key?: string;
  static_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface InvoicePaymentLink {
  id: string;
  invoice_id: string;
  provider: Extract<GatewayType, 'stripe' | 'razorpay'>;
  external_id: string;
  url: string;
  amount: number;
  currency: string;
  status: 'active' | 'paid' | 'expired';
  created_at: string;
}

export interface GatewayWebhookEvent {
  id: string;
  provider: Extract<GatewayType, 'stripe' | 'razorpay'>;
  event_id: string;
  payload: Record<string, unknown>;
  received_at: string;
}

export interface ToneSettings {
  workspace_id: string;
  sample_emails: string;
  tone_level: number;
  ai_prompt: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  logo_url: string | null;
  plan: PlanType;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  plan: PlanType;
  credits_used: number;
  status: 'active' | 'suspended' | 'blocked';
  created_at: string;
  invoice_count: number;
  total_recovered: number;
}

export interface ActivityItem {
  id: string;
  type: 'reminder_sent' | 'payment_received' | 'invoice_created' | 'ai_action' | 'paused' | 'escalated';
  message: string;
  timestamp: string;
  amount?: number;
}

export interface DashboardMetrics {
  total_recovered: number;
  currently_outstanding: number;
  active_chases: number;
  recovery_rate: number;
  pending_invoices: number;
  this_month_recovered: number;
}

export interface Account {
  id: string;
  workspace_id: string;
  name: string;
  domain?: string | null;
  arr: number;
  plan?: string | null;
  health_score?: string | number | null;
  renewal_date?: string | null;
  signal_count?: number;
}

export interface Signal {
  id: string;
  workspace_id: string;
  raw_text: string;
  normalized_text?: string | null;
  source_type: string;
  severity_label: string;
  sentiment_label?: string | null;
  product_area?: string | null;
  account_id?: string | null;
  created_at: string;
  accounts?: { name: string; arr?: number; plan?: string } | null;
}

export interface Problem {
  id: string;
  workspace_id: string;
  title: string;
  description?: string | null;
  severity: string;
  status: string;
  product_area?: string | null;
  evidence_count: number;
  affected_arr: number;
  trend: string;
  created_at: string;
  users?: { full_name?: string | null } | null;
}

export interface Opportunity {
  id: string;
  workspace_id: string;
  problem_id: string;
  opportunity_score: number;
  demand_score: number;
  pain_score: number;
  arr_score: number;
  trend_score: number;
  recommended_action: string;
  problems?: Problem;
}

export interface Decision {
  id: string;
  workspace_id: string;
  opportunity_id?: string | null;
  problem_id?: string | null;
  title: string;
  action: string;
  rationale: string;
  author_id: string;
  created_at: string;
  users?: { full_name?: string | null } | null;
}

export interface Artifact {
  id: string;
  workspace_id: string;
  decision_id: string;
  title: string;
  type: string;
  content: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  users?: { full_name?: string | null } | null;
  decisions?: { title?: string | null } | null;
}

export interface Launch {
  id: string;
  workspace_id: string;
  decision_id: string;
  title: string;
  action: string;
  launched_at: string;
  created_by: string;
  expected_outcome?: string | null;
  before_count?: number | null;
  after_count?: number | null;
  pm_verdict?: string | null;
  notes?: string | null;
}
