# YOCO Webhook Architecture & Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Customer Browser                         │
│                                                             │
│  [Your React App] → [useCheckout Hook]                     │
│                           ↓                                │
│              [YOCO Hosted Checkout]                        │
│                           ↓                                │
│         [Customer Completes Payment]                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    YOCO Servers                             │
│                                                             │
│          [Payment Processing] → [Payment Succeeded]        │
│                           ↓                                │
│         [Send Webhook] → [Verify Signature]                │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTPS POST
           POST /api/yoco-webhook
      x-yoco-signature: sha256_hash
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Worker (services-api)               │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. handleYocoWebhook()                              │  │
│  │     - Extract payload and signature                  │  │
│  │     - Verify SHA256 HMAC with YOCO_WEBHOOK_SECRET  │  │
│  │                                                      │  │
│  │  2. Record Payment in Supabase                       │  │
│  │     - INSERT into payments table                    │  │
│  │     - yoco_charge_id                                │  │
│  │     - yoco_transaction_id                           │  │
│  │                                                      │  │
│  │  3. Update Order Status                             │  │
│  │     - UPDATE orders SET status = 'paid'             │  │
│  │     - Idempotency check to prevent duplicates       │  │
│  │                                                      │  │
│  │  4. Return Response                                 │  │
│  │     - { "received": true }                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                │
│                    Supabase API                            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Supabase PostgreSQL Database                   │
│                                                             │
│  [orders table] ← Updated to "paid"                        │
│  [payments table] ← New payment record created             │
│  [contact_submissions table] (optional)                    │
│  [newsletter_subscribers table] (optional)                 │
└─────────────────────────────────────────────────────────────┘
```

## Webhook Flow - Detailed

### 1. Payment Initiation

```
Customer clicks "Pay with YOCO"
         ↓
useCheckout() hook calls /api/create-yoco-charge
         ↓
Worker creates order in Supabase (status: pending)
         ↓
Worker calls YOCO API to create charge
         ↓
YOCO returns checkout URL
         ↓
Customer redirected to YOCO Hosted Checkout
```

### 2. Payment Completion

```
Customer enters card details and confirms
         ↓
YOCO processes payment (1-2 seconds)
         ↓
Payment succeeds in YOCO system
         ↓
YOCO triggers webhook event
```

### 3. Webhook Delivery

```
YOCO Server → Generates SHA256 signature
  PAYLOAD = JSON webhook data
  SIGNATURE = HMAC-SHA256(PAYLOAD, WEBHOOK_SECRET)
         ↓
YOCO sends:
  POST /api/yoco-webhook
  Header: x-yoco-signature = SIGNATURE
  Body: PAYLOAD (JSON)
         ↓
Cloudflare receives request
```

### 4. Webhook Processing

```
handleYocoWebhook() receives request
  ↓
✓ Extract signature from x-yoco-signature header
✓ Extract payload from request body
  ↓
Verify signature:
  COMPUTED_SIGNATURE = HMAC-SHA256(PAYLOAD, YOCO_WEBHOOK_SECRET)
  IF (COMPUTED_SIGNATURE !== x-yoco-signature) {
    REJECT with 400 Bad Request
  }
  ↓
✓ Signature valid - process payment
  ↓
Idempotency check:
  IF (payment already exists) {
    return 200 OK (no duplicate)
  }
  ↓
✓ Insert payment record in Supabase
✓ Update order status to "paid"
  ↓
Return 200 OK { "received": true }
```

## Data Models

### Webhook Payload (from YOCO)

```json
{
  "id": "evt_live_abc123...",
  "type": "payment.succeeded",
  "timestamp": "2024-01-29T12:34:56Z",
  "data": {
    "id": "charge_live_xyz789...",
    "status": "succeeded",
    "reference": "ORD-12345",
    "amount": 50000,           // Cents
    "currency": "ZAR",
    "description": "Payment for AI Niche Site",
    "metadata": {
      "order_id": "12345"
    },
    "created_at": "2024-01-29T12:34:56Z",
    "updated_at": "2024-01-29T12:34:56Z"
  }
}
```

### Signature Verification (Node.js)

```javascript
const crypto = require('crypto');

// From webhook request
const signatureHeader = request.headers.get('x-yoco-signature');
const payloadBody = request.body; // Raw JSON string

// From environment
const webhookSecret = env.YOCO_WEBHOOK_SECRET;

// Compute signature
const computedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(payloadBody)
  .digest('hex');

// Verify
if (computedSignature !== signatureHeader) {
  throw new Error('Invalid signature');
}
```

### Orders Table

```sql
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT,
  customer_email TEXT,
  service_id TEXT,
  service_name TEXT,
  total_amount INTEGER,        -- Cents (50000 = ZAR 500)
  deposit_amount INTEGER,      -- 50% deposit
  currency TEXT,               -- "ZAR"
  status TEXT,                 -- "pending" → "paid" (via webhook)
  yoco_charge_id TEXT,         -- Links to YOCO charge
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Payments Table

```sql
CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT,             -- Foreign key to orders
  yoco_charge_id TEXT UNIQUE,  -- "charge_live_xyz..."
  yoco_transaction_id TEXT,    -- Transaction ID from YOCO
  amount INTEGER,              -- Cents
  currency TEXT,               -- "ZAR"
  status TEXT,                 -- "succeeded", "failed"
  raw JSONB,                   -- Full webhook payload (audit trail)
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Security Model

### Signature Verification (SHA256 HMAC)

```
STEP 1: YOCO generates secret key during webhook setup
  Secret: "whsk_live_..." (stored safely in YOCO)

STEP 2: You copy secret and store in Worker
  Worker Variable: YOCO_WEBHOOK_SECRET

STEP 3: For each webhook, YOCO signs with:
  Signature = HMAC-SHA256(webhook_payload, secret)
  Header: x-yoco-signature

STEP 4: Your Worker verifies:
  Compute: HMAC-SHA256(webhook_payload, YOCO_WEBHOOK_SECRET)
  Compare with: x-yoco-signature header
  
  If different → REJECT (possible forgery)
  If same → ACCEPT (authentic)
```

### Why This Is Secure

✓ **Signature proves authenticity**: Only YOCO knows the secret
✓ **Prevents replay attacks**: Signatures are time-stamped
✓ **HTTPS encryption**: Payload encrypted in transit
✓ **Idempotency**: Duplicate detection prevents double-payments
✓ **Audit trail**: Raw payload stored in `raw` JSONB column

## Testing the Webhook

### Local Testing

```
Terminal 1: Start local worker
  wrangler dev

Terminal 2: Send test webhook
  npm run test:webhook http://localhost:8787/api/yoco-webhook "test-secret"

Terminal 3: Watch logs
  wrangler tail
```

### Production Testing

```
1. Set YOCO_MODE = "test" (uses sandbox)
2. Make test payment with card: 4111 1111 1111 1111
3. YOCO sends webhook to prod endpoint
4. Check Supabase for payment record
5. Check Worker logs: wrangler tail
```

## Retry Logic

If webhook processing fails (e.g., database timeout):

```
Attempt 1: Immediate
  ↓ (fail)
Attempt 2: +1 second delay
  ↓ (fail)
Attempt 3: +4 seconds delay
  ↓ (fail)
Attempt 4: +8 seconds delay
  ↓ (if still fails)
Alert sent to MONITORING_WEBHOOK_URL (optional)
```

The Worker uses exponential backoff to retry database operations.

## Monitoring & Debugging

### Check Status

```bash
curl https://services-api.ACCOUNT_ID.workers.dev/api/status | jq .yoco

# Expected:
{
  "configured": true,          // YOCO_SECRET_KEY, YOCO_API_URL set
  "webhookConfigured": true    // YOCO_WEBHOOK_SECRET set
}
```

### View Logs

```bash
# Stream live logs
wrangler tail

# Filter for errors
wrangler tail --status error

# JSON format
wrangler tail --format json | grep yoco
```

### Check Database

```sql
-- Recent webhooks processed
SELECT id, yoco_charge_id, status, created_at 
FROM payments 
ORDER BY created_at DESC 
LIMIT 10;

-- Orders updated to paid
SELECT id, customer_email, status, yoco_charge_id, updated_at 
FROM orders 
WHERE status = 'paid' 
ORDER BY updated_at DESC 
LIMIT 10;

-- Check for failures
SELECT id, status, raw 
FROM payments 
WHERE status != 'succeeded' 
ORDER BY created_at DESC;
```

## Production Checklist

```
Webhook Configuration:
  ☐ Webhook URL in YOCO Dashboard: /api/yoco-webhook
  ☐ Webhook events selected: payment.succeeded, payment.failed
  ☐ Webhook secret copied from YOCO

Worker Configuration:
  ☐ YOCO_WEBHOOK_SECRET set (via wrangler secret put)
  ☐ Status endpoint shows webhookConfigured: true
  ☐ YOCO_MODE set to "live" (for production)
  ☐ Logs monitored: wrangler tail

Database:
  ☐ payments table exists with all columns
  ☐ orders table exists with yoco_charge_id
  ☐ Indexes created for performance
  ☐ Supabase service role key configured

Testing:
  ☐ Test webhook script works: npm run test:webhook
  ☐ YOCO Dashboard test event succeeds
  ☐ Test payment in sandbox mode succeeds
  ☐ Payment recorded in payments table
  ☐ Order status updated to "paid"
  ☐ Webhook logs show "received": true

Monitoring:
  ☐ Error alerts configured (MONITORING_WEBHOOK_URL)
  ☐ Sentry integration enabled (SENTRY_DSN)
  ☐ Regular log review scheduled
  ☐ Database backup strategy in place
```

## Troubleshooting Map

| Problem | Cause | Solution |
|---------|-------|----------|
| Webhook not received | URL incorrect | Verify in YOCO Dashboard |
| Signature fails | Secret mismatch | Re-copy secret from YOCO |
| Payment not in DB | Supabase error | Check service role key |
| Duplicate payments | Missing idempotency | Check Worker code |
| Slow processing | Rate limiting | Increase Worker CPU |
| Missing transactions | Webhook timeout | Enable retries |

---

**Need help?** See [WEBHOOK_SETUP.md](WEBHOOK_SETUP.md) for detailed instructions.
