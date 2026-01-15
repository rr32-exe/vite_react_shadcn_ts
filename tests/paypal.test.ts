/// <reference types="vitest" />
/// <reference types="node" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import worker from '../workers/worker';

describe('PayPal POC', () => {
  let originalFetch: any;

  beforeEach(() => {
    originalFetch = (globalThis as any).fetch;
  });

  afterEach(() => {
    (globalThis as any).fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('creates PayPal order and updates order row', async () => {
    // Mock sequence: supabase order insert -> paypal token -> paypal create order -> supabase patch
    const supabaseUrl = 'https://db.example';
    const calls: any[] = [];

    (globalThis as any).fetch = vi.fn(async (url: string, opts: any) => {
      calls.push({ url, opts });
      if (url.toString().endsWith('/rest/v1/orders') && (!opts || opts.method === 'POST')) {
        return { ok: true, json: async () => [{ id: 123 }] } as any;
      }
      if (url.toString().endsWith('/v1/oauth2/token')) {
        return { ok: true, json: async () => ({ access_token: 'tok_x', expires_in: 3600 }) } as any;
      }
      if (url.toString().endsWith('/v2/checkout/orders')) {
        return { ok: true, json: async () => ({ id: 'PAY-ORDER-1', links: [{ rel: 'approve', href: 'https://paypal/approve' }] }) } as any;
      }
      if (url.toString().startsWith('https://db.example/rest/v1/orders?id=eq.')) {
        return { ok: true } as any;
      }
      return { ok: true, json: async () => ({}) } as any;
    });

    const payload = { serviceId: 's1', customerName: 'Alice', customerEmail: 'alice@example.com', successUrl: 'https://example.com/success' };
    const req = new Request('https://example.com/api/create-paypal-order', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const env = { SUPABASE_URL: supabaseUrl, SUPABASE_SERVICE_ROLE_KEY: 'svc', PAYPAL_CLIENT_ID: 'cid', PAYPAL_SECRET: 'sec', PAYPAL_MODE: 'sandbox' } as any;

    const res = await (worker as any).fetch(req, env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.paypalOrderId).toBe('PAY-ORDER-1');
    expect(body.approveUrl).toBe('https://paypal/approve');

    // ensure we attempted to patch the order with paypal_order_id
    const patchCall = calls.find(c => (c.url as string).includes('/rest/v1/orders?id=eq.') && c.opts && c.opts.method === 'PATCH');
    expect(patchCall).toBeTruthy();
  });

  it('verifies PayPal webhook and inserts payment', async () => {
    const supabaseUrl = 'https://db.example';
    const calls: any[] = [];

    (globalThis as any).fetch = vi.fn(async (url: string, opts: any) => {
      calls.push({ url, opts });
      if (url.toString().endsWith('/v1/oauth2/token')) {
        return { ok: true, json: async () => ({ access_token: 'tok_x', expires_in: 3600 }) } as any;
      }
      if (url.toString().endsWith('/v1/notifications/verify-webhook-signature')) {
        return { ok: true, json: async () => ({ verification_status: 'SUCCESS' }) } as any;
      }
      if (url.toString().includes('/rest/v1/payments?paypal_order_id=eq.')) {
        return { ok: true, json: async () => [] } as any;
      }
      if (url.toString().includes('/rest/v1/payments')) {
        return { ok: true, json: async () => [{ id: 1 }] } as any;
      }
      if (url.toString().includes('/rest/v1/orders')) {
        return { ok: true } as any;
      }
      return { ok: true, json: async () => ({}) } as any;
    });

    const payload = { event_type: 'PAYMENT.CAPTURE.COMPLETED', resource: { id: 'CAPTURE-1', amount: { value: '50.00', currency_code: 'USD' }, order_id: 'PAY-ORDER-1' } };
    const req = new Request('https://example.com/api/paypal-webhook', { method: 'POST', headers: { 'content-type': 'application/json', 'paypal-transmission-id': 't1', 'paypal-transmission-sig': 's1', 'paypal-cert-url': 'u', 'paypal-auth-algo': 'algo', 'paypal-transmission-time': 'now' }, body: JSON.stringify(payload) });
    const env = { SUPABASE_URL: supabaseUrl, SUPABASE_SERVICE_ROLE_KEY: 'svc', PAYPAL_CLIENT_ID: 'cid', PAYPAL_SECRET: 'sec', PAYPAL_WEBHOOK_ID: 'wh_1', PAYPAL_MODE: 'sandbox' } as any;

    const res = await (worker as any).fetch(req, env);
    expect(res.status).toBe(200);

    // ensure insert payment call
    const insertCall = calls.find(c => (c.url as string).endsWith('/rest/v1/payments') && c.opts && c.opts.method === 'POST');
    expect(insertCall).toBeTruthy();
    const body = JSON.parse(insertCall.opts.body);
    expect(body[0].paypal_order_id).toBe('PAY-ORDER-1');
    expect(body[0].paypal_transaction_id).toBe('CAPTURE-1');
    expect(body[0].amount).toBe(5000);
  });
});
