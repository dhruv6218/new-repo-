import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { verifyRazorpaySignature, verifyStripeSignature } from './payments.ts';

const payload = '{"id":"evt_test"}';
const stripeSecret = 'whsec_test';
const timestamp = Math.floor(Date.now() / 1000);
const stripeSignature = crypto.createHmac('sha256', stripeSecret).update(`${timestamp}.${payload}`).digest('hex');
assert.equal(verifyStripeSignature(payload, `t=${timestamp},v1=${stripeSignature}`, stripeSecret), true);
assert.equal(verifyStripeSignature(payload, `t=${timestamp},v1=invalid`, stripeSecret), false);
assert.equal(verifyStripeSignature(payload, `t=${timestamp - 301},v1=${stripeSignature}`, stripeSecret), false);
assert.equal(verifyRazorpaySignature(payload, crypto.createHmac('sha256', 'rzp_test').update(payload).digest('hex'), 'rzp_test'), true);
assert.equal(verifyRazorpaySignature(payload, 'invalid', 'rzp_test'), false);
