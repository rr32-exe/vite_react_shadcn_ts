/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import worker from '../workers/worker';

describe('Worker status smoke', () => {
  it('reports YOCO and Supabase configuration', async () => {
    const req = new Request('https://example.com/api/status', { method: 'GET' });
    const env = {
      YOCO_SECRET_KEY: 'sk_test_abc',
      YOCO_API_URL: 'https://api.yoco.com',
      YOCO_WEBHOOK_SECRET: 'whsec_test_abc',
      SUPABASE_SERVICE_ROLE_KEY: 'svc_key',
      SUPABASE_URL: 'https://db.example'
    } as any;

    const res = await (worker as any).fetch(req, env);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.yoco).toBeTruthy();
    expect(json.yoco.configured).toBe(true);
    expect(json.yoco.webhookConfigured).toBe(true);
    expect(json.supabase.configured).toBe(true);
  });
});
