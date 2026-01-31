# Worker Routes & Secrets Setup Guide

## Part 1: Adding Worker Routes in Cloudflare Dashboard

### Method A: Using Workers Routes (Recommended)

1. **Log into Cloudflare Dashboard**
   - Go to: [https://dash.cloudflare.com](https://dash.cloudflare.com)

2. **Navigate to Workers & Pages**
   - Left sidebar → **Workers & Pages**

3. **Select Your Worker**
   - Click: **services-api** (your worker name)

4. **Go to Settings → Routes**
   - Click **Settings** tab
   - Click **Routes** (left sidebar under the worker name)

5. **Add Routes for Each Domain**
   - Click **Add Route** button
   - Add these routes (one by one):

   ```text
   Route Pattern:                    Zone
   ─────────────────────────────────────────────────────
   blog.swankyboyz.com/*             swankyboyz.com
   blog.vaughnsterlingtours.com/*    vaughnsterlingtours.com
   vaughnsterling.com/*              vaughnsterling.com
   www.vaughnsterling.com/*          vaughnsterling.com
   ```

   - For each route, select your **Zone** from dropdown
   - Click **Add Route** to save each one

6. **Verify Routes Added**
   - You should see all 4 routes listed under "Routes"


### Method B: Using DNS CNAME Records (Alternative)

If you prefer DNS routing instead:

1. **For swankyboyz.com:**
   - Go to: DNS records for swankyboyz.com
   - Add CNAME record:
     - **Name:** `blog`
     - **Value:** `vite-react-shadcn-ts.roosruan32.workers.dev`
     - **TTL:** Auto
     - **Proxy Status:** Proxied (orange cloud)

2. **For vaughnsterlingtours.com:**
   - Add CNAME record:
     - **Name:** `blog`
     - **Value:** `vite-react-shadcn-ts.roosruan32.workers.dev`
     - **Proxy Status:** Proxied

3. **For vaughnsterling.com:**
   - Add CNAME record for root:
     - **Name:** `@` (or your domain apex)
     - **Value:** `vite-react-shadcn-ts.roosruan32.workers.dev`
     - **Proxy Status:** Proxied
   
   - Add CNAME for www:
     - **Name:** `www`
     - **Value:** `vite-react-shadcn-ts.roosruan32.workers.dev`
     - **Proxy Status:** Proxied

---

## Part 2: Adding Worker Secrets and Variables

### Method A: Using wrangler CLI (Recommended for automation)

1. **Authenticate with Wrangler**

   ```bash
   wrangler login
   # Or if you have an API token:
   export CLOUDFLARE_API_TOKEN="your_token_here"
   ```

2. **Add YOCO Secrets**

   ```bash
   # Navigate to project root
   cd /workspaces/vite_react_shadcn_ts

   # Add YOCO Secret Key (required)
   wrangler secret put YOCO_SECRET_KEY
   # Paste your YOCO secret key when prompted, then press Enter twice

   # Add YOCO Webhook Secret (optional, for webhook validation)
   wrangler secret put YOCO_WEBHOOK_SECRET
   # Paste your YOCO webhook secret when prompted
   ```

3. **Add Supabase Secrets**

   ```bash
   # Add Supabase Service Role Key (required)
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   # Paste your Supabase service role key when prompted

   # Add Supabase URL (optional - can be a variable instead)
   wrangler secret put SUPABASE_URL
   # Paste your Supabase URL (e.g., https://xyz.supabase.co)
   ```

4. **Add Admin Secrets**

   ```bash
   # Admin Secret for securing admin endpoints
   wrangler secret put ADMIN_SECRET
   # Create a strong random secret (e.g., use: openssl rand -hex 32)

   # (Optional) Admin JWT Secret for token signing
   wrangler secret put ADMIN_JWT_SECRET
   # Create another strong random secret
   ```

5. **Verify Secrets Added**

   ```bash
   # List all secrets (note: values are hidden for security)
   wrangler secret list
   ```

### Method B: Using Cloudflare Dashboard

1. **Navigate to Worker Settings**
   - Cloudflare Dashboard → **Workers & Pages**
   - Select **services-api** worker
   - Click **Settings** tab

2. **Go to Secrets**
   - Left sidebar → **Secrets** (under the worker name)

3. **Add Each Secret**
   - Click **Add Secret** button
   - Enter secret name (e.g., `YOCO_SECRET_KEY`)
   - Paste the secret value
   - Click **Add Secret** to save
   - Repeat for each secret

4. **Required Secrets to Add**

   - `YOCO_SECRET_KEY` - Your YOCO API secret key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   - `ADMIN_SECRET` - Strong random string for admin protection
   - `YOCO_WEBHOOK_SECRET` (optional) - For webhook signature validation
   - `ADMIN_JWT_SECRET` (optional) - For admin token signing

---

## Part 3: Adding Variables (Non-Secret Configuration)

### Method A: Using wrangler CLI

```bash
# View current vars
wrangler env vars show

# Add SUPABASE_URL as variable (less sensitive than secret)
wrangler env vars set SUPABASE_URL "https://your-project.supabase.co"

# Add YOCO_API_URL
wrangler env vars set YOCO_API_URL "https://online.yoco.com"

# Add admin settings
wrangler env vars set ADMIN_USERNAME "admin"
wrangler env vars set ADMIN_JWT_EXPIRES "86400"
```

### Method B: Using Cloudflare Dashboard

1. **Navigate to Vars**
   - Cloudflare Dashboard → **Workers & Pages** → **services-api**
   - Click **Settings** → **Vars** (left sidebar)

2. **Add Variables**

   - Click **Add Variable** button
   - Enter name and value
   - Click **Add Variable**

3. **Recommended Variables to Add**
   ```
   Variable Name              Example Value                          Required?
   ─────────────────────────────────────────────────────────────────────────
   SUPABASE_URL               https://xyz.supabase.co                Yes
   YOCO_API_URL               https://online.yoco.com                Yes
   RATE_LIMIT_MAX             60                                     No (default: 60)
   RATE_LIMIT_WINDOW          60                                     No (default: 60)
   ADMIN_USERNAME             admin                                  No
   ADMIN_JWT_EXPIRES          86400                                  No
   MONITORING_WEBHOOK_URL     https://your-webhook-url              No
   SENTRY_DSN                 https://key@sentry.io/projectid       No
   ```

---

## Part 4: Using the Interactive Setup Script

The easiest way to configure everything at once:

```bash
cd /workspaces/vite_react_shadcn_ts

# Run the interactive setup script
npm run setup:workers
```

This will prompt you for:

- YOCO API credentials
- Supabase details
- Admin settings
- GitHub OAuth (optional)
- Database migrations (optional)
- Automated deployment option

**Follow the prompts and enter your values when asked.**

---

## Part 5: Verifying Your Setup

### Test Secrets Are Working

```bash
# Verify worker can access secrets
wrangler tail --format json | head -20

# Or test an API endpoint that uses secrets
curl -X POST https://vite-react-shadcn-ts.roosruan32.workers.dev/api/contact-submit \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Test message"}'
```

### Test Domain Routes

Once you've added the routes, test them:

```bash
# Test SwankyBoyz route
curl -I https://blog.swankyboyz.com

# Test VaughnSterling root domain
curl -I https://vaughnsterling.com

# Test API endpoint with domain
curl -X POST https://vaughnsterling.com/api/contact-submit \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Hello"}'
```

### Check Worker Logs

```bash
# Stream live logs from your worker
wrangler tail

# View error logs
wrangler tail --status error
```

---

## Part 6: Environment Variables Reference

### Required Configuration

| Variable | Type | Purpose | Example |
|----------|------|---------|---------|
| `SUPABASE_URL` | Variable/Secret | Database URL | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Database auth key | `eyJhbG...` |
| `YOCO_SECRET_KEY` | Secret | YOCO API key | `sk_live_...` |
| `YOCO_API_URL` | Variable | YOCO endpoint | `https://online.yoco.com` |
| `ADMIN_SECRET` | Secret | Admin protection | (random: `openssl rand -hex 32`) |

### Optional Configuration

| Variable | Type | Purpose | Default |
|----------|------|---------|---------|
| `YOCO_WEBHOOK_SECRET` | Secret | Webhook validation | (none) |
| `ADMIN_JWT_SECRET` | Secret | Token signing | (none) |
| `RATE_LIMIT_MAX` | Variable | Max requests/window | `60` |
| `RATE_LIMIT_WINDOW` | Variable | Time window (sec) | `60` |
| `MONITORING_WEBHOOK_URL` | Variable | Error alerts | (none) |
| `SENTRY_DSN` | Variable | Error tracking | (none) |

---

## Part 7: Troubleshooting

### "Route already exists" Error
- Each route must be unique; check you're not adding duplicates
- Routes are per-zone, so same path can exist on different zones

### "Secret not found" Error
- Deploy the worker after adding secrets: `npm run deploy:workers`
- Secrets take ~30 seconds to propagate

### Domain Not Resolving
- Verify DNS/route added in Cloudflare Dashboard
- Check domain is in the correct Cloudflare account
- Wait 5-10 minutes for DNS to propagate

### API Returning 500 Errors
- Check worker logs: `wrangler tail --status error`
- Verify secrets are set: `wrangler secret list`
- Ensure SUPABASE_URL and credentials are correct

---

## Quick Checklist

- [ ] Added 4 worker routes (or 4 DNS CNAMEs)
- [ ] Added YOCO_SECRET_KEY secret
- [ ] Added SUPABASE_SERVICE_ROLE_KEY secret
- [ ] Added SUPABASE_URL variable
- [ ] Added YOCO_API_URL variable
- [ ] Added ADMIN_SECRET secret
- [ ] Deployed worker: `npm run deploy:workers`
- [ ] Tested domains: `curl -I https://vaughnsterling.com`
- [ ] Tested API: `curl -X POST https://vaughnsterling.com/api/status`
- [ ] Verified worker logs: `wrangler tail`

---

## Need More Help?

For detailed Cloudflare docs:
- Workers Routes: https://developers.cloudflare.com/workers/wrangler/configuration/sites/
- Secrets Management: https://developers.cloudflare.com/workers/wrangler/configuration/environment-variables/
- DNS CNAME Setup: https://developers.cloudflare.com/dns/manage-dns-records/reference/dns-record-types/cname/
