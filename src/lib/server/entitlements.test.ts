import assert from 'node:assert/strict';
import { checkUsageLimit } from './entitlements.ts';

assert.equal(checkUsageLimit('hook', 'recoveries', { metric: 'recoveries', quantity: 2 }).allowed, true);
assert.equal(checkUsageLimit('hook', 'recoveries', { metric: 'recoveries', quantity: 3 }).allowed, false);
assert.equal(checkUsageLimit('solo', 'recoveries', { metric: 'recoveries', quantity: 999 }).allowed, true);
assert.equal(checkUsageLimit('unknown', 'recoveries', { metric: 'recoveries', quantity: 0 }).reason, 'unknown_plan');
assert.equal(checkUsageLimit('hook', 'recoveries', { metric: 'recoveries', quantity: 0 }, 0).reason, 'invalid_usage');
