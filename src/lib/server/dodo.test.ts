import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { verifyDodoSignature } from './dodo.ts';

const payload = '{"type":"subscription.active","data":{"id":"sub_123"}}';
const webhookSecret = 'dodo_whsec_test123';
const webhookId = 'msg_test123';
const webhookTimestamp = String(Math.floor(Date.now() / 1000));

// Standard webhook signature (base64)
const signaturePayload = `${webhookId}.${webhookTimestamp}.${payload}`;
const validSignature = crypto.createHmac('sha256', webhookSecret).update(signaturePayload).digest('base64');

assert.equal(
  verifyDodoSignature(payload, `v1,${validSignature}`, webhookSecret, webhookId, webhookTimestamp),
  true,
);

assert.equal(
  verifyDodoSignature(payload, validSignature, webhookSecret, webhookId, webhookTimestamp),
  true,
);

// Invalid signature
assert.equal(
  verifyDodoSignature(payload, 'v1,invalid_sig', webhookSecret, webhookId, webhookTimestamp),
  false,
);

// Expired timestamp (> 300s)
const expiredTimestamp = String(Math.floor(Date.now() / 1000) - 305);
const expiredSigPayload = `${webhookId}.${expiredTimestamp}.${payload}`;
const expiredSignature = crypto.createHmac('sha256', webhookSecret).update(expiredSigPayload).digest('base64');
assert.equal(
  verifyDodoSignature(payload, expiredSignature, webhookSecret, webhookId, expiredTimestamp),
  false,
);

// Direct hex HMAC fallback test
const hexSignature = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');
assert.equal(
  verifyDodoSignature(payload, hexSignature, webhookSecret),
  true,
);
