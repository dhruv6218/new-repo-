import assert from 'node:assert/strict';
import { adminErrorStatus } from './auth-boundaries.ts';

assert.equal(adminErrorStatus('Authentication required'), 401);
assert.equal(adminErrorStatus('Admin access required'), 403);
assert.equal(adminErrorStatus('Admin authorization unavailable'), 403);
