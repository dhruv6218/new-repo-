type Counter = { count: number; resetAt: number };

// Single-instance fallback; use an edge/platform limiter when global coordination is required.
const counters = new Map<string, Counter>();

function clientId(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

export function rateLimit(request: Request, bucket: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const key = `${bucket}:${clientId(request)}`;
  const current = counters.get(key);
  if (!current || current.resetAt <= now) {
    counters.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export function clearRateLimits(): void {
  counters.clear();
}
