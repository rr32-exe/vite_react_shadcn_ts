import { describe, it, expect } from 'vitest';
import { TextEncoder } from 'util';

global.TextEncoder = TextEncoder as any;

import { signJwtForTest, verifyJwtForTest } from './utils/test-jwt';

describe('JWT helpers', () => {
  it('signs and verifies a token', async () => {
    const secret = 'testsecret';
    const token = await signJwtForTest({ role: 'admin' }, secret, 10);
    const payload = await verifyJwtForTest(token, secret);
    expect(payload).toBeTruthy();
    expect(payload.role).toBe('admin');
  });
});