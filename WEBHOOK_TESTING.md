# Quick Reference: YOCO Webhook Testing

## Test Webhook Script

### Basic Test
```bash
npm run test:webhook https://services-api.YOUR_ACCOUNT_ID.workers.dev/api/yoco-webhook "your_webhook_secret"
```

### Test with Different Event Types
```bash
# Payment succeeded
npm run test:webhook https://services-api.YOUR_ACCOUNT_ID.workers.dev/api/yoco-webhook "your_webhook_secret" payment.succeeded

# Payment failed
npm run test:webhook https://services-api.YOUR_ACCOUNT_ID.workers.dev/api/yoco-webhook "your_webhook_secret" payment.failed

# Charge completed
npm run test:webhook https://services-api.YOUR_ACCOUNT_ID.workers.dev/api/yoco-webhook "your_webhook_secret" charge.completed
```

### Local Testing (Development)
```bash
# Terminal 1: Start your worker locally
wrangler dev

# Terminal 2: Test the webhook
npm run test:webhook http://localhost:8787/api/yoco-webhook "test-secret"
```

## Manual Testing with curl

### Get Your Webhook Secret
```bash
# If you set it via wrangler
wrangler secret list | grep YOCO_WEBHOOK_SECRET
```

### Create and Sign a Test Payload (macOS/Linux)
```bash
# Create payload
PAYLOAD='{"id":"evt_test_123","type":"payment.succeeded","timestamp":"2024-01-29T12:00:00Z","data":{"id":"charge_test_456","status":"succeeded","reference":"ORD-001","amount":50000,"currency":"ZAR"}}'

# Generate signature
SECRET="your_webhook_secret_here"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" -hex | cut -d' ' -f2)

# Send webhook
curl -X POST https://services-api.YOUR_ACCOUNT_ID.workers.dev/api/yoco-webhook \
  -H "Content-Type: application/json" \
  -H "x-yoco-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

## Verify Webhook Configuration

### Check Status Endpoint
```bash
curl https://services-api.YOUR_ACCOUNT_ID.workers.dev/api/status | jq .yoco
```

Expected output:
```json
{
  "configured": true,
  "webhookConfigured": true
}
```

### View Worker Logs
```bash
wrangler tail

# With JSON formatting
wrangler tail --format json
```

## Test Payment in Sandbox

1. Set `YOCO_MODE = "test"` in your Worker variables
2. Visit your application and initiate a test payment
3. Use YOCO test card: `4111 1111 1111 1111` (expires any future date, CVV: any 3 digits)
4. Complete the payment
5. Check your Supabase database for the recorded payment

## Database Verification

### Check if Payment Was Recorded
```sql
-- In Supabase SQL Editor
SELECT * FROM payments 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if order was updated to "paid"
SELECT id, status, yoco_charge_id 
FROM orders 
ORDER BY updated_at DESC 
LIMIT 10;
```

## Troubleshooting

### Webhook Not Responding
```bash
# Check if endpoint is reachable
curl -v https://services-api.YOUR_ACCOUNT_ID.workers.dev/api/yoco-webhook

# Should return 400 Bad Request (no valid signature)
# If 404, check the URL
```

### Signature Verification Fails
```bash
# Verify secret is set
wrangler secret list

# Check for whitespace issues
wrangler secret list | grep YOCO_WEBHOOK_SECRET | xxd
```

### Payment Not Recording
```bash
# Check Supabase connection
curl https://services-api.YOUR_ACCOUNT_ID.workers.dev/api/status | jq .supabase

# Check Worker logs for errors
wrangler tail --status error
```

## YOCO Dashboard Testing

1. Go to **Webhooks** > Your webhook
2. Look for **Attempts** or **Test Event** button
3. Click **Send Test** to trigger a test webhook
4. Check **Status** - should show 200 OK

## Production Checklist

- [ ] Webhook URL registered in YOCO Dashboard
- [ ] `YOCO_WEBHOOK_SECRET` set in Worker
- [ ] `webhookConfigured: true` in `/api/status`
- [ ] Test payment successful in sandbox mode
- [ ] Payment recorded in `payments` table
- [ ] Order updated to `"paid"` status
- [ ] Worker logs show successful processing
- [ ] `YOCO_MODE` set to `"live"` for production

## Environment Setup

### Development
```bash
# .env.local (for vite frontend)
VITE_API_URL=http://localhost:8787

# workers/wrangler.toml
YOCO_MODE = "test"
```

### Production
```bash
# Frontend environment variables (Cloudflare Pages)
VITE_API_URL=https://services-api.YOUR_ACCOUNT_ID.workers.dev

# Worker configuration (wrangler.toml)
YOCO_MODE = "live"
```

## Additional Resources

- [WEBHOOK_SETUP.md](../WEBHOOK_SETUP.md) - Detailed webhook configuration guide
- [YOCO API Documentation](https://developer.yoco.com/)
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
