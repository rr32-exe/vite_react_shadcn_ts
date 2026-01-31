# Detailed YOCO Webhook Setup - Step by Step

## Step 1: Access YOCO Dashboard

### Link (Correct)

**[https://app.yoco.com](https://app.yoco.com)** (or [https://www.yoco.com/za/login](https://www.yoco.com/za/login) for South Africa)

### Navigation

1. Open your browser
2. Go to: **[https://app.yoco.com](https://app.yoco.com)**
3. If redirected, log in at: **[https://www.yoco.com/za/login](https://www.yoco.com/za/login)**
4. Log in with your YOCO merchant account credentials
   - Username/Email: Your merchant email
   - Password: Your YOCO password
   - Or use OAuth (Google, Apple, etc. if available)

---

## Step 2: Find the Webhooks Section

Once logged in, look for one of these menu paths (YOCO's UI may vary):

### Path A: Settings > Webhooks (Most Common)

1. Look for **Settings** in the left sidebar menu
2. Under Settings, find **Webhooks** or **Integrations > Webhooks**
3. Click on **Webhooks**

### Path B: Integrations > Webhooks

1. Look for **Integrations** in the main menu
2. Click **Integrations**
3. Select **Webhooks**

### Path C: Developer or API Settings

1. Look for **Developers** or **API** section
2. Find **Webhooks** subsection

**Expected Screen:**

- You should see a list of existing webhooks (may be empty if first time)
- There should be an **"Add Webhook"** or **"+ New Webhook"** button

---

## Step 3: Create a New Webhook

### Click the Add/Create Button

Look for one of these buttons:

- **"+ Add Webhook"**
- **"+ New Webhook"**
- **"Create Webhook"**
- **"Add New Webhook"**

### A form will appear with these fields

#### Field 1: Webhook URL (REQUIRED)

- **Label:** "Webhook URL", "Endpoint URL", or "Target URL"
- **What to paste:** Your worker endpoint

   ```bash
   https://vite-react-shadcn-ts.roosruan32.workers.dev/api/yoco-webhook
   ```

   **If you're using your own domain:**

   ```bash
   https://vaughnsterling.com/api/yoco-webhook
   ```

   Or:

   ```bash
   https://blog.swankyboyz.com/api/yoco-webhook
   ```

#### Field 2: Events to Subscribe (REQUIRED)

This is typically a list of checkboxes. Select these events:

```text
☑ payment.succeeded      (REQUIRED - when payment completes)
☑ payment.failed         (RECOMMENDED - when payment fails)
☑ payment.refunded       (OPTIONAL - for refunds)
☑ charge.completed       (OPTIONAL - additional confirmation)
```

**What each means:**

- **payment.succeeded**: Customer paid successfully → triggers order update to "paid"
- **payment.failed**: Payment declined or error → track failed payments
- **payment.refunded**: Money returned to customer → handle refunds
- **charge.completed**: Final confirmation of charge → additional logging

**Recommendation:** Check ALL of them initially, then narrow down later if needed.

#### Field 3: Event Types (if separate field)

- Event Type: Select **"All Events"** or manually select the ones above

#### Field 4: Active/Enabled (if shown)

- Toggle or checkbox: **Enable/Active** (make sure it's ON)

#### Field 5: Secret/Signing Key (optional at this point)

- Some systems auto-generate this
- Others let you set it
- **IMPORTANT**: Copy this later after creating

---

## Step 4: Save/Create the Webhook

1. **Review your entries:**
   - URL is correct: `https://vite-react-shadcn-ts.roosruan32.workers.dev/api/yoco-webhook`
   - Events are checked
   - Webhook is enabled

2. **Click the button to save:**
   - **"Create Webhook"**
   - **"Add Webhook"**
   - **"Save"**
   - **"Confirm"**

**Success message:** You should see a confirmation like "Webhook created successfully" or the webhook appears in the list.

---

## Step 5: Copy the Webhook Signing Secret

### After creation, find your webhook in the list

1. **Look at the webhooks list**
   - Your newly created webhook should appear

2. **Find the signing secret by:**

   **Option A: Click on the webhook entry**
   - Look for a **"View Details"**, **"Edit"**, or **"Settings"** button
   - The secret will be displayed (often hidden, click to reveal)
   - Label: "Signing Secret", "Webhook Secret", "API Key", or "Secret Key"

   **Option B: Click an icon next to the webhook**
   - Look for an info icon (ⓘ), gear icon (⚙), or three-dots menu (⋮)
   - Click it to view details
   - Find the secret

   **Option C: Hover over the webhook entry**
   - Some systems show a copy button
   - Click to copy the secret to clipboard

3. **Copy the secret:**
   - Click the copy button (usually ⎘ or copy icon)
   - Or manually select and copy it
   - **Keep it safe - don't share this**

### The secret will look like

```text
whsec_live_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
```

or

```text
sk_live_abc123...
```

---

## Step 6: Add the Secret to Your Cloudflare Worker

### Option A: CLI Method (Recommended)

```bash
# Navigate to project root
cd /workspaces/vite_react_shadcn_ts

# Add the secret
wrangler secret put YOCO_WEBHOOK_SECRET

When you press Enter, it will prompt:

```text
? Enter a secret value: █
```

- Paste the signing secret you copied from Step 5
- Press Enter twice (or Ctrl+D)
- You should see: ✓ Set the secret YOCO_WEBHOOK_SECRET

### Option B: Cloudflare Dashboard Method

1. Open: **[https://dash.cloudflare.com](https://dash.cloudflare.com)**
2. Navigate to: **Workers & Pages**
3. Click: **services-api** (your worker)
4. Click: **Settings** tab
5. Left sidebar: Click **Secrets**
6. Click: **Add Secret** button
7. Fill in:
   - **Variable name:** `YOCO_WEBHOOK_SECRET`
   - **Secret value:** [Paste the signing secret from Step 5]
8. Click: **Add Secret**

---

## Step 7: Verify Setup is Complete

### Check 1: Verify Secret is Set

```bash
# List all secrets (values are hidden)
wrangler secret list
```

You should see:

```text
YOCO_WEBHOOK_SECRET
```

### Check 2: Test Webhook Setup

```bash
# Check if webhook is detected
curl https://vite-react-shadcn-ts.roosruan32.workers.dev/api/status | jq .
```

Look for:

```json
{
  "ok": true,
  "yoco": {
    "configured": true,
    "webhookConfigured": true
  }
}
```

If `webhookConfigured` is `false`: Secret not set or wrong name

### Check 3: Send Test Event from YOCO Dashboard

1. Go back to **[https://app.yoco.com](https://app.yoco.com)** or **[https://www.yoco.com/za](https://www.yoco.com/za)**
2. Log in if needed
3. Find your webhook in the list
4. Look for a **"Test"** button or **"Send Test Event"** button
5. Click it
6. A test webhook will be sent to your endpoint
7. Check worker logs to confirm it was received:

```bash
wrangler tail
```

You should see something like:

```text
Yoco webhook received: evt_live_abc123...
Payment recorded: charge_xyz789...
```

---

## Troubleshooting: Can't Find Webhooks Section

### If you're in YOCO Dashboard but can't find Webhooks

**Try these navigation paths:**

1. **Main Menu → Settings**
   - Look for "Settings" at bottom of sidebar
   - Sub-items: API Keys, Webhooks, Integrations

2. **Main Menu → Developers**
   - Some versions organize under "Developers"
   - Look for API/Webhooks there

3. **Main Menu → Integrations**
   - Click "Integrations"
   - Look for "Webhooks" card/option

4. **Main Menu → Account Settings**
   - Sometimes under Account → Webhooks

5. **Search/Help**
   - Use Ctrl+F to search on page for "webhook"
   - Or click help (?) icon and search for "webhooks"

### Contact YOCO Support

If you still can't find it:

- **Support Page:** [https://support.yoco.com](https://support.yoco.com)
- **Email:** <support@yoco.com>
- **Live Chat:** Available in YOCO Dashboard (bottom right)

Tell them: "I need to set up a webhook at [your-url]/api/yoco-webhook"

---

## Quick Visual Guide

```text
YOCO Dashboard ([https://app.yoco.com](https://app.yoco.com))
    │
    └─ [Sidebar Menu]
         ├─ Home
         ├─ Transactions
         ├─ Reports
         ├─ Customers
         ├─ Settings ◄─── CLICK HERE
         │   ├─ Business Settings
         │   ├─ API Keys
         │   ├─ Webhooks ◄─── CLICK HERE
         │   └─ Integrations
         │
         └─ [Webhooks Page]
            ├─ List of Webhooks
            ├─ [+ Add Webhook] Button ◄─── CLICK HERE
            │
            └─ [Webhook Form]
               ├─ Webhook URL: [https://vite-react-shadcn-ts.roosruan32.workers.dev/api/yoco-webhook](https://vite-react-shadcn-ts.roosruan32.workers.dev/api/yoco-webhook)
               ├─ Events: ☑ payment.succeeded
               │           ☑ payment.failed
               │           ☑ payment.refunded
               ├─ Active: ☑ Yes
               └─ [Create/Save] Button ◄─── CLICK HERE

            After Creation:
            ├─ Find your webhook in list
            ├─ Click [View/Details/Settings]
            └─ Copy the "Signing Secret" ◄─── COPY THIS
```

---

## Complete Checklist

- [ ] Logged into **[https://app.yoco.com](https://app.yoco.com)** (or [https://www.yoco.com/za/login](https://www.yoco.com/za/login))
- [ ] Found **Settings > Webhooks** (or similar path)
- [ ] Clicked **"+ Add Webhook"** button
- [ ] Pasted webhook URL: `https://vite-react-shadcn-ts.roosruan32.workers.dev/api/yoco-webhook`
- [ ] Selected events:
  - [ ] payment.succeeded
  - [ ] payment.failed
  - [ ] payment.refunded
- [ ] Enabled the webhook (checked Active/Enabled)
- [ ] Clicked **Create/Save**
- [ ] Copied the **Signing Secret**
- [ ] Ran: `wrangler secret put YOCO_WEBHOOK_SECRET` and pasted the secret
- [ ] Ran: `wrangler secret list` and verified it's listed
- [ ] Tested with `wrangler tail` and sent a test event from YOCO

---

## Next Steps After Setup

Once webhook is confirmed working:

1. **Test a real payment** (in sandbox mode if available)
2. **Verify payment appears** in Supabase `payments` table
3. **Check order status** updated to "paid"
4. **Switch to production** when ready
5. **Monitor logs** for any errors: `wrangler tail`

---

## Support & Additional Resources

**YOCO Official Docs:**

- YOCO API: [https://developer.yoco.com](https://developer.yoco.com)
- YOCO Webhooks: [https://developer.yoco.com/docs/webhooks](https://developer.yoco.com/docs/webhooks) (if available)
- YOCO Support: [https://support.yoco.com](https://support.yoco.com)

**Your Worker Logs:**

```bash
# Stream live logs
wrangler tail

# View error logs only
wrangler tail --status error

# Export logs for debugging
wrangler tail --format json > logs.txt
```

**If Webhook Isn't Triggering:**

1. Check webhook URL is exactly right (copy-paste from YOCO dashboard)
2. Verify secret is set: `wrangler secret list`
3. Test endpoint responds: `curl https://vite-react-shadcn-ts.roosruan32.workers.dev/api/status`
4. Check YOCO dashboard → your webhook → "Recent Deliveries" for error messages
5. View worker logs: `wrangler tail --status error`

---

## Got Stuck?

**Common Issues & Solutions:**

| Problem | Solution |
| ------- | --------- |
| Can't find Webhooks section | Try Settings > Integrations > Webhooks, or search "webhook" on page |
| "Invalid URL" error | Make sure URL is HTTPS and includes `/api/yoco-webhook` path |
| Webhook appears but no signature secret | Click on webhook entry and look for "View Details" or settings icon |
| Secret set but webhook still not working | Run `npm run deploy:workers` to redeploy with new secret |
| Test event fails in YOCO | Check that webhook URL is 100% correct, test with curl first |

**Still stuck? Check:**

1. Worker logs: `wrangler tail`
2. YOCO dashboard webhook delivery logs
3. Cloudflare dashboard → Workers → services-api → Real-time logs
