#!/usr/bin/env node
/**
 * Create a PayPal webhook for the given URL and print the webhook ID.
 * Usage (env vars):
 *   PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_MODE (sandbox|live), WEBHOOK_URL
 * Example:
 *   PAYPAL_CLIENT_ID=... PAYPAL_SECRET=... PAYPAL_MODE=sandbox WEBHOOK_URL=https://yoursub.workers.dev/api/paypal-webhook node scripts/create-paypal-webhook.js
 */

async function fetchAccessToken(clientId, secret, base) {
  const creds = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const resp = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const body = await resp.json();
  if (!resp.ok) throw new Error(`Failed to get access token: ${JSON.stringify(body)}`);
  return body.access_token;
}

async function createWebhook(token, base, webhookUrl) {
  const body = {
    url: webhookUrl,
    event_types: [
      { name: 'CHECKOUT.ORDER.APPROVED' },
      { name: 'CHECKOUT.ORDER.COMPLETED' },
      { name: 'PAYMENT.CAPTURE.COMPLETED' },
      { name: 'PAYMENT.CAPTURE.DENIED' },
      { name: 'PAYMENT.AUTHORIZATION.VOIDED' }
    ]
  };
  const resp = await fetch(`${base}/v1/notifications/webhooks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const respBody = await resp.json();
  if (!resp.ok) throw new Error(`Failed to create webhook: ${JSON.stringify(respBody)}`);
  return respBody;
}

async function run() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  const mode = (process.env.PAYPAL_MODE || 'sandbox').toLowerCase();
  const webhookUrl = process.env.WEBHOOK_URL || process.env.CF_WORKER_URL && `${process.env.CF_WORKER_URL}/api/paypal-webhook`;

  if (!clientId || !secret) {
    console.error('Missing PAYPAL_CLIENT_ID or PAYPAL_SECRET in environment.');
    process.exit(1);
  }
  if (!webhookUrl) {
    console.error('Missing WEBHOOK_URL. Set WEBHOOK_URL or CF_WORKER_URL to point to your deployed worker.');
    process.exit(1);
  }

  const base = mode === 'live' ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';
  console.log(`Using PayPal base: ${base}`);

  try {
    const token = await fetchAccessToken(clientId, secret, base);
    console.log('Obtained access token (redacted).');
    const result = await createWebhook(token, base, webhookUrl);
    const webhookId = result.id || result.webhook_id || (result.webhook && result.webhook.id) || null;
    console.log('Created webhook:', JSON.stringify(result, null, 2));
    if (webhookId) {
      console.log('\nWebhook ID:', webhookId);
      console.log('\nTo store this in your Worker secrets run:');
      console.log(`  printf "%s" "${webhookId}" | wrangler secret put PAYPAL_WEBHOOK_ID --raw`);
    } else {
      console.warn('Could not find webhook id in PayPal response. Inspect the printed response above.');
    }
  } catch (err) {
    console.error('Error creating PayPal webhook:', err.message || err);
    process.exit(1);
  }
}

run();
