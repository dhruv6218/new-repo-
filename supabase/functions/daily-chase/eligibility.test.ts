import assert from 'node:assert/strict';
import { isReminderEligible } from './eligibility.ts';

const now = new Date('2026-09-23T12:00:00Z');
const base = { status: 'pending', due_at: '2026-09-20T12:00:00Z', last_chased_at: null };
assert.equal(isReminderEligible(base, now, 3), true);
assert.equal(isReminderEligible({ ...base, paused_at: '2026-09-21T00:00:00Z' }, now, 3), false);
assert.equal(isReminderEligible({ ...base, last_chased_at: '2026-09-22T00:00:00Z' }, now, 3), false);
assert.equal(isReminderEligible({ ...base, status: 'paid' }, now, 3), false);
