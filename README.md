# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

---

## Cloudflare Worker (API)

This project includes a Cloudflare Worker in `workers/worker.ts` that implements API endpoints for payments and forms:

- POST `/api/create-checkout` — creates a Supabase order and Stripe Checkout session
- POST `/api/contact-submit` — saves contact submissions
- POST `/api/newsletter-subscribe` — subscribes to newsletter
- POST `/api/stripe-webhook` — Stripe webhook handler (verifies signature, records payment, updates order status)

Quick steps to go live:
1. Install Wrangler and login: `npm i -g wrangler && wrangler login`
2. Add required secrets:
   - `wrangler secret put STRIPE_SECRET_KEY`
   - `wrangler secret put SUPABASE_SERVICE_ROLE_KEY`
   - `wrangler secret put STRIPE_WEBHOOK_SECRET`
   - Add `SUPABASE_URL` as a var in `wrangler.toml` or via the Cloudflare dashboard
3. Verify the database schema in `workers/sql/schema.sql` (run it in Supabase SQL editor)
4. Preview locally: `wrangler dev`
5. Publish: `npm run deploy:workers` (or `wrangler publish --account-id <ACCOUNT_ID>`)

See `workers/README.md` for more details on testing webhooks and CI deployment.

