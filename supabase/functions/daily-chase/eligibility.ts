export type ReminderCandidate = {
  status: string;
  due_at: string | null;
  paused_at?: string | null;
  disputed_at?: string | null;
  paid_at?: string | null;
  last_chased_at: string | null;
};

export function isReminderEligible(invoice: ReminderCandidate, now: Date, intervalDays: number): boolean {
  if (invoice.status !== 'pending' || !invoice.due_at || new Date(invoice.due_at) > now) return false;
  if (invoice.paused_at || invoice.disputed_at || invoice.paid_at) return false;
  const cutoff = now.getTime() - intervalDays * 86_400_000;
  return !invoice.last_chased_at || new Date(invoice.last_chased_at).getTime() <= cutoff;
}
