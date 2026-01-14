# Cloudflare Worker for Service APIs ✅

This Worker exposes three endpoints under `/api/*` that are equivalent to the Deno edge handlers you provided:

- POST /api/create-checkout
- POST /api/contact-submit
- POST /api/newsletter-subscribe

Quick overview:
- Uses Paystack REST API to initialize transactions (no Node-only SDK required).
- Uses Supabase REST (PostgREST) and the Service Role key to insert/upsert rows.
- CORS ready and returns JSON responses.

---

## Setup & Deployment

1. Install wrangler v3:

   npm install -g wrangler

2. Configure `wrangler.toml`:
   - Set `account_id` in `wrangler.toml` or pass it to publish.

3. Add secrets and variables:

   # Paystack secret
   wrangler secret put PAYSTACK_SECRET_KEY

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
- If you prefer a payments provider SDK for Edge (e.g., Paystack SDK), you can swap the REST call for the SDK (note: some SDKs depend on Node APIs and may need bundling).

### Paystack Webhooks

This Worker includes a `/api/paystack-webhook` POST endpoint that verifies Paystack webhook signatures and records payments in the `payments` table and marks `orders` as `paid` on successful events.

- Add the webhook secret: `wrangler secret put PAYSTACK_WEBHOOK_SECRET`
- Configure Paystack to send webhooks to `https://<your-subdomain>.workers.dev/api/paystack-webhook`
- For local testing, generate a test transaction in the Paystack dashboard or use a webhook test tool to POST a sample `charge.success` event to the webhook endpoint.

### Admin endpoints (read-only)

A secure admin interface is available under `/api/admin/*` and requires the `ADMIN_SECRET` secret (send as `Authorization: Bearer <ADMIN_SECRET>` or `x-admin-secret` header):

- GET `/api/admin/orders` - optional query `id`, `email`, `limit`
- GET `/api/admin/payments` - optional query `id`, `stripe_payment_intent`, `paystack_reference`, `paystack_transaction_id`, `limit`

Set the secret with:

  wrangler secret put ADMIN_SECRET

You can also use the interactive installer to set secrets and vars:

  npm run setup:workers

If you want GitHub OAuth for admin login, register an OAuth app at https://github.com/settings/developers and set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` (and optionally `ADMIN_GITHUB_USERS` or `ADMIN_GITHUB_ORGS` to restrict who can log in). The OAuth callback URL must be `https://<your-host>/api/auth/github/callback`.

We now store the OAuth `state` in a KV namespace `OAUTH_KV` to prevent replay; create one with:

  wrangler kv:namespace create "OAUTH_KV"

Then set the namespace id in `wrangler.toml` (or run the interactive installer and paste the id when prompted).

### Monitoring & retries

Critical writes in the webhook handler now use retry logic and exponential backoff. If a persistent failure occurs and you have a monitoring webhook, the worker will POST a failure payload to `MONITORING_WEBHOOK_URL` (optional variable).

Set a monitoring webhook URL in the Cloudflare dashboard as `MONITORING_WEBHOOK_URL` (plain var). If you don't have one, the worker will simply log errors to console.

### Sentry integration

- Server-side: set `SENTRY_DSN` in `wrangler.toml` or as a secret if you'd prefer; the worker will POST basic error events to Sentry's store endpoint. For advanced features (envelopes, releases, source maps) set these additional secrets:
  - `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` for CI integration.
  - `SENTRY_RELEASE` (optional) — if you provide a release id (e.g., Git SHA), the worker will include it in events.
- Client-side: set `VITE_SENTRY_DSN` (in your environment) and the frontend will initialize Sentry (using `@sentry/react`). Pass `VITE_SENTRY_RELEASE` to annotate releases.

Notes:
- The worker uses a lightweight direct POST to Sentry's store endpoint (no heavy SDK in the Worker runtime).
- The main deploy workflow will attempt to create a Sentry release if `SENTRY_AUTH_TOKEN` and related secrets are set.

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
