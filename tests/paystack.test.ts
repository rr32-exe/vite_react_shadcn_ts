/// <reference types="vitest" />
/// <reference types="node" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import worker from '../workers/worker';

// Simple unit test for Paystack webhook handling: mocks global.fetch and verifies that
// webhook payload is accepted and that the worker attempts to insert a payment row.

describe('Paystack webhook', () => {
  const PAYSTACK_SECRET = 'test_secret';
  let originalFetch: any;

  beforeEach(() => {
    originalFetch = (globalThis as any).fetch;
  });

  afterEach(() => {
    (globalThis as any).fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('accepts valid webhook and inserts payment', async () => {
    const payload = JSON.stringify({
      event: 'charge.success',
      data: {
        reference: 'ref_test_123',
        id: 'txn_test_123',
        amount: 5000,
        currency: 'ZAR',
        metadata: { order_id: 42 },
        status: 'success'
      }
    });

    // compute HMAC-SHA512 signature using Node's crypto
    const crypto = await import('crypto');
    const sig = crypto.createHmac('sha512', PAYSTACK_SECRET).update(payload).digest('hex');

    const calls: any[] = [];

    // Mock fetch to simulate Supabase responses
    (global as any).fetch = vi.fn(async (url: string, opts: any) => {
      calls.push({ url, opts });
      // Existence check for payments
      if (url.toString().includes('/rest/v1/payments?paystack_reference=eq.')) {
        return { ok: true, json: async () => [] } as any;
      }
      // Insert payments
      if (url.toString().endsWith('/rest/v1/payments')) {
        return { ok: true, json: async () => [{ id: 1 }] } as any;
      }
      // Patch orders
      if (url.toString().startsWith('https://') && url.toString().includes('/rest/v1/orders')) {
        return { ok: true } as any;
      }
      return { ok: true, json: async () => ({}) } as any;
    });

    const req = new Request('https://example.com/api/paystack-webhook', {
      method: 'POST',
      headers: { 'x-paystack-signature': sig, 'content-type': 'application/json' },
      body: payload
    });

    const env = { SUPABASE_URL: 'https://db.example', SUPABASE_SERVICE_ROLE_KEY: 'svc_key', PAYSTACK_WEBHOOK_SECRET: PAYSTACK_SECRET } as any;

    // Call worker.fetch
    const res = await (worker as any).fetch(req, env);
    expect(res.status).toBe(200);

    // ensure we attempted to insert a payment
    const insertCall = calls.find(c => (c.url as string).endsWith('/rest/v1/payments') && c.opts && c.opts.method === 'POST');
    expect(insertCall).toBeTruthy();
    const body = JSON.parse(insertCall.opts.body);
    expect(body[0].paystack_reference).toBe('ref_test_123');
    expect(body[0].paystack_transaction_id).toBe('txn_test_123');
    expect(body[0].amount).toBe(5000);
  });

  it('rejects invalid signature', async () => {
    const payload = JSON.stringify({ event: 'charge.success', data: { reference: 'bad_ref', id: 'bad_id', amount: 1000, status: 'success' } });
    // wrong signature
    const sig = 'deadbeef';

    (global as any).fetch = vi.fn(async (url: string, opts: any) => ({ ok: true, json: async () => [] }) as any);

    const req = new Request('https://example.com/api/paystack-webhook', {
      method: 'POST',
      headers: { 'x-paystack-signature': sig, 'content-type': 'application/json' },
      body: payload
    });

    const env = { SUPABASE_URL: 'https://db.example', SUPABASE_SERVICE_ROLE_KEY: 'svc_key', PAYSTACK_WEBHOOK_SECRET: PAYSTACK_SECRET } as any;
    const res = await (worker as any).fetch(req, env);
    expect(res.status).toBe(400);
  });
});
