# Cloudflare Worker for Service APIs ✅

This Worker exposes three endpoints under `/api/*` that are equivalent to the Deno edge handlers you provided:

- POST /api/create-checkout
- POST /api/contact-submit
- POST /api/newsletter-subscribe

Quick overview:
- Uses Stripe REST API to create Checkout Sessions (no Node-only Stripe SDK required).
- Uses Supabase REST (PostgREST) and the Service Role key to insert/upsert rows.
- CORS ready and returns JSON responses.

---

## Setup & Deployment

1. Install wrangler v3:

   npm install -g wrangler

2. Configure `wrangler.toml`:
   - Set `account_id` in `wrangler.toml` or pass it to publish.

3. Add secrets and variables:

   # Stripe secret
   wrangler secret put STRIPE_SECRET_KEY

   # Supabase service role key (secret)
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY

   # SUPABASE_URL can be stored as a plain variable (not secret) or set in the dashboard
   # Example (dashboard or `wrangler` UI recommended for url):
   # wrangler env put --env production SUPABASE_URL "https://xyz.supabase.co"

4. Publish the Worker (workers.dev):

   wrangler publish

Or publish to a specific account id:

   wrangler publish --account-id <ACCOUNT_ID>

---

## Testing (curl examples)

Create checkout (sample):

curl -X POST "https://<your-subdomain>.workers.dev/api/create-checkout" \
  -H "Content-Type: application/json" \
  -d '{"serviceId":"s1","customerName":"Jane Doe","customerEmail":"jane@example.com"}'

Contact submit:

curl -X POST "https://<your-subdomain>.workers.dev/api/contact-submit" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","email":"jane@example.com","message":"Hello!"}'

Newsletter subscribe:

curl -X POST "https://<your-subdomain>.workers.dev/api/newsletter-subscribe" \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","site":"vaughnsterling"}'

---

## Notes & Caveats

- The worker uses Supabase PostgREST endpoints (`/rest/v1/<table>`). Make sure the relevant tables (`orders`, `contact_submissions`, `newsletter_subscribers`) exist and have the columns used in the requests.
- For `newsletter_subscribe` we use `on_conflict=email,site` to emulate upsert behavior.
- If you prefer the official Stripe SDK for Edge, you can swap the REST call for the SDK (note: some Stripe SDKs depend on Node APIs and may need bundling).

### Stripe Webhooks

This Worker now includes a `/api/stripe-webhook` POST endpoint that verifies Stripe webhook signatures using a webhook secret and records payments in the `payments` table and marks `orders` as `paid` on successful events.

- Add the webhook secret: `wrangler secret put STRIPE_WEBHOOK_SECRET`
- Configure Stripe to send webhooks to `https://<your-subdomain>.workers.dev/api/stripe-webhook`
- For local testing, use the Stripe CLI:

  stripe listen --forward-to https://<your-subdomain>.workers.dev/api/stripe-webhook

  Or trigger a test event:

  stripe trigger checkout.session.completed

### Admin endpoints (read-only)

A secure admin interface is available under `/api/admin/*` and requires the `ADMIN_SECRET` secret (send as `Authorization: Bearer <ADMIN_SECRET>` or `x-admin-secret` header):

- GET `/api/admin/orders` - optional query `id`, `email`, `limit`
- GET `/api/admin/payments` - optional query `id`, `stripe_payment_intent`, `limit`

Set the secret with:

  wrangler secret put ADMIN_SECRET

### Monitoring & retries

Critical writes in the webhook handler now use retry logic and exponential backoff. If a persistent failure occurs and you have a monitoring webhook, the worker will POST a failure payload to `MONITORING_WEBHOOK_URL` (optional variable).

Set a monitoring webhook URL in the Cloudflare dashboard as `MONITORING_WEBHOOK_URL` (plain var). If you don't have one, the worker will simply log errors to console.

### CI / Deploy

A GitHub Actions workflow has been added at `.github/workflows/deploy-workers.yml` that publishes the worker on push to `main`. Set these GitHub secrets:
- `CF_API_TOKEN` — Cloudflare API token with workers write privileges
- `CLOUDFLARE_ACCOUNT_ID` — your account id

---

If you want, I can also:
- Add TypeScript types or unit tests,
- Add rate-limiting or monitoring (Sentry / Logs),
- Add automatic secret provisioning (careful with security) or a safer managed deploy.

---

Created by GitHub Copilot (Raptor mini - Preview)
