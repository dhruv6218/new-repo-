import assert from 'node:assert/strict';
import crypto from 'node:crypto';
// @ts-expect-error Node's strip-types runner imports the source file directly.
import { verifyRazorpaySignature, verifyStripeSignature } from './payments.ts';

const payload = '{"id":"evt_test"}';
const stripeSecret = 'whsec_test';
const timestamp = Math.floor(Date.now() / 1000);
const stripeSignature = crypto.createHmac('sha256', stripeSecret).update(`${timestamp}.${payload}`).digest('hex');
assert.equal(verifyStripeSignature(payload, `t=${timestamp},v1=${stripeSignature}`, stripeSecret), true);
assert.equal(verifyRazorpaySignature(payload, crypto.createHmac('sha256', 'rzp_test').update(payload).digest('hex'), 'rzp_test'), true);
