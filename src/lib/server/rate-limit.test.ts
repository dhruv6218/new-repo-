import assert from 'node:assert/strict';
import { clearRateLimits, rateLimit } from './rate-limit.ts';

clearRateLimits();
const request = new Request('http://localhost', { headers: { 'x-forwarded-for': '127.0.0.1' } });
assert.equal(rateLimit(request, 'test', 1, 60_000), true);
assert.equal(rateLimit(request, 'test', 1, 60_000), false);
clearRateLimits();
