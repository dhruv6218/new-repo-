export type PlanCode = 'hook' | 'solo' | 'agency';
export type Entitlement = 'recoveries' | 'invoices' | 'team_members' | 'white_label';

export interface PlanLimits {
  recoveries: number | null;
  invoices: number | null;
  team_members: number;
  white_label: boolean;
}

export interface UsageCounter {
  metric: string;
  quantity: number;
}

export interface EntitlementDecision {
  allowed: boolean;
  limit: number | null;
  used: number;
  remaining: number | null;
  reason?: 'limit_reached' | 'unknown_plan' | 'invalid_usage';
}

const PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  hook: { recoveries: 3, invoices: null, team_members: 1, white_label: false },
  solo: { recoveries: null, invoices: null, team_members: 1, white_label: false },
  agency: { recoveries: null, invoices: null, team_members: 5, white_label: true },
};

export function normalizePlanCode(code: string | null | undefined): PlanCode | null {
  const normalized = code?.trim().toLowerCase();
  return normalized === 'hook' || normalized === 'solo' || normalized === 'agency'
    ? normalized
    : null;
}

export function getPlanLimits(planCode: string | null | undefined): PlanLimits | null {
  const plan = normalizePlanCode(planCode);
  return plan ? PLAN_LIMITS[plan] : null;
}

export function checkUsageLimit(
  planCode: string | null | undefined,
  entitlement: Entitlement,
  usage: UsageCounter | null | undefined,
  increment = 1,
): EntitlementDecision {
  if (!Number.isSafeInteger(increment) || increment < 1 || !usage || !Number.isSafeInteger(usage.quantity) || usage.quantity < 0) {
    return { allowed: false, limit: null, used: 0, remaining: null, reason: 'invalid_usage' };
  }

  const limits = getPlanLimits(planCode);
  if (!limits) {
    return { allowed: false, limit: null, used: usage.quantity, remaining: null, reason: 'unknown_plan' };
  }

  const limit = limits[entitlement];
  if (typeof limit === 'boolean') {
    return { allowed: limit, limit: null, used: usage.quantity, remaining: null, ...(limit ? {} : { reason: 'limit_reached' as const }) };
  }

  if (limit === null) {
    return { allowed: true, limit: null, used: usage.quantity, remaining: null };
  }

  const remaining = Math.max(0, limit - usage.quantity);
  return {
    allowed: usage.quantity + increment <= limit,
    limit,
    used: usage.quantity,
    remaining,
    ...(usage.quantity + increment <= limit ? {} : { reason: 'limit_reached' as const }),
  };
}

export function assertUsageAllowed(
  planCode: string | null | undefined,
  entitlement: Entitlement,
  usage: UsageCounter | null | undefined,
  increment = 1,
): void {
  const decision = checkUsageLimit(planCode, entitlement, usage, increment);
  if (!decision.allowed) {
    throw new Error(`Entitlement denied: ${decision.reason ?? 'feature_unavailable'}`);
  }
}
