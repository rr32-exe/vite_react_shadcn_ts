# YOCO Webhook Setup Guide

This guide walks you through setting up and testing YOCO webhooks for real-time payment notifications.

## Overview

The YOCO webhook integration allows your application to receive real-time notifications when:
- A payment is completed
- A payment fails
- A refund is processed

All webhook payloads are signed with SHA256 HMAC for security verification.

## Prerequisites

- ✅ Deployed Cloudflare Worker at `https://services-api.YOUR_ACCOUNT_ID.workers.dev`
- ✅ YOCO merchant account with API access
- ✅ `YOCO_WEBHOOK_SECRET` configured in your Worker

## Step-by-Step Setup

### Step 1: Get Your Webhook URL

Your webhook URL is:
```
https://services-api.YOUR_ACCOUNT_ID.workers.dev/api/yoco-webhook
```

Replace `YOUR_ACCOUNT_ID` with your actual Cloudflare account ID.

**Example:**
```
https://services-api.a1b2c3d4e5f6g7h8i9j0k1l2.workers.dev/api/yoco-webhook
```

### Step 2: Access YOCO Dashboard

1. Go to [YOCO Dashboard](https://dashboard.yoco.com)
2. Log in with your merchant account credentials
3. Navigate to **Settings > Webhooks** (or **Integrations > Webhooks** depending on your dashboard version)

### Step 3: Create a New Webhook

1. Click **Add Webhook** or **+ New Webhook**
2. In the **URL** field, paste your webhook URL from Step 1
3. Select the webhook **Events** you want to receive:
   - ✅ `payment.succeeded` (recommended - required for payment processing)
   - ✅ `payment.failed` (recommended - track failed payments)
   - ✅ `payment.refunded` (optional - handle refunds)
   - ✅ `charge.completed` (optional - additional confirmation)
   
   **Recommended:** Select all events initially, then narrow down based on your needs

4. Click **Create** or **Save**

### Step 4: Copy the Webhook Signing Secret

After creating the webhook:

1. Find your newly created webhook in the list
2. Click on it to view details (or look for a **View** / **Edit** button)
3. Copy the **Signing Secret** (also called "Webhook Secret" or "API Key")
4. **Keep this secret safe** - it's used to verify webhook authenticity

### Step 5: Configure the Secret in Your Worker

Run this command to set the webhook secret:

```bash
cd workers
wrangler secret put YOCO_WEBHOOK_SECRET
```

When prompted, paste the signing secret you copied in Step 4.

Alternatively, via Cloudflare Dashboard:
1. Go to **Workers > services-api > Settings > Secrets**
2. Click **Add Secret**
3. Name: `YOCO_WEBHOOK_SECRET`
4. Value: [paste your signing secret]
5. Click **Save**

### Step 6: Verify Configuration

Test that your webhook secret is configured:

```bash
curl https://services-api.YOUR_ACCOUNT_ID.workers.dev/api/status
```

Look for:
```json
{
  "ok": true,
  "yoco": {
    "configured": true,
    "webhookConfigured": true  // ← Should be true
  },
  ...
}
```

If `webhookConfigured` is `false`, double-check that `YOCO_WEBHOOK_SECRET` is set.

## Testing Webhooks

### Option 1: Test with YOCO Dashboard

1. Go back to your webhook in the YOCO Dashboard
2. Look for a **Test** button or **Send Test Event**
3. Select a test event type (e.g., `payment.succeeded`)
4. Click **Send Test**

YOCO will send a test webhook to your endpoint.

### Option 2: Manual Testing with curl

Create a test webhook payload and sign it:

```bash
# Create a test webhook payload
cat > /tmp/test-webhook.json << 'EOF'
{
  "id": "evt_test_123",
  "type": "payment.succeeded",
  "timestamp": "2024-01-29T12:00:00Z",
  "data": {
    "id": "charge_test_12345",
    "status": "succeeded",
    "reference": "ORD-001",
    "amount": 50000,
    "currency": "ZAR",
    "metadata": {}
  }
}
EOF

# Sign the payload (requires openssl)
PAYLOAD=$(cat /tmp/test-webhook.json)
SECRET="your_webhook_secret_here"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" -hex | cut -d' ' -f2)

# Send the test webhook
curl -X POST https://services-api.YOUR_ACCOUNT_ID.workers.dev/api/yoco-webhook \
  -H "Content-Type: application/json" \
  -H "x-yoco-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

Expected response:
```json
{
  "received": true
}
```

### Option 3: Use the Test Script

A test script is available in the project:

```bash
# Run the YOCO webhook test suite
npm test -- tests/yoco.test.ts
```

This verifies:
- ✅ Signature validation works
- ✅ Valid webhooks are accepted
- ✅ Invalid signatures are rejected
- ✅ Payments are recorded in the database

## Webhook Payload Structure

Here's what YOCO sends in a payment webhook:

```json
{
  "id": "evt_live_abc123...",
  "type": "payment.succeeded",
  "timestamp": "2024-01-29T12:34:56Z",
  "data": {
    "id": "charge_live_xyz789...",
    "status": "succeeded",
    "reference": "ORD-12345",  // Links to your order
    "amount": 50000,           // In cents (ZAR)
    "currency": "ZAR",
    "description": "Payment for service",
    "metadata": {
      "order_id": "12345"      // Your custom metadata
    },
    "created_at": "2024-01-29T12:34:56Z",
    "updated_at": "2024-01-29T12:34:56Z"
  }
}
```

## How It Works

1. **Payment Completed**: Customer completes payment on YOCO's hosted checkout
2. **Webhook Triggered**: YOCO sends signed webhook to your endpoint
3. **Signature Verified**: Your Worker validates the SHA256 signature
4. **Payment Recorded**: Successful payment is stored in your `payments` table
5. **Order Updated**: Order status is changed to "paid"
6. **Confirmation**: Response `{ "received": true }` acknowledges receipt

## Troubleshooting

### Webhook Not Received

**Check 1: URL is correct**
```bash
# Verify worker is responding
curl https://services-api.YOUR_ACCOUNT_ID.workers.dev/api/status
# Should return 200 OK
```

**Check 2: YOCO can reach your endpoint**
- YOCO Dashboard > Webhooks > Your webhook > **Attempts** / **Logs**
- Check if YOCO attempted to send (look for HTTP 200 success)

**Check 3: Firewall/Rate Limiting**
- Cloudflare Workers have a 50 request/second per second per default
- Check Cloudflare Analytics to see if requests are being blocked

### Signature Verification Fails

**Issue:** Getting `Invalid signature` errors

**Solution:**
1. Verify `YOCO_WEBHOOK_SECRET` is set correctly
2. Check that YOCO Dashboard shows the same secret
3. Make sure secret has no extra whitespace:
   ```bash
   wrangler secret list  # Verify secret is listed
   ```

### Payments Not Recording

**Issue:** Webhook accepted but payment not in database

**Check:**
1. Verify Supabase credentials are correct: `wrangler secret list`
2. Check that `payments` table exists in Supabase
3. Check Worker logs for errors:
   ```bash
   wrangler tail  # Stream live logs
   ```

### Test Event Fails

**YOCO Dashboard shows "Failed"**

1. Check your webhook URL in YOCO Dashboard
   - Should be: `https://services-api.YOUR_ACCOUNT_ID.workers.dev/api/yoco-webhook`
   - **Common mistake**: Missing `/api/yoco-webhook` path

2. Test the endpoint directly:
   ```bash
   curl -v https://services-api.YOUR_ACCOUNT_ID.workers.dev/api/yoco-webhook
   # Should return 400 (no valid signature) not 404
   ```

3. Check Cloudflare Workers logs:
   ```bash
   wrangler tail
   ```

## Production Checklist

- [ ] Webhook URL configured in YOCO Dashboard
- [ ] `YOCO_WEBHOOK_SECRET` set in Worker secrets
- [ ] Webhook signing verified: `webhookConfigured: true` in `/api/status`
- [ ] `payments` table exists in Supabase
- [ ] `orders` table exists in Supabase
- [ ] Tested with `payment.succeeded` event
- [ ] Tested with `payment.failed` event (optional)
- [ ] Production vs. sandbox mode verified in `YOCO_MODE`
- [ ] Monitoring webhook configured (optional) for error alerts
- [ ] Sentry/logging configured for production debugging

## Database Integration

When a valid webhook is received, the Worker:

1. **Creates a payment record** in the `payments` table:
   ```sql
   INSERT INTO payments (
     order_id,
     yoco_charge_id,
     yoco_transaction_id,
     amount,
     currency,
     status,
     raw
   ) VALUES (...)
   ```

2. **Updates the order** status to `"paid"`:
   ```sql
   UPDATE orders 
   SET status = 'paid', updated_at = NOW()
   WHERE id = ?
   ```

## Security Best Practices

✅ **Always verify signatures** - Never trust webhook data without verification

✅ **Keep secret secure** - Don't commit `YOCO_WEBHOOK_SECRET` to code

✅ **Use HTTPS only** - All webhooks go to HTTPS endpoints (Workers are automatically HTTPS)

✅ **Handle duplicates** - The Worker uses idempotency keys to prevent duplicate payments

✅ **Monitor failures** - Set up alerts for webhook processing errors (via `MONITORING_WEBHOOK_URL`)

## Next Steps

1. ✅ Complete webhook setup above
2. ✅ Test with YOCO Dashboard test event
3. ✅ Make a test payment in sandbox mode (if `YOCO_MODE = "test"`)
4. ✅ Verify payment appears in Supabase `payments` table
5. ✅ Switch `YOCO_MODE` to `"live"` for production
6. ✅ Update webhook URL if moving to new domain

## Support Resources

- [YOCO API Documentation](https://developer.yoco.com/)
- [YOCO Webhooks Reference](https://developer.yoco.com/docs/webhooks)
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Supabase Database Docs](https://supabase.com/docs/guides/database/overview)

---

**Questions?** Check the Worker logs:
```bash
wrangler tail --format json
```

And review the webhook handler in [workers/worker.ts](workers/worker.ts) at the `handleYocoWebhook` function.
