#!/usr/bin/env node

/**
 * YOCO Webhook Tester
 * 
 * This script tests your YOCO webhook endpoint with a properly signed payload.
 * 
 * Usage:
 *   node scripts/test-yoco-webhook.js <worker-url> <webhook-secret> [event-type]
 * 
 * Examples:
 *   node scripts/test-yoco-webhook.js https://services-api.abc123.workers.dev/api/yoco-webhook "your-secret-key"
 *   node scripts/test-yoco-webhook.js https://services-api.abc123.workers.dev/api/yoco-webhook "your-secret-key" payment.succeeded
 *   node scripts/test-yoco-webhook.js https://localhost:8787/api/yoco-webhook "test-secret" payment.failed
 */

const crypto = require('crypto');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Missing required arguments');
  console.error('');
  console.error('Usage: node scripts/test-yoco-webhook.js <worker-url> <webhook-secret> [event-type]');
  console.error('');
  console.error('Examples:');
  console.error('  node scripts/test-yoco-webhook.js https://services-api.abc123.workers.dev/api/yoco-webhook "sk_test_..."');
  console.error('  node scripts/test-yoco-webhook.js http://localhost:8787/api/yoco-webhook "test-secret" payment.succeeded');
  console.error('');
  console.error('Event types: payment.succeeded, payment.failed, charge.completed, payment.refunded');
  process.exit(1);
}

const webhookUrl = args[0];
const webhookSecret = args[1];
const eventType = args[2] || 'payment.succeeded';

// Validate URL
if (!webhookUrl.includes('/api/yoco-webhook')) {
  console.warn('⚠️  Warning: URL should end with /api/yoco-webhook');
}

// Create test payload
const payload = {
  id: `evt_test_${Date.now()}`,
  type: eventType,
  timestamp: new Date().toISOString(),
  data: {
    id: `charge_test_${Math.random().toString(36).substring(7)}`,
    status: eventType.includes('succeeded') ? 'succeeded' : 'failed',
    reference: `ORD-${Math.floor(Math.random() * 100000)}`,
    amount: 50000,
    currency: 'ZAR',
    description: 'Test payment from webhook tester script',
    metadata: {
      test: true,
      script_version: '1.0'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
};

// Sign the payload
const payloadString = JSON.stringify(payload);
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(payloadString)
  .digest('hex');

// Log details
console.log('🧪 YOCO Webhook Test\n');
console.log('📤 Webhook URL:', webhookUrl);
console.log('📝 Event Type:', eventType);
console.log('🔑 Signature:', signature.substring(0, 20) + '...');
console.log('');
console.log('📦 Payload:');
console.log(JSON.stringify(payload, null, 2));
console.log('');
console.log('🚀 Sending webhook...\n');

// Send the test webhook
fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-yoco-signature': signature,
  },
  body: payloadString,
})
  .then(async (response) => {
    const contentType = response.headers.get('content-type');
    let responseBody;

    if (contentType && contentType.includes('application/json')) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

    console.log('✅ Response Status:', response.status, response.statusText);
    console.log('📋 Response Body:', JSON.stringify(responseBody, null, 2));

    if (response.status === 200) {
      console.log('');
      console.log('✨ Webhook test successful!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Check your Supabase database:');
      console.log('   - payments table should have a new record');
      console.log('   - orders table status should be "paid" (if matching order exists)');
      console.log('2. Check Worker logs: wrangler tail');
      process.exit(0);
    } else {
      console.log('');
      console.log('❌ Webhook test failed');
      console.log('');
      console.log('Troubleshooting:');
      console.log('1. Verify webhook URL is correct');
      console.log('2. Check that YOCO_WEBHOOK_SECRET is set: wrangler secret list');
      console.log('3. View Worker logs: wrangler tail');
      console.log('4. Verify Supabase tables exist');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Network Error:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check that the webhook URL is correct and reachable');
    console.error('2. For localhost: make sure your Worker dev server is running (wrangler dev)');
    console.error('3. Check your internet connection');
    console.error('4. Verify CORS is not blocking the request');
    process.exit(1);
  });
