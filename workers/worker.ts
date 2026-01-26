/* Cloudflare Worker that implements three endpoints:
   - POST /api/create-checkout
   - POST /api/contact-submit
   - POST /api/newsletter-subscribe

   Uses environment variables (set with `wrangler secret put` or via `vars`):
   - PAYSTACK_SECRET_KEY (secret)
   - SUPABASE_URL (secret or var, e.g., https://xyz.supabase.co)
   - SUPABASE_SERVICE_ROLE_KEY (secret)

   Implementation notes:
   - Uses Supabase REST (PostgREST) with the Service Role key to insert/upsert rows.
   - Uses Paystack REST API to initialize transactions (no SDK required).
*/

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

// Basic in-memory rate limiter map. Note: this is instance-local and not globally consistent.
const RATE_MAP: Map<string, { count: number; resetAt: number }> = new Map();

function getClientIP(request: Request) {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
}

function getRateLimitHeaders(key: string, max: number, windowSec: number) {
  const now = Date.now();
  const state = RATE_MAP.get(key) || { count: 0, resetAt: now + windowSec * 1000 };
  const remaining = Math.max(0, max - state.count);
  const retryAfter = Math.ceil(Math.max(0, (state.resetAt - now) / 1000));
  return { remaining, resetAt: state.resetAt, retryAfter };
}

function incrementRate(key: string, max: number, windowSec: number) {
  const now = Date.now();
  const state = RATE_MAP.get(key);
  if (!state || state.resetAt < now) {
    RATE_MAP.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { count: 1, resetAt: now + windowSec * 1000 };
  }
  state.count += 1;
  return state;
}


function jsonResponse(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}

export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response('ok', { headers: CORS_HEADERS });
    }

    try {
      // Apply rate limit to public endpoints
      const publicPaths = ['/api/create-checkout', '/api/contact-submit', '/api/newsletter-subscribe'];
      if (publicPaths.includes(url.pathname) && request.method === 'POST') {
        const ip = getClientIP(request);
        const max = Number(env.RATE_LIMIT_MAX || 60);
        const windowSec = Number(env.RATE_LIMIT_WINDOW || 60);
        const key = `${ip}:${url.pathname}`;
        const state = incrementRate(key, max, windowSec);
        if (state.count > max) {
          const headers = { 'Retry-After': String(Math.ceil((state.resetAt - Date.now()) / 1000)), ...CORS_HEADERS };
          return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { 'Content-Type': 'application/json', ...headers } });
        }
      }

      if (url.pathname === '/api/create-checkout' && request.method === 'POST') {
        return handleCreateCheckout(request, env);
      }

      if (url.pathname === '/api/contact-submit' && request.method === 'POST') {
        return handleContactSubmit(request, env);
      }

      if (url.pathname === '/api/newsletter-subscribe' && request.method === 'POST') {
        return handleNewsletterSubscribe(request, env);
      }

      if (url.pathname === '/api/status' && request.method === 'GET') {
        return handleStatus(request, env);
      }

      if (url.pathname === '/api/paystack-webhook' && request.method === 'POST') {
        return handlePaystackWebhook(request, env);
      }

      if (url.pathname === '/api/paypal-webhook' && request.method === 'POST') {
        return handlePayPalWebhook(request, env);
      }

      if (url.pathname === '/api/yoco-webhook' && request.method === 'POST') {
        return handleYocoWebhook(request, env);
      }

      if (url.pathname === '/api/create-paypal-order' && request.method === 'POST') {
        return handleCreatePayPalOrder(request, env);
      }

      // Yoco flow (VaughnSterling payments)
      if (url.pathname === '/api/create-yoco-charge' && request.method === 'POST') {
        return handleCreateYocoCharge(request, env);
      }

      if (url.pathname === '/api/admin/login' && request.method === 'POST') {
        return handleAdminLogin(request, env);
      }

      if (url.pathname === '/api/auth/github/start' && request.method === 'GET') {
        return handleGithubStart(request, env);
      }

      if (url.pathname === '/api/auth/github/callback' && request.method === 'GET') {
        return handleGithubCallback(request, env);
      }

      if (url.pathname.startsWith('/api/admin') && request.method === 'GET') {
        return handleAdminRequest(request, env);
      }

      return new Response('Not Found', { status: 404 });
    } catch (err: any) {
      console.error('Uncaught error:', err);
      try { await sendToSentry(err, env); } catch(e) { console.error('Sentry send failed', e); }
      return jsonResponse({ error: err?.message || 'Internal server error' }, 500);
    }
  }
};

/* --- Helpers & Endpoint Implementations --- */

const services: Record<string, { name: string; price: number; currency: string }> = {
  s1: { name: 'Custom AI-Powered Niche Site', price: 8000, currency: 'ZAR' },
  s2: { name: '30 AI-Generated Articles', price: 5000, currency: 'ZAR' },
  s3: { name: 'Full Automation Setup', price: 15000, currency: 'ZAR' },
  s4: { name: 'Strategy Consulting (1 Hour)', price: 800, currency: 'ZAR' }
};

async function handleCreateCheckout(request: Request, env: any) {
  const paystackKey = env.PAYSTACK_SECRET_KEY;
  if (!paystackKey) return jsonResponse({ error: 'Paystack not configured' }, 500);

  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return jsonResponse({ error: 'Supabase not configured' }, 500);

  const payload = await request.json();
  const { serviceId, customerName, customerEmail, notes, successUrl, cancelUrl } = payload;

  if (!serviceId || !customerName || !customerEmail) {
    return jsonResponse({ error: 'Service ID, customer name, and email are required' }, 400);
  }

  const service = services[serviceId];
  if (!service) return jsonResponse({ error: 'Invalid service ID' }, 400);

  // Calculate amounts (cents)
  const totalAmountCents = Math.round(service.price * 100);
  const depositAmountCents = Math.round(totalAmountCents / 2);

  // Create order row in Supabase via REST
  const orderResp = await fetch(`${supabaseUrl}/rest/v1/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: 'return=representation'
    },
    body: JSON.stringify([{
      customer_name: customerName,
      customer_email: customerEmail.toLowerCase(),
      service_id: serviceId,
      service_name: service.name,
      total_amount: totalAmountCents,
      deposit_amount: depositAmountCents,
      currency: service.currency,
      notes: notes || null,
      status: 'pending'
    }])
  });

  if (!orderResp.ok) {
    const errText = await orderResp.text();
    console.error('Order creation failed:', errText);
    return jsonResponse({ error: 'Failed to create order' }, 500);
  }

  const orderRows = await orderResp.json();
  const order = orderRows[0];

  // Initialize Paystack transaction (returns authorization_url and reference)
  const initResp = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${paystackKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: customerEmail.toLowerCase(),
      amount: depositAmountCents,
      currency: service.currency,
      callback_url: successUrl || `${request.headers.get('origin')}/payment-success?reference={reference}`,
      metadata: {
        order_id: order.id,
        service_id: serviceId,
        service_name: service.name,
        customer_name: customerName,
        payment_type: 'deposit'
      }
    })
  });

  const initBody = await initResp.json();
  if (!initResp.ok) {
    console.error('Paystack error:', initBody);
    return jsonResponse({ error: initBody.message || 'Failed to initialize Paystack transaction' }, 500);
  }

  const reference = initBody.data?.reference;
  const authorizationUrl = initBody.data?.authorization_url;

  // Update order with paystack_reference (schema migration to add this column will be applied separately)
  try {
    await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: 'return=representation'
      },
      body: JSON.stringify({ paystack_reference: reference })
    });
  } catch (err) {
    console.error('Failed to update order with paystack reference:', err);
  }

  // Keep response shape similar to previous Stripe-based API so frontend continues to work
  return jsonResponse({
    success: true,
    sessionId: reference,
    sessionUrl: authorizationUrl,
    orderId: order.id,
    depositAmount: depositAmountCents / 100,
    totalAmount: totalAmountCents / 100,
    currency: service.currency
  });
}

async function handleContactSubmit(request: Request, env: any) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return jsonResponse({ error: 'Supabase not configured' }, 500);

  const payload = await request.json();
  const { name, email, message, service, site = 'vaughnsterling' } = payload;

  if (!name || !email || !message) {
    return jsonResponse({ error: 'Name, email, and message are required' }, 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return jsonResponse({ error: 'Invalid email format' }, 400);

  const resp = await fetch(`${supabaseUrl}/rest/v1/contact_submissions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: 'return=representation'
    },
    body: JSON.stringify([{
      name,
      email: email.toLowerCase(),
      message,
      service,
      site
    }])
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error('Contact DB error:', err);
    return jsonResponse({ error: 'Failed to submit contact form' }, 500);
  }

  const data = (await resp.json())[0];
  return jsonResponse({ success: true, message: "Message sent successfully! I'll get back to you within 24 hours.", data });
}

async function handleNewsletterSubscribe(request: Request, env: any) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return jsonResponse({ error: 'Supabase not configured' }, 500);

  const payload = await request.json();
  const { email, site, leadMagnet } = payload;

  if (!email || !site) return jsonResponse({ error: 'Email and site are required' }, 400);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return jsonResponse({ error: 'Invalid email format' }, 400);

  const validSites = ['swankyboyz', 'vaughnsterlingtours', 'vaughnsterling'];
  if (!validSites.includes(site)) return jsonResponse({ error: 'Invalid site' }, 400);

  // Upsert using PostgREST 'on_conflict' query param
  const resp = await fetch(`${supabaseUrl}/rest/v1/newsletter_subscribers?on_conflict=email,site`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: 'return=representation'
    },
    body: JSON.stringify([{
      email: email.toLowerCase(),
      site,
      lead_magnet: leadMagnet
    }])
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error('Subscribe DB error:', err);
    return jsonResponse({ error: 'Failed to subscribe' }, 500);
  }

  const data = (await resp.json())[0];
  return jsonResponse({ success: true, message: 'Successfully subscribed!', data });
}

// Lightweight status endpoint for smoke tests and quick checks
async function handleStatus(request: Request, env: any) {
  const paystackConfigured = Boolean(env.PAYSTACK_SECRET_KEY);
  const paystackWebhookConfigured = Boolean(env.PAYSTACK_WEBHOOK_SECRET);
  const supabaseConfigured = Boolean(env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_URL);
  const paystackMode = env.PAYSTACK_MODE || (paystackConfigured ? 'unknown' : 'unset');
  return jsonResponse({ ok: true, paystack: { configured: paystackConfigured, webhookConfigured: paystackWebhookConfigured, mode: paystackMode }, supabase: { configured: supabaseConfigured }, env: { worker_env: env.WORKER_ENV || null } });
}

/* --- Utility: retry + monitoring --- */

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryFetchJson(url: string, options: RequestInit, attempts = 3, backoffMs = 250) {
  let lastErr: any = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const resp = await fetch(url, options);
      if (resp.ok) return resp;
      lastErr = await resp.text();
      // non-200 response: retry
    } catch (err) {
      lastErr = err;
    }
    await sleep(backoffMs * Math.pow(2, i));
  }
  throw new Error(`Failed after ${attempts} attempts: ${lastErr}`);
}

async function sendMonitoringAlert(env: any, payload: any) {
  const url = env.MONITORING_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (err) {
    console.error('Failed to post monitoring alert', err);
  }
}

/* --- Sentry (lightweight) --- */

function parseDsn(dsn: string) {
  // DSN format: https://public_key@o0.ingest.sentry.io/project_id
  try {
    const u = new URL(dsn);
    const path = u.pathname.replace(/^\//, '');
    const projectId = path.split('/').pop();
    const publicKey = u.username || (u.href.match(/https:\/\/([^@]+)@/) || [])[1];
    return { host: u.origin, projectId, publicKey };
  } catch (err) {
    return null;
  }
}

async function sendToSentry(err: any, env: any) {
  const dsn = env.SENTRY_DSN || env.SENTRY_DSN_PUBLIC || null;
  if (!dsn) return;
  const parsed = parseDsn(dsn);
  if (!parsed || !parsed.projectId) return;
  const url = `${parsed.host}/api/${parsed.projectId}/store/`;
  const extra: any = { worker_env: 'cloudflare' };
  // Add release and environment tags if present
  if (env.SENTRY_RELEASE) {
    extra.release = env.SENTRY_RELEASE;
  }
  if (env.WORKER_ENV) {
    extra.worker_env_name = env.WORKER_ENV;
  }
  const event: any = {
    event_id: (Math.random() + 1).toString(36).substring(2, 12),
    message: String(err?.message || err),
    platform: 'javascript',
    logger: 'worker',
    exception: [{ value: String(err?.stack || err), type: err?.name || 'Error' }],
    level: 'error',
    timestamp: new Date().toISOString(),
    extra
  };

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${parsed.publicKey}`
      },
      body: JSON.stringify(event)
    });
  } catch (e) {
    console.error('Failed to send to Sentry', e);
  }
}

/* --- JWT-based admin auth helpers --- */

function base64UrlEncode(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((b) => binary += String.fromCharCode(b));
  const b64 = btoa(binary);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlEncodeStr(str: string) {
  const enc = new TextEncoder().encode(str);
  return base64UrlEncode(enc as Uint8Array);
}

async function hmacSha256Base64Url(secret: string, data: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return base64UrlEncode(new Uint8Array(sig));
}

async function signJwt(payload: any, secret: string, expiresInSec = 86400) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  payload.iat = now;
  payload.exp = now + expiresInSec;
  const toSign = `${base64UrlEncodeStr(JSON.stringify(header))}.${base64UrlEncodeStr(JSON.stringify(payload))}`;
  const signature = await hmacSha256Base64Url(secret, toSign);
  return `${toSign}.${signature}`;
}

async function verifyJwt(token: string, secret: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sig] = parts;
    const data = `${headerB64}.${payloadB64}`;
    const expected = await hmacSha256Base64Url(secret, data);
    if (!secureCompare(expected, sig)) return null;
    const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) return null;
    return payload;
  } catch (err) {
    return null;
  }
}


/* --- Admin endpoints (read-only) --- */

async function handleAdminRequest(request: Request, env: any) {
  // Prefer JWT-based auth; fall back to legacy ADMIN_SECRET only if set (deprecated)
  const adminJwtSecret = env.ADMIN_JWT_SECRET;
  const adminSecret = env.ADMIN_SECRET; // legacy
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  let authorized = false;
  if (token && adminJwtSecret) {
    const payload = await verifyJwt(token, adminJwtSecret);
    if (payload && payload.role === 'admin') authorized = true;
  }
  // legacy secret check
  if (!authorized && adminSecret) {
    const headerSecret = request.headers.get('x-admin-secret') || '';
    if (headerSecret === adminSecret) authorized = true;
  }
  if (!authorized) return new Response('Unauthorized', { status: 401 });

  const url = new URL(request.url);
  const path = url.pathname.replace('/api/admin', ''); // /orders or /payments
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return jsonResponse({ error: 'Supabase not configured' }, 500);

  // parse query params
  const query = url.searchParams;
  const id = query.get('id');
  const email = query.get('email');
  const limit = Math.min(Number(query.get('limit') || '100'), 1000);

  try {
    if (path === '/orders.csv' || path === '/orders') {
      let endpoint = `${supabaseUrl}/rest/v1/orders?select=*&limit=${limit}&order=created_at.desc`;
      if (id) endpoint = `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`;
      else if (email) endpoint = `${supabaseUrl}/rest/v1/orders?customer_email=eq.${encodeURIComponent(email)}&limit=${limit}`;

      const resp = await fetch(endpoint, { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } });
      if (!resp.ok) return jsonResponse({ error: await resp.text() }, 500);
      const rows = await resp.json();
      if (path === '/orders.csv') {
        // Return CSV
        const header = ['id','customer_name','customer_email','service_id','service_name','total_amount','deposit_amount','currency','status','stripe_session_id','paystack_reference','created_at'];
        const csv = [header.join(',')].concat(rows.map((r: any) => header.map(h => `"${String(r[h] ?? '')}"`).join(','))).join('\n');
        return new Response(csv, { headers: { 'Content-Type': 'text/csv', ...CORS_HEADERS } });
      }
      return jsonResponse({ success: true, data: rows });
    }

    if (path === '/payments' || path === '/payments/') {
      let endpoint = `${supabaseUrl}/rest/v1/payments?select=*&limit=${limit}&order=created_at.desc`;
      if (id) endpoint = `${supabaseUrl}/rest/v1/payments?id=eq.${encodeURIComponent(id)}`;
      else if (query.get('stripe_payment_intent')) endpoint = `${supabaseUrl}/rest/v1/payments?stripe_payment_intent=eq.${encodeURIComponent(query.get('stripe_payment_intent') || '')}`;
      else if (query.get('paystack_reference')) endpoint = `${supabaseUrl}/rest/v1/payments?paystack_reference=eq.${encodeURIComponent(query.get('paystack_reference') || '')}`;
      else if (query.get('paystack_transaction_id')) endpoint = `${supabaseUrl}/rest/v1/payments?paystack_transaction_id=eq.${encodeURIComponent(query.get('paystack_transaction_id') || '')}`;

      const resp = await fetch(endpoint, { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } });
      const rows = resp.ok ? await resp.json() : { error: await resp.text() };
      return jsonResponse({ success: true, data: rows });
    }

    return jsonResponse({ error: 'Unknown admin path' }, 400);
  } catch (err: any) {
    console.error('Admin handler error', err);
    await sendMonitoringAlert(env, { level: 'error', action: 'admin', error: String(err) });
    return jsonResponse({ error: 'Internal error' }, 500);
  }
}

/* --- Admin Login & OAuth --- */

async function handleAdminLogin(request: Request, env: any) {
  const { username, password } = await request.json();
  const adminUser = env.ADMIN_USERNAME;
  const adminPass = env.ADMIN_PASSWORD;
  const jwtSecret = env.ADMIN_JWT_SECRET;
  const jwtExpiry = Number(env.ADMIN_JWT_EXPIRES || '86400');
  if (!adminUser || !adminPass || !jwtSecret) return jsonResponse({ error: 'Admin login not configured' }, 500);
  if (username !== adminUser || password !== adminPass) return jsonResponse({ error: 'Invalid credentials' }, 401);
  const token = await signJwt({ role: 'admin', username }, jwtSecret, jwtExpiry);
  return jsonResponse({ token, expiresIn: jwtExpiry });
}

async function handleGithubStart(request: Request, env: any) {
  const clientId = env.GITHUB_CLIENT_ID;
  const redirectUri = `${request.headers.get('origin')}/api/auth/github/callback`;
  const state = Math.random().toString(36).substring(2);
  // store state in KV with TTL (5 minutes)
  try {
    if (env.OAUTH_KV) await env.OAUTH_KV.put(`gh_state:${state}`, '1', { expirationTtl: 300 });
  } catch (err) {
    console.warn('Failed to store state in KV', err);
  }
  const url = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=read:user%20read:org`;
  return Response.redirect(url, 302);
}

async function handleGithubCallback(request: Request, env: any) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;
  if (!code || !clientId || !clientSecret) return new Response('Bad Request', { status: 400 });

  // Verify state from KV
  try {
    if (env.OAUTH_KV) {
      const v = await env.OAUTH_KV.get(`gh_state:${state}`);
      if (!v) return new Response('Invalid or expired state', { status: 400 });
      // delete key
      await env.OAUTH_KV.delete(`gh_state:${state}`);
    }
  } catch (err) {
    console.warn('KV check failed for state', err);
  }

  // Exchange code for token
  const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
  });
  const tokenJson = await tokenResp.json();
  const accessToken = tokenJson.access_token;
  if (!accessToken) return new Response('GitHub auth failed', { status: 400 });

  // Fetch user
  const userResp = await fetch('https://api.github.com/user', { headers: { Authorization: `token ${accessToken}`, 'User-Agent': 'worker' } });
  const userJson = await userResp.json();
  const login = userJson.login;

  // optional allowlist
  const allowUsers = (env.ADMIN_GITHUB_USERS || '').split(',').map((s: string) => s.trim()).filter(Boolean);
  if (allowUsers.length > 0 && !allowUsers.includes(login)) return new Response('Unauthorized', { status: 401 });

  // optional org membership check
  const allowOrgs = (env.ADMIN_GITHUB_ORGS || '').split(',').map((s: string) => s.trim()).filter(Boolean);
  if (allowOrgs.length > 0) {
    const orgsResp = await fetch('https://api.github.com/user/orgs', { headers: { Authorization: `token ${accessToken}`, 'User-Agent': 'worker' } });
    if (!orgsResp.ok) return new Response('Failed to check orgs', { status: 500 });
    const orgsJson = await orgsResp.json();
    const memberOrgs = orgsJson.map((o: any) => o.login);
    const isMember = allowOrgs.some((o: string) => memberOrgs.includes(o));
    if (!isMember) return new Response('Unauthorized (org membership required)', { status: 401 });
  }

  // issue JWT and redirect back to admin UI
  const jwtSecret = env.ADMIN_JWT_SECRET;
  const jwtExpiry = Number(env.ADMIN_JWT_EXPIRES || '86400');
  const token = await signJwt({ role: 'admin', username: login, provider: 'github' }, jwtSecret, jwtExpiry);
  const redirectTo = `${request.headers.get('origin')}/admin?token=${encodeURIComponent(token)}`;
  return Response.redirect(redirectTo, 302);
}

// Legacy Stripe webhook handling removed — Paystack is the supported payments provider now.
// If you need Stripe support in future, reintroduce Stripe-specific handlers and signature verification. 

function secureCompare(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function hmacSHA512Hex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function handlePaystackWebhook(request: Request, env: any) {
  const webhookSecret = env.PAYSTACK_WEBHOOK_SECRET;
  const payload = await request.text();
  const sigHeader = request.headers.get('x-paystack-signature') || '';

  if (webhookSecret) {
    let expected: string;
    try {
      expected = await hmacSHA512Hex(webhookSecret, payload);
    } catch (err) {
      console.error('Failed computing HMAC for Paystack webhook', err);
      return new Response(JSON.stringify({ error: 'Webhook verification error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
    }
    if (!secureCompare(expected, sigHeader)) {
      console.error('Invalid Paystack webhook signature');
      await sendMonitoringAlert(env, { level: 'warn', action: 'webhook_invalid_signature', ip: getClientIP(request) });
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
    }
  }

  let event: any;
  try {
    event = JSON.parse(payload);
  } catch (err) {
    console.error('Invalid Paystack JSON payload', err);
    await sendMonitoringAlert(env, { level: 'error', action: 'webhook_invalid_json', error: String(err) });
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  }

  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase not configured (paystack webhook)');
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  }

  try {
    const type = event.event || event.type || (event.data && event.data.event) || null;

    if (type === 'charge.success' || type === 'transaction.success' || type === 'transfer.success' || (event.data && event.data.status === 'success')) {
      const data = event.data || {};
      const reference = data.reference || null;
      const transactionId = data.id || null;
      const amount = data.amount || 0;
      const currency = data.currency || null;
      const orderId = data.metadata?.order_id ? Number(data.metadata.order_id) : null;

      // Idempotency check: does a payment with this paystack_reference already exist?
      if (reference) {
        const existsResp = await fetch(`${supabaseUrl}/rest/v1/payments?paystack_reference=eq.${encodeURIComponent(reference)}`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
        });
        if (existsResp.ok) {
          const rows = await existsResp.json();
          if (rows && rows.length > 0) {
            console.log('Payment already recorded for', reference);
            // still ensure order status set to paid
            if (orderId) {
              await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
                body: JSON.stringify({ status: 'paid', updated_at: new Date().toISOString() })
              });
            } else if (reference) {
              await fetch(`${supabaseUrl}/rest/v1/orders?paystack_reference=eq.${encodeURIComponent(reference)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
                body: JSON.stringify({ status: 'paid', updated_at: new Date().toISOString() })
              });
            }
            return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
          }
        }
      }

      // Insert payment record (with retries)
      try {
        const paymentInsertOptions: RequestInit = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Prefer: 'return=representation' },
          body: JSON.stringify([{
            order_id: orderId,
            paystack_reference: reference,
            paystack_transaction_id: transactionId,
            amount: amount,
            currency: currency,
            status: 'succeeded',
            raw: event
          }])
        };
        try {
          await retryFetchJson(`${supabaseUrl}/rest/v1/payments`, paymentInsertOptions, 4, 200);
        } catch (err) {
          console.error('Failed to insert payment after retries:', err);
          await sendMonitoringAlert(env, { level: 'error', action: 'insert_payment', error: String(err), event });
        }
      } catch (err) {
        console.error('Error inserting payment:', err);
      }

      // Update order status (with retries)
      const patchOptions: RequestInit = {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ status: 'paid', updated_at: new Date().toISOString() })
      };
      try {
        if (orderId) {
          await retryFetchJson(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, patchOptions, 4, 200);
        } else if (reference) {
          await retryFetchJson(`${supabaseUrl}/rest/v1/orders?paystack_reference=eq.${encodeURIComponent(reference)}`, patchOptions, 4, 200);
        }
      } catch (err) {
        console.error('Failed to update order status after retries:', err);
        await sendMonitoringAlert(env, { level: 'error', action: 'update_order', error: String(err), reference, orderId });
      }

      return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
    }

    // For other events, acknowledge
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  } catch (err: any) {
    console.error('Paystack webhook handling error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Webhook handling error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  }
}

// ----------------- PayPal POC handlers -----------------

let _paypalTokenCache: { token?: string; expiry?: number } = {};

function getPayPalBaseUrl(env: any) {
  return (env.PAYPAL_MODE && env.PAYPAL_MODE.toLowerCase() === 'live') ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

async function getPayPalAccessToken(env: any) {
  const now = Date.now();
  if (_paypalTokenCache.token && _paypalTokenCache.expiry && _paypalTokenCache.expiry > now) return _paypalTokenCache.token;

  const clientId = env.PAYPAL_CLIENT_ID;
  const clientSecret = env.PAYPAL_SECRET;
  if (!clientId || !clientSecret) throw new Error('PayPal not configured');
  const base = getPayPalBaseUrl(env);

  const resp = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64') },
    body: 'grant_type=client_credentials'
  });
  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`PayPal token request failed: ${errBody}`);
  }
  const body = await resp.json();
  const token = body.access_token;
  const expiresIn = Number(body.expires_in || 300);
  _paypalTokenCache = { token, expiry: Date.now() + (expiresIn - 10) * 1000 };
  return token;
}

async function handleCreatePayPalOrder(request: Request, env: any) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return jsonResponse({ error: 'Supabase not configured' }, 500);

  const payload = await request.json();
  const { serviceId, customerName, customerEmail, successUrl, cancelUrl } = payload;
  if (!serviceId || !customerName || !customerEmail) return jsonResponse({ error: 'Service ID, customer name, and email are required' }, 400);
  const service = services[serviceId];
  if (!service) return jsonResponse({ error: 'Invalid service ID' }, 400);

  // create order row in Supabase
  const totalAmountCents = Math.round(service.price * 100);
  const depositAmountCents = Math.round(totalAmountCents / 2);
  const orderResp = await fetch(`${supabaseUrl}/rest/v1/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Prefer: 'return=representation' },
    body: JSON.stringify([{
      customer_name: customerName,
      customer_email: customerEmail.toLowerCase(),
      service_id: serviceId,
      service_name: service.name,
      total_amount: totalAmountCents,
      deposit_amount: depositAmountCents,
      currency: service.currency,
      notes: payload.notes || null,
      status: 'pending'
    }])
  });
  if (!orderResp.ok) {
    const errText = await orderResp.text();
    console.error('Order creation failed (PayPal flow):', errText);
    return jsonResponse({ error: 'Failed to create order' }, 500);
  }
  const order = (await orderResp.json())[0];

  // Create PayPal order
  try {
    const token = await getPayPalAccessToken(env);
    const base = getPayPalBaseUrl(env);
    const createResp = await fetch(`${base}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: String(order.id),
          amount: { currency_code: service.currency, value: (depositAmountCents / 100).toFixed(2) }
        }],
        application_context: {
          return_url: successUrl || `${request.headers.get('origin')}/payment-success`,
          cancel_url: cancelUrl || `${request.headers.get('origin')}/payment-cancel`
        }
      })
    });
    const initBody = await createResp.json();
    if (!createResp.ok) {
      console.error('PayPal create order error:', initBody);
      return jsonResponse({ error: initBody.message || 'Failed to create PayPal order' }, 500);
    }

    const paypalOrderId = initBody.id;
    const approveLink = (initBody.links || []).find((l: any) => l.rel === 'approve')?.href || null;

    // Update order with paypal_order_id
    try {
      await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ paypal_order_id: paypalOrderId })
      });
    } catch (err) {
      console.error('Failed to update order with paypal_order_id:', err);
    }

    return jsonResponse({ orderId: order.id, paypalOrderId, approveUrl: approveLink });
  } catch (err: any) {
    console.error('PayPal create order error:', err);
    return jsonResponse({ error: String(err) }, 500);
  }
}

async function handlePayPalWebhook(request: Request, env: any) {
  const payloadText = await request.text();
  let payload: any;
  try {
    payload = JSON.parse(payloadText);
  } catch (e) {
    console.error('Invalid PayPal JSON payload', e);
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  }

  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase not configured (PayPal webhook)');
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  }

  const paypalWebhookId = env.PAYPAL_WEBHOOK_ID;
  if (!paypalWebhookId) {
    console.error('PayPal webhook id not configured');
    return new Response(JSON.stringify({ error: 'PayPal webhook not configured' }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  }

  try {
    const base = getPayPalBaseUrl(env);
    const token = await getPayPalAccessToken(env);

    // Prepare verification body
    const verificationBody = {
      auth_algo: request.headers.get('paypal-auth-algo'),
      cert_url: request.headers.get('paypal-cert-url'),
      transmission_id: request.headers.get('paypal-transmission-id'),
      transmission_sig: request.headers.get('paypal-transmission-sig'),
      transmission_time: request.headers.get('paypal-transmission-time'),
      webhook_id: paypalWebhookId,
      webhook_event: payload
    };

    const verifyResp = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(verificationBody)
    });

    const verifyBody = await verifyResp.json();
    if (!verifyResp.ok || verifyBody.verification_status !== 'SUCCESS') {
      console.error('PayPal webhook verification failed', verifyBody);
      await sendMonitoringAlert(env, { level: 'warn', action: 'paypal_webhook_invalid_signature', payload: verifyBody });
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
    }

    // Extract useful resource info (best-effort)
    const eventType = payload.event_type || payload.event;
    const resource = payload.resource || {};
    // Prefer explicit order_id when present (captures may set resource.id to a capture id)
    const paypalOrderId = resource.order_id || resource.id || (resource.purchase_units && resource.purchase_units[0] && resource.purchase_units[0].reference_id) || null;
    const paypalTransactionId = (resource.payments && resource.payments.captures && resource.payments.captures[0] && resource.payments.captures[0].id) || resource.id || null;
    const amount = (resource.amount && (resource.amount.value ? Math.round(Number(resource.amount.value) * 100) : null)) || null;
    const orderRef = resource.reference_id || resource.custom_id || null;

    // Only handle completed events (capture completed or order approved/captured)
    const successful = (eventType && (eventType.includes('CAPTURE') || eventType.includes('ORDER') || eventType.includes('PAYMENT'))) || (resource.status && resource.status.toLowerCase() === 'completed');

    if (successful && paypalOrderId) {
      // Idempotency: check existing payment
      try {
        const existsResp = await fetch(`${supabaseUrl}/rest/v1/payments?paypal_order_id=eq.${encodeURIComponent(paypalOrderId)}`, { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } });
        if (existsResp.ok) {
          const rows = await existsResp.json();
          if (rows && rows.length > 0) {
            console.log('Payment already recorded for PayPal order', paypalOrderId);
            // update orders to paid by reference if possible
            if (orderRef) {
              await fetch(`${supabaseUrl}/rest/v1/orders?paypal_order_id=eq.${encodeURIComponent(orderRef)}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }, body: JSON.stringify({ status: 'paid', updated_at: new Date().toISOString() })
              });
            }
            return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
          }
        }
      } catch (err) {
        console.error('PayPal idempotency check failed', err);
      }

      // Insert payment
      try {
        const paymentInsertOptions: RequestInit = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Prefer: 'return=representation' },
          body: JSON.stringify([{
            order_id: orderRef ? Number(orderRef) : null,
            paypal_order_id: paypalOrderId,
            paypal_transaction_id: paypalTransactionId,
            amount: amount || 0,
            currency: resource.amount?.currency_code || 'USD',
            status: 'succeeded',
            raw: payload
          }])
        };
        await retryFetchJson(`${supabaseUrl}/rest/v1/payments`, paymentInsertOptions, 4, 200);
      } catch (err) {
        console.error('Error inserting PayPal payment:', err);
        await sendMonitoringAlert(env, { level: 'error', action: 'insert_paypal_payment', error: String(err), event: payload });
      }

      // Update order status
      try {
        const patchOptions: RequestInit = { method: 'PATCH', headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }, body: JSON.stringify({ status: 'paid', updated_at: new Date().toISOString() }) };
        if (orderRef) {
          await retryFetchJson(`${supabaseUrl}/rest/v1/orders?id=eq.${orderRef}`, patchOptions, 4, 200);
        } else if (paypalOrderId) {
          await retryFetchJson(`${supabaseUrl}/rest/v1/orders?paypal_order_id=eq.${encodeURIComponent(paypalOrderId)}`, patchOptions, 4, 200);
        }
      } catch (err) {
        console.error('Failed to update order status after PayPal webhook:', err);
        await sendMonitoringAlert(env, { level: 'error', action: 'update_order_paypal', error: String(err), paypalOrderId, orderRef });
      }

      return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
    }

    // acknowledge other events
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  } catch (err: any) {
    console.error('PayPal webhook handling error:', err);
    await sendMonitoringAlert(env, { level: 'error', action: 'paypal_webhook_error', error: String(err) });
    return new Response(JSON.stringify({ error: 'Webhook handling error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  }
}

// ----------------- End PayPal handlers -----------------

// ----------------- Yoco (VaughnSterling) handlers -----------------

async function handleCreateYocoCharge(request: Request, env: any) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return jsonResponse({ error: 'Supabase not configured' }, 500);

  const payload = await request.json();
  const { serviceId, customerName, customerEmail, successUrl, cancelUrl } = payload;
  if (!serviceId || !customerName || !customerEmail) return jsonResponse({ error: 'Service ID, customer name, and email are required' }, 400);
  const service = services[serviceId];
  if (!service) return jsonResponse({ error: 'Invalid service ID' }, 400);

  // Create order row in Supabase
  const totalAmountCents = Math.round(service.price * 100);
  const depositAmountCents = Math.round(totalAmountCents / 2);
  const orderResp = await fetch(`${supabaseUrl}/rest/v1/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Prefer: 'return=representation' },
    body: JSON.stringify([{
      customer_name: customerName,
      customer_email: customerEmail.toLowerCase(),
      service_id: serviceId,
      service_name: service.name,
      total_amount: totalAmountCents,
      deposit_amount: depositAmountCents,
      currency: service.currency,
      notes: payload.notes || null,
      status: 'pending'
    }])
  });
  if (!orderResp.ok) {
    const errText = await orderResp.text();
    console.error('Order creation failed (Yoco flow):', errText);
    return jsonResponse({ error: 'Failed to create order' }, 500);
  }
  const order = (await orderResp.json())[0];

  // Call Yoco API to create a charge/checkout session
  const yocoApi = env.YOCO_API_URL || env.YOCO_API_BASE || null;
  const yocoKey = env.YOCO_SECRET_KEY;
  if (!yocoApi || !yocoKey) return jsonResponse({ error: 'Yoco not configured' }, 500);

  try {
    // NOTE: Yoco API shapes vary; this code attempts a best-effort integration.
    // Set your YOCO_API_URL and YOCO_SECRET_KEY in worker env to make this work.
    const createResp = await fetch(`${yocoApi.replace(/\/$/, '')}/v1/charges`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${yocoKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount_in_cents: depositAmountCents,
        currency: service.currency,
        reference: String(order.id),
        customer: { name: customerName, email: customerEmail.toLowerCase() },
        callback_url: successUrl || `${request.headers.get('origin')}/payment-success`,
        cancel_url: cancelUrl || `${request.headers.get('origin')}/payment-cancel`
      })
    });

    const initBody = await createResp.json();
    if (!createResp.ok) {
      console.error('Yoco create charge error:', initBody);
      return jsonResponse({ error: initBody.message || 'Failed to create Yoco charge' }, 500);
    }

    // Heuristic: find charge id and redirect url in response
    const yocoChargeId = initBody.id || initBody.charge_id || initBody.data?.id || null;
    const checkoutUrl = initBody.checkout_url || initBody.redirect_url || initBody.data?.checkout_url || initBody.data?.redirect_url || null;

    // Update order with yoco_charge_id
    try {
      await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ yoco_charge_id: yocoChargeId })
      });
    } catch (err) {
      console.error('Failed to update order with yoco charge id:', err);
    }

    return jsonResponse({ orderId: order.id, yocoChargeId: yocoChargeId, checkoutUrl });
  } catch (err: any) {
    console.error('Yoco create charge error:', err);
    return jsonResponse({ error: String(err) }, 500);
  }
}

async function handleYocoWebhook(request: Request, env: any) {
  // Minimal Yoco webhook handler: parse payload, validate signature if YOCO_WEBHOOK_SECRET set, then insert payment and update order status
  const payloadText = await request.text();
  let payload: any;
  try { payload = JSON.parse(payloadText); } catch (e) { console.error('Invalid Yoco JSON payload', e); return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }); }

  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase not configured (Yoco webhook)');
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  }

  try {
    // Extract useful fields (best-effort)
    const eventType = payload.event || payload.type || null;
    const data = payload.data || payload;
    const yocoChargeId = data.id || data.charge_id || null;
    const yocoTransactionId = data.transaction_id || data.id || null;
    const amount = data.amount_in_cents || data.amount || null;
    const orderRef = data.reference || data.meta && data.meta.reference || null;

    // Simple idempotency check
    if (yocoChargeId) {
      const existsResp = await fetch(`${supabaseUrl}/rest/v1/payments?yoco_charge_id=eq.${encodeURIComponent(yocoChargeId)}`, { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } });
      if (existsResp.ok) {
        const rows = await existsResp.json();
        if (rows && rows.length > 0) {
          console.log('Payment already recorded for Yoco charge', yocoChargeId);
          return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
        }
      }
    }

    // Insert payment record
    try {
      const paymentInsertOptions: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Prefer: 'return=representation' },
        body: JSON.stringify([{
          order_id: orderRef ? Number(orderRef) : null,
          yoco_charge_id: yocoChargeId,
          yoco_transaction_id: yocoTransactionId,
          amount: amount || 0,
          currency: data.currency || 'ZAR',
          status: 'succeeded',
          raw: payload
        }])
      };
      await retryFetchJson(`${supabaseUrl}/rest/v1/payments`, paymentInsertOptions, 4, 200);
    } catch (err) {
      console.error('Error inserting Yoco payment:', err);
      await sendMonitoringAlert(env, { level: 'error', action: 'insert_yoco_payment', error: String(err), event: payload });
    }

    // Update order status to paid if possible
    try {
      const patchOptions: RequestInit = { method: 'PATCH', headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }, body: JSON.stringify({ status: 'paid', updated_at: new Date().toISOString() }) };
      if (orderRef) {
        await retryFetchJson(`${supabaseUrl}/rest/v1/orders?id=eq.${orderRef}`, patchOptions, 4, 200);
      } else if (yocoChargeId) {
        await retryFetchJson(`${supabaseUrl}/rest/v1/orders?yoco_charge_id=eq.${encodeURIComponent(yocoChargeId)}`, patchOptions, 4, 200);
      }
    } catch (err) {
      console.error('Failed to update order status after Yoco webhook:', err);
      await sendMonitoringAlert(env, { level: 'error', action: 'update_order_yoco', error: String(err), yocoChargeId, orderRef });
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  } catch (err: any) {
    console.error('Yoco webhook handling error:', err);
    await sendMonitoringAlert(env, { level: 'error', action: 'yoco_webhook_error', error: String(err) });
    return new Response(JSON.stringify({ error: 'Webhook handling error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  }
}

// Add route for Yoco webhook
async function yocoWebhookRouter(request: Request, env: any) {
  const url = new URL(request.url);
  if (url.pathname === '/api/yoco-webhook' && request.method === 'POST') return handleYocoWebhook(request, env);
}

