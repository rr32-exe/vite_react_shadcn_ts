# Vite React shadcn TypeScript - Cloudflare Deployment Guide

A production-ready React application with TypeScript, shadcn/ui components, Vite bundler, and Cloudflare Workers backend integration with YOCO payment processing.

## 🚀 Quick Start

### Local Development

```bash
npm install
npm run dev
```

Open http://localhost:8080 in your browser.

### Build for Production

```bash
npm run build
```

Output is in the `dist/` directory.

## 📦 Cloudflare Production Deployment

This project deploys on **Cloudflare Pages** (frontend) and **Cloudflare Workers** (backend API).

### Prerequisites

1. A [Cloudflare account](https://dash.cloudflare.com/)
2. [wrangler CLI v3+](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed
3. A [Supabase project](https://supabase.com/) for the database (PostgreSQL)
4. YOCO merchant account for payment processing
5. Your domain connected to Cloudflare (optional, but recommended for custom domains)

### Step 1: Deploy Backend (Cloudflare Workers)

**1.1 Get your Cloudflare Account ID:**

```bash
# Log in to Cloudflare
wrangler login

# List your accounts to find your account ID
wrangler whoami
```

**1.2 Configure wrangler.toml:**

Edit `workers/wrangler.toml` and set your account ID:

```toml
account_id = "<YOUR_ACCOUNT_ID>"
```

**1.3 Set up Secrets and Environment Variables:**

```bash
cd workers

# Set required secrets (prompted interactively)
wrangler secret put YOCO_SECRET_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put YOCO_WEBHOOK_SECRET
wrangler secret put ADMIN_SECRET

# Or use the interactive setup script
npm run setup:workers
```

**1.4 Add Variables (Plain Text Configuration):**

Option A: Via CLI
```bash
wrangler env production env put SUPABASE_URL "https://YOUR_PROJECT.supabase.co"
wrangler env production env put YOCO_API_URL "https://online.yoco.com"
wrangler env production env put YOCO_MODE "live"  # or "test"
```

Option B: Via Cloudflare Dashboard
- Go to Workers > Your Worker > Settings > Variables
- Add the variables listed above

**1.5 Create KV Namespace for OAuth State (if using GitHub OAuth):**

```bash
wrangler kv:namespace create "OAUTH_KV" --preview false
```

Then add the namespace binding to `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "OAUTH_KV"
id = "<NAMESPACE_ID>"
```

**1.6 Publish the Worker:**

```bash
wrangler publish
```

You'll get a worker URL like: `https://services-api.YOUR_ACCOUNT_ID.workers.dev`

**Note:** Save this URL for the frontend configuration.

### Step 2: Deploy Frontend (Cloudflare Pages)

**2.1 Build the Frontend:**

```bash
npm run build
```

**2.2 Deploy to Cloudflare Pages:**

Option A: Via GitHub (Recommended)

1. Push your repository to GitHub
2. Go to Cloudflare Dashboard > Pages
3. Create a new project from Git
4. Connect your GitHub repo
5. Set build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
6. Add Environment Variables under Settings > Build, Build Staging, or Production:
   - `VITE_API_URL`: `https://services-api.YOUR_ACCOUNT_ID.workers.dev`
   - `VITE_SENTRY_DSN` (optional): Your Sentry DSN if using error tracking
7. Click **Deploy**

Option B: Via Wrangler CLI

```bash
# From root directory
npm run build
wrangler pages publish dist --project-name my-project
```

**2.3 Get Your Pages URL:**

After deployment, you'll get a URL like: `https://my-project.pages.dev`

### Step 3: Configure YOCO Webhook

1. Log in to your YOCO merchant dashboard
2. Go to **Settings > Webhooks**
3. Add a new webhook with:
   - **URL:** `https://services-api.YOUR_ACCOUNT_ID.workers.dev/api/yoco-webhook`
   - **Events:** `payment.succeeded`, `payment.failed` (or all events)
4. Copy the webhook signing secret and set it as `YOCO_WEBHOOK_SECRET` in your Worker

### Step 4: Verify Deployment

Test your live endpoints:

```bash
# Test health check
curl https://services-api.YOUR_ACCOUNT_ID.workers.dev/api/status

# Test YOCO charge creation (requires valid data)
curl -X POST https://services-api.YOUR_ACCOUNT_ID.workers.dev/api/create-yoco-charge \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "s1",
    "customerName": "Test User",
    "customerEmail": "test@example.com"
  }'
```

## 🗄️ Database Setup (Supabase)

The project expects these tables in your Supabase PostgreSQL database:

```sql
-- Run these in Supabase SQL Editor:

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  total_amount INTEGER NOT NULL,
  deposit_amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  yoco_charge_id TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES public.orders(id),
  yoco_charge_id TEXT UNIQUE NOT NULL,
  yoco_transaction_id TEXT UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  raw JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_yoco_charge_id ON public.orders(yoco_charge_id);
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_yoco_charge_id ON public.payments(yoco_charge_id);
```

## 🔐 Environment Variables Reference

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `VITE_API_URL` | Frontend | Yes | Worker URL: `https://services-api.ACCOUNT_ID.workers.dev` |
| `YOCO_API_URL` | Worker | Yes | YOCO API endpoint (usually `https://online.yoco.com`) |
| `YOCO_SECRET_KEY` | Worker (Secret) | Yes | YOCO API secret key |
| `YOCO_WEBHOOK_SECRET` | Worker (Secret) | No | YOCO webhook signing secret |
| `YOCO_MODE` | Worker | No | `test` or `live` (default: `test`) |
| `SUPABASE_URL` | Worker | Yes | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Worker (Secret) | Yes | Supabase service role key with full DB access |
| `ADMIN_SECRET` | Worker (Secret) | No | Secret for admin API endpoints |
| `MONITORING_WEBHOOK_URL` | Worker | No | Optional webhook for error notifications |
| `SENTRY_DSN` | Worker | No | Sentry project DSN for error tracking |
| `VITE_SENTRY_DSN` | Frontend | No | Client-side Sentry DSN |

## 📝 Configuration Files

- **`vite.config.ts`** — Vite bundler configuration
- **`workers/wrangler.toml`** — Cloudflare Workers configuration
- **`workers/worker.ts`** — Backend API implementation
- **`src/hooks/useCheckout.ts`** — Frontend checkout hook
- **`src/components/sites/VaughnSterling.tsx`** — Example service component with YOCO integration
- **`src/pages/Admin.tsx`** — Admin dashboard for order/payment management

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run end-to-end tests
npm run e2e

# Run tests in watch mode
npm run test:watch
```

## 📖 Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Supabase Docs](https://supabase.com/docs)
- [YOCO Developer Docs](https://developer.yoco.com/)
- [Vite Docs](https://vitejs.dev/)
- [React Docs](https://react.dev/)

See `workers/README.md` for more details on testing webhooks and CI deployment.
