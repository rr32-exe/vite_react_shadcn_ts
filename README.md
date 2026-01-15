# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

---

## Cloudflare Worker (API)

This project includes a Cloudflare Worker in `workers/worker.ts` that implements API endpoints for payments and forms:

- POST `/api/create-paypal-order` — creates a Supabase order and PayPal order initialization (returns approve URL)
- POST `/api/paypal-webhook` — PayPal webhook handler (verifies webhook signature, records payment, updates order status)
- POST `/api/contact-submit` — saves contact submissions
- POST `/api/newsletter-subscribe` — subscribes to newsletter
- POST `/api/paystack-webhook` — Paystack webhook handler (verifies signature, records payment, updates order status) *(optional)*
- POST `/api/create-paypal-order` — creates a Supabase order and PayPal order initialization (returns approve URL)
- POST `/api/paypal-webhook` — PayPal webhook handler (verifies webhook signature, records payment, updates order status)

Quick steps to go live:
1. Install Wrangler and login: `npm i -g wrangler && wrangler login`
2. Add required secrets and vars in Cloudflare (replace test keys as needed):
   - `wrangler secret put PAYPAL_CLIENT_ID`
   - `wrangler secret put PAYPAL_SECRET`
   - `wrangler secret put SUPABASE_SERVICE_ROLE_KEY`
   - `wrangler secret put PAYPAL_WEBHOOK_ID`
   - `wrangler secret put PAYSTACK_SECRET_KEY` (if using Paystack)
   - `wrangler secret put PAYSTACK_WEBHOOK_SECRET` (if using Paystack)
   - Add `SUPABASE_URL` as a var in `wrangler.toml` or via the Cloudflare dashboard
   - Optionally set `PAYSTACK_MODE` to `test` or `live` in `workers/wrangler.toml` or as a var
3. Verify the database schema in `workers/sql/schema.sql` (run it in Supabase SQL editor)
4. Preview locally: `wrangler dev`
5. Publish: `npm run deploy:workers` (or `wrangler publish --account-id <ACCOUNT_ID>`)

CI smoke test:
- The GitHub Action will attempt a post-deploy smoke test against `${{ secrets.CF_WORKER_URL }}/api/status` and expects `paystack.mode` to be `test` to pass. Set `CF_WORKER_URL` (e.g. `https://<your-subdomain>.workers.dev`) in repository secrets to enable this check.

Creating PayPal webhook (helper):
- A helper script is available at `scripts/create-paypal-webhook.js`. It uses `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_MODE` (sandbox|live) and `WEBHOOK_URL` (or `CF_WORKER_URL`) environment variables.
- Example (sandbox):

  PAYPAL_CLIENT_ID=your_client_id PAYPAL_SECRET=your_secret PAYPAL_MODE=sandbox WEBHOOK_URL=https://<your-subdomain>.workers.dev/api/paypal-webhook npm run create:paypal-webhook

- The script prints the created webhook response and a command to set the returned webhook id as a Wrangler secret: `printf "%s" "<webhook-id>" | wrangler secret put PAYPAL_WEBHOOK_ID --raw`

You can run the interactive installer to set all secrets and optionally publish: `npm run setup:workers`.

See `workers/README.md` for more details on testing webhooks and CI deployment.

