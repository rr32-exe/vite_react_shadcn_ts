/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import worker from '../workers/worker';

describe('Worker status smoke', () => {
  it('reports Paystack and Supabase configuration and mode', async () => {
    const req = new Request('https://example.com/api/status', { method: 'GET' });
    const env = {
      PAYSTACK_SECRET_KEY: 'sk_test_abc',
      PAYSTACK_WEBHOOK_SECRET: 'whsec_test_abc',
      PAYSTACK_MODE: 'test',
      SUPABASE_SERVICE_ROLE_KEY: 'svc_key',
      SUPABASE_URL: 'https://db.example'
    } as any;

    const res = await (worker as any).fetch(req, env);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.paystack).toBeTruthy();
    expect(json.paystack.configured).toBe(true);
    expect(json.paystack.webhookConfigured).toBe(true);
    expect(json.paystack.mode).toBe('test');
    expect(json.supabase.configured).toBe(true);
  });
});
