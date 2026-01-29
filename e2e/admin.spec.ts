import { test, expect } from '@playwright/test';

test('admin login and fetch orders via JWT', async ({ request }) => {
  const username = process.env.E2E_ADMIN_USER || 'admin';
  const password = process.env.E2E_ADMIN_PASS || 'password';

  // login
  const loginRes = await request.post('/api/admin/login', { data: { username, password } });
  expect(loginRes.ok()).toBeTruthy();
  const loginJson = await loginRes.json();
  const token = loginJson.token;
  expect(token).toBeTruthy();

  // fetch orders
  const ordersRes = await request.get('/api/admin/orders', { headers: { Authorization: `Bearer ${token}` } });
  expect(ordersRes.ok()).toBeTruthy();
  const ordersJson = await ordersRes.json();
  expect(ordersJson).toHaveProperty('data');

  // fetch CSV and ensure YOCO charge column present
  const csvRes = await request.get('/api/admin/orders.csv', { headers: { Authorization: `Bearer ${token}` } });
  expect(csvRes.ok()).toBeTruthy();
  const csv = await csvRes.text();
  expect(csv.split('\n')[0]).toContain('yoco_charge_id');
});
