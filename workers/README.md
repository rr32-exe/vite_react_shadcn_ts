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

If you want, I can also:
- Add TypeScript types or unit tests,
- Add a preview/dev script (wrangler dev) to test locally,
- Add rate-limiting or webhook verification for completed payments.

---

Created by GitHub Copilot (Raptor mini - Preview)
