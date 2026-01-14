var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.ts
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
};
var RATE_MAP = /* @__PURE__ */ new Map();
function getClientIP(request) {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
}
__name(getClientIP, "getClientIP");
function incrementRate(key, max, windowSec) {
  const now = Date.now();
  const state = RATE_MAP.get(key);
  if (!state || state.resetAt < now) {
    RATE_MAP.set(key, { count: 1, resetAt: now + windowSec * 1e3 });
    return { count: 1, resetAt: now + windowSec * 1e3 };
  }
  state.count += 1;
  return state;
}
__name(incrementRate, "incrementRate");
function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS }
  });
}
__name(jsonResponse, "jsonResponse");
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: CORS_HEADERS });
    }
    try {
      const publicPaths = ["/api/create-checkout", "/api/contact-submit", "/api/newsletter-subscribe"];
      if (publicPaths.includes(url.pathname) && request.method === "POST") {
        const ip = getClientIP(request);
        const max = Number(env.RATE_LIMIT_MAX || 60);
        const windowSec = Number(env.RATE_LIMIT_WINDOW || 60);
        const key = `${ip}:${url.pathname}`;
        const state = incrementRate(key, max, windowSec);
        if (state.count > max) {
          const headers = { "Retry-After": String(Math.ceil((state.resetAt - Date.now()) / 1e3)), ...CORS_HEADERS };
          return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { "Content-Type": "application/json", ...headers } });
        }
      }
      if (url.pathname === "/api/create-checkout" && request.method === "POST") {
        return handleCreateCheckout(request, env);
      }
      if (url.pathname === "/api/contact-submit" && request.method === "POST") {
        return handleContactSubmit(request, env);
      }
      if (url.pathname === "/api/newsletter-subscribe" && request.method === "POST") {
        return handleNewsletterSubscribe(request, env);
      }
      if (url.pathname === "/api/paystack-webhook" && request.method === "POST") {
        return handlePaystackWebhook(request, env);
      }
      if (url.pathname === "/api/admin/login" && request.method === "POST") {
        return handleAdminLogin(request, env);
      }
      if (url.pathname === "/api/auth/github/start" && request.method === "GET") {
        return handleGithubStart(request, env);
      }
      if (url.pathname === "/api/auth/github/callback" && request.method === "GET") {
        return handleGithubCallback(request, env);
      }
      if (url.pathname.startsWith("/api/admin") && request.method === "GET") {
        return handleAdminRequest(request, env);
      }
      return new Response("Not Found", { status: 404 });
    } catch (err) {
      console.error("Uncaught error:", err);
      try {
        await sendToSentry(err, env);
      } catch (e) {
        console.error("Sentry send failed", e);
      }
      return jsonResponse({ error: err?.message || "Internal server error" }, 500);
    }
  }
};
var services = {
  s1: { name: "Custom AI-Powered Niche Site", price: 8e3, currency: "ZAR" },
  s2: { name: "30 AI-Generated Articles", price: 5e3, currency: "ZAR" },
  s3: { name: "Full Automation Setup", price: 15e3, currency: "ZAR" },
  s4: { name: "Strategy Consulting (1 Hour)", price: 800, currency: "ZAR" }
};
async function handleCreateCheckout(request, env) {
  const paystackKey = env.PAYSTACK_SECRET_KEY;
  if (!paystackKey) return jsonResponse({ error: "Paystack not configured" }, 500);
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return jsonResponse({ error: "Supabase not configured" }, 500);
  const payload = await request.json();
  const { serviceId, customerName, customerEmail, notes, successUrl, cancelUrl } = payload;
  if (!serviceId || !customerName || !customerEmail) {
    return jsonResponse({ error: "Service ID, customer name, and email are required" }, 400);
  }
  const service = services[serviceId];
  if (!service) return jsonResponse({ error: "Invalid service ID" }, 400);
  const totalAmountCents = Math.round(service.price * 100);
  const depositAmountCents = Math.round(totalAmountCents / 2);
  const orderResp = await fetch(`${supabaseUrl}/rest/v1/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "return=representation"
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
      status: "pending"
    }])
  });
  if (!orderResp.ok) {
    const errText = await orderResp.text();
    console.error("Order creation failed:", errText);
    return jsonResponse({ error: "Failed to create order" }, 500);
  }
  const orderRows = await orderResp.json();
  const order = orderRows[0];
  const initResp = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paystackKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: customerEmail.toLowerCase(),
      amount: depositAmountCents,
      currency: service.currency,
      callback_url: successUrl || `${request.headers.get("origin")}/payment-success?reference={reference}`,
      metadata: {
        order_id: order.id,
        service_id: serviceId,
        service_name: service.name,
        customer_name: customerName,
        payment_type: "deposit"
      }
    })
  });
  const initBody = await initResp.json();
  if (!initResp.ok) {
    console.error("Paystack error:", initBody);
    return jsonResponse({ error: initBody.message || "Failed to initialize Paystack transaction" }, 500);
  }
  const reference = initBody.data?.reference;
  const authorizationUrl = initBody.data?.authorization_url;
  try {
    await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=representation"
      },
      body: JSON.stringify({ paystack_reference: reference })
    });
  } catch (err) {
    console.error("Failed to update order with paystack reference:", err);
  }
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
__name(handleCreateCheckout, "handleCreateCheckout");
async function handleContactSubmit(request, env) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return jsonResponse({ error: "Supabase not configured" }, 500);
  const payload = await request.json();
  const { name, email, message, service, site = "vaughnsterling" } = payload;
  if (!name || !email || !message) {
    return jsonResponse({ error: "Name, email, and message are required" }, 400);
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return jsonResponse({ error: "Invalid email format" }, 400);
  const resp = await fetch(`${supabaseUrl}/rest/v1/contact_submissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "return=representation"
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
    console.error("Contact DB error:", err);
    return jsonResponse({ error: "Failed to submit contact form" }, 500);
  }
  const data = (await resp.json())[0];
  return jsonResponse({ success: true, message: "Message sent successfully! I'll get back to you within 24 hours.", data });
}
__name(handleContactSubmit, "handleContactSubmit");
async function handleNewsletterSubscribe(request, env) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return jsonResponse({ error: "Supabase not configured" }, 500);
  const payload = await request.json();
  const { email, site, leadMagnet } = payload;
  if (!email || !site) return jsonResponse({ error: "Email and site are required" }, 400);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return jsonResponse({ error: "Invalid email format" }, 400);
  const validSites = ["swankyboyz", "vaughnsterlingtours", "vaughnsterling"];
  if (!validSites.includes(site)) return jsonResponse({ error: "Invalid site" }, 400);
  const resp = await fetch(`${supabaseUrl}/rest/v1/newsletter_subscribers?on_conflict=email,site`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "return=representation"
    },
    body: JSON.stringify([{
      email: email.toLowerCase(),
      site,
      lead_magnet: leadMagnet
    }])
  });
  if (!resp.ok) {
    const err = await resp.text();
    console.error("Subscribe DB error:", err);
    return jsonResponse({ error: "Failed to subscribe" }, 500);
  }
  const data = (await resp.json())[0];
  return jsonResponse({ success: true, message: "Successfully subscribed!", data });
}
__name(handleNewsletterSubscribe, "handleNewsletterSubscribe");
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
__name(sleep, "sleep");
async function retryFetchJson(url, options, attempts = 3, backoffMs = 250) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const resp = await fetch(url, options);
      if (resp.ok) return resp;
      lastErr = await resp.text();
    } catch (err) {
      lastErr = err;
    }
    await sleep(backoffMs * Math.pow(2, i));
  }
  throw new Error(`Failed after ${attempts} attempts: ${lastErr}`);
}
__name(retryFetchJson, "retryFetchJson");
async function sendMonitoringAlert(env, payload) {
  const url = env.MONITORING_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  } catch (err) {
    console.error("Failed to post monitoring alert", err);
  }
}
__name(sendMonitoringAlert, "sendMonitoringAlert");
function parseDsn(dsn) {
  try {
    const u = new URL(dsn);
    const path = u.pathname.replace(/^\//, "");
    const projectId = path.split("/").pop();
    const publicKey = u.username || (u.href.match(/https:\/\/([^@]+)@/) || [])[1];
    return { host: u.origin, projectId, publicKey };
  } catch (err) {
    return null;
  }
}
__name(parseDsn, "parseDsn");
async function sendToSentry(err, env) {
  const dsn = env.SENTRY_DSN || env.SENTRY_DSN_PUBLIC || null;
  if (!dsn) return;
  const parsed = parseDsn(dsn);
  if (!parsed || !parsed.projectId) return;
  const url = `${parsed.host}/api/${parsed.projectId}/store/`;
  const extra = { worker_env: "cloudflare" };
  if (env.SENTRY_RELEASE) {
    extra.release = env.SENTRY_RELEASE;
  }
  if (env.WORKER_ENV) {
    extra.worker_env_name = env.WORKER_ENV;
  }
  const event = {
    event_id: (Math.random() + 1).toString(36).substring(2, 12),
    message: String(err?.message || err),
    platform: "javascript",
    logger: "worker",
    exception: [{ value: String(err?.stack || err), type: err?.name || "Error" }],
    level: "error",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    extra
  };
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${parsed.publicKey}`
      },
      body: JSON.stringify(event)
    });
  } catch (e) {
    console.error("Failed to send to Sentry", e);
  }
}
__name(sendToSentry, "sendToSentry");
function base64UrlEncode(bytes) {
  let binary = "";
  bytes.forEach((b) => binary += String.fromCharCode(b));
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(base64UrlEncode, "base64UrlEncode");
function base64UrlEncodeStr(str) {
  const enc = new TextEncoder().encode(str);
  return base64UrlEncode(enc);
}
__name(base64UrlEncodeStr, "base64UrlEncodeStr");
async function hmacSha256Base64Url(secret, data) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return base64UrlEncode(new Uint8Array(sig));
}
__name(hmacSha256Base64Url, "hmacSha256Base64Url");
async function signJwt(payload, secret, expiresInSec = 86400) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1e3);
  payload.iat = now;
  payload.exp = now + expiresInSec;
  const toSign = `${base64UrlEncodeStr(JSON.stringify(header))}.${base64UrlEncodeStr(JSON.stringify(payload))}`;
  const signature = await hmacSha256Base64Url(secret, toSign);
  return `${toSign}.${signature}`;
}
__name(signJwt, "signJwt");
async function verifyJwt(token, secret) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sig] = parts;
    const data = `${headerB64}.${payloadB64}`;
    const expected = await hmacSha256Base64Url(secret, data);
    if (!secureCompare(expected, sig)) return null;
    const payloadJson = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1e3);
    if (payload.exp && now > payload.exp) return null;
    return payload;
  } catch (err) {
    return null;
  }
}
__name(verifyJwt, "verifyJwt");
async function handleAdminRequest(request, env) {
  const adminJwtSecret = env.ADMIN_JWT_SECRET;
  const adminSecret = env.ADMIN_SECRET;
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  let authorized = false;
  if (token && adminJwtSecret) {
    const payload = await verifyJwt(token, adminJwtSecret);
    if (payload && payload.role === "admin") authorized = true;
  }
  if (!authorized && adminSecret) {
    const headerSecret = request.headers.get("x-admin-secret") || "";
    if (headerSecret === adminSecret) authorized = true;
  }
  if (!authorized) return new Response("Unauthorized", { status: 401 });
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/admin", "");
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return jsonResponse({ error: "Supabase not configured" }, 500);
  const query = url.searchParams;
  const id = query.get("id");
  const email = query.get("email");
  const limit = Math.min(Number(query.get("limit") || "100"), 1e3);
  try {
    if (path === "/orders.csv" || path === "/orders") {
      let endpoint = `${supabaseUrl}/rest/v1/orders?select=*&limit=${limit}&order=created_at.desc`;
      if (id) endpoint = `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`;
      else if (email) endpoint = `${supabaseUrl}/rest/v1/orders?customer_email=eq.${encodeURIComponent(email)}&limit=${limit}`;
      const resp = await fetch(endpoint, { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } });
      if (!resp.ok) return jsonResponse({ error: await resp.text() }, 500);
      const rows = await resp.json();
      if (path === "/orders.csv") {
        const header = ["id", "customer_name", "customer_email", "service_id", "service_name", "total_amount", "deposit_amount", "currency", "status", "stripe_session_id", "paystack_reference", "created_at"];
        const csv = [header.join(",")].concat(rows.map((r) => header.map((h) => `"${String(r[h] ?? "")}"`).join(","))).join("\n");
        return new Response(csv, { headers: { "Content-Type": "text/csv", ...CORS_HEADERS } });
      }
      return jsonResponse({ success: true, data: rows });
    }
    if (path === "/payments" || path === "/payments/") {
      let endpoint = `${supabaseUrl}/rest/v1/payments?select=*&limit=${limit}&order=created_at.desc`;
      if (id) endpoint = `${supabaseUrl}/rest/v1/payments?id=eq.${encodeURIComponent(id)}`;
      else if (query.get("stripe_payment_intent")) endpoint = `${supabaseUrl}/rest/v1/payments?stripe_payment_intent=eq.${encodeURIComponent(query.get("stripe_payment_intent") || "")}`;
      else if (query.get("paystack_reference")) endpoint = `${supabaseUrl}/rest/v1/payments?paystack_reference=eq.${encodeURIComponent(query.get("paystack_reference") || "")}`;
      else if (query.get("paystack_transaction_id")) endpoint = `${supabaseUrl}/rest/v1/payments?paystack_transaction_id=eq.${encodeURIComponent(query.get("paystack_transaction_id") || "")}`;
      const resp = await fetch(endpoint, { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } });
      const rows = resp.ok ? await resp.json() : { error: await resp.text() };
      return jsonResponse({ success: true, data: rows });
    }
    return jsonResponse({ error: "Unknown admin path" }, 400);
  } catch (err) {
    console.error("Admin handler error", err);
    await sendMonitoringAlert(env, { level: "error", action: "admin", error: String(err) });
    return jsonResponse({ error: "Internal error" }, 500);
  }
}
__name(handleAdminRequest, "handleAdminRequest");
async function handleAdminLogin(request, env) {
  const { username, password } = await request.json();
  const adminUser = env.ADMIN_USERNAME;
  const adminPass = env.ADMIN_PASSWORD;
  const jwtSecret = env.ADMIN_JWT_SECRET;
  const jwtExpiry = Number(env.ADMIN_JWT_EXPIRES || "86400");
  if (!adminUser || !adminPass || !jwtSecret) return jsonResponse({ error: "Admin login not configured" }, 500);
  if (username !== adminUser || password !== adminPass) return jsonResponse({ error: "Invalid credentials" }, 401);
  const token = await signJwt({ role: "admin", username }, jwtSecret, jwtExpiry);
  return jsonResponse({ token, expiresIn: jwtExpiry });
}
__name(handleAdminLogin, "handleAdminLogin");
async function handleGithubStart(request, env) {
  const clientId = env.GITHUB_CLIENT_ID;
  const redirectUri = `${request.headers.get("origin")}/api/auth/github/callback`;
  const state = Math.random().toString(36).substring(2);
  try {
    if (env.OAUTH_KV) await env.OAUTH_KV.put(`gh_state:${state}`, "1", { expirationTtl: 300 });
  } catch (err) {
    console.warn("Failed to store state in KV", err);
  }
  const url = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=read:user%20read:org`;
  return Response.redirect(url, 302);
}
__name(handleGithubStart, "handleGithubStart");
async function handleGithubCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;
  if (!code || !clientId || !clientSecret) return new Response("Bad Request", { status: 400 });
  try {
    if (env.OAUTH_KV) {
      const v = await env.OAUTH_KV.get(`gh_state:${state}`);
      if (!v) return new Response("Invalid or expired state", { status: 400 });
      await env.OAUTH_KV.delete(`gh_state:${state}`);
    }
  } catch (err) {
    console.warn("KV check failed for state", err);
  }
  const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
  });
  const tokenJson = await tokenResp.json();
  const accessToken = tokenJson.access_token;
  if (!accessToken) return new Response("GitHub auth failed", { status: 400 });
  const userResp = await fetch("https://api.github.com/user", { headers: { Authorization: `token ${accessToken}`, "User-Agent": "worker" } });
  const userJson = await userResp.json();
  const login = userJson.login;
  const allowUsers = (env.ADMIN_GITHUB_USERS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (allowUsers.length > 0 && !allowUsers.includes(login)) return new Response("Unauthorized", { status: 401 });
  const allowOrgs = (env.ADMIN_GITHUB_ORGS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (allowOrgs.length > 0) {
    const orgsResp = await fetch("https://api.github.com/user/orgs", { headers: { Authorization: `token ${accessToken}`, "User-Agent": "worker" } });
    if (!orgsResp.ok) return new Response("Failed to check orgs", { status: 500 });
    const orgsJson = await orgsResp.json();
    const memberOrgs = orgsJson.map((o) => o.login);
    const isMember = allowOrgs.some((o) => memberOrgs.includes(o));
    if (!isMember) return new Response("Unauthorized (org membership required)", { status: 401 });
  }
  const jwtSecret = env.ADMIN_JWT_SECRET;
  const jwtExpiry = Number(env.ADMIN_JWT_EXPIRES || "86400");
  const token = await signJwt({ role: "admin", username: login, provider: "github" }, jwtSecret, jwtExpiry);
  const redirectTo = `${request.headers.get("origin")}/admin?token=${encodeURIComponent(token)}`;
  return Response.redirect(redirectTo, 302);
}
__name(handleGithubCallback, "handleGithubCallback");
function secureCompare(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
__name(secureCompare, "secureCompare");
async function hmacSHA512Hex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hmacSHA512Hex, "hmacSHA512Hex");
async function handlePaystackWebhook(request, env) {
  const webhookSecret = env.PAYSTACK_WEBHOOK_SECRET;
  const payload = await request.text();
  const sigHeader = request.headers.get("x-paystack-signature") || "";
  if (webhookSecret) {
    let expected;
    try {
      expected = await hmacSHA512Hex(webhookSecret, payload);
    } catch (err) {
      console.error("Failed computing HMAC for Paystack webhook", err);
      return new Response(JSON.stringify({ error: "Webhook verification error" }), { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
    }
    if (!secureCompare(expected, sigHeader)) {
      console.error("Invalid Paystack webhook signature");
      await sendMonitoringAlert(env, { level: "warn", action: "webhook_invalid_signature", ip: getClientIP(request) });
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
    }
  }
  let event;
  try {
    event = JSON.parse(payload);
  } catch (err) {
    console.error("Invalid Paystack JSON payload", err);
    await sendMonitoringAlert(env, { level: "error", action: "webhook_invalid_json", error: String(err) });
    return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase not configured (paystack webhook)");
    return new Response(JSON.stringify({ error: "Supabase not configured" }), { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }
  try {
    const type = event.event || event.type || event.data && event.data.event || null;
    if (type === "charge.success" || type === "transaction.success" || type === "transfer.success" || event.data && event.data.status === "success") {
      const data = event.data || {};
      const reference = data.reference || null;
      const transactionId = data.id || null;
      const amount = data.amount || 0;
      const currency = data.currency || null;
      const orderId = data.metadata?.order_id ? Number(data.metadata.order_id) : null;
      if (reference) {
        const existsResp = await fetch(`${supabaseUrl}/rest/v1/payments?paystack_reference=eq.${encodeURIComponent(reference)}`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
        });
        if (existsResp.ok) {
          const rows = await existsResp.json();
          if (rows && rows.length > 0) {
            console.log("Payment already recorded for", reference);
            if (orderId) {
              await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
                body: JSON.stringify({ status: "paid", updated_at: (/* @__PURE__ */ new Date()).toISOString() })
              });
            } else if (reference) {
              await fetch(`${supabaseUrl}/rest/v1/orders?paystack_reference=eq.${encodeURIComponent(reference)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
                body: JSON.stringify({ status: "paid", updated_at: (/* @__PURE__ */ new Date()).toISOString() })
              });
            }
            return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
          }
        }
      }
      try {
        const paymentInsertOptions = {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Prefer: "return=representation" },
          body: JSON.stringify([{
            order_id: orderId,
            paystack_reference: reference,
            paystack_transaction_id: transactionId,
            amount,
            currency,
            status: "succeeded",
            raw: event
          }])
        };
        try {
          await retryFetchJson(`${supabaseUrl}/rest/v1/payments`, paymentInsertOptions, 4, 200);
        } catch (err) {
          console.error("Failed to insert payment after retries:", err);
          await sendMonitoringAlert(env, { level: "error", action: "insert_payment", error: String(err), event });
        }
      } catch (err) {
        console.error("Error inserting payment:", err);
      }
      const patchOptions = {
        method: "PATCH",
        headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ status: "paid", updated_at: (/* @__PURE__ */ new Date()).toISOString() })
      };
      try {
        if (orderId) {
          await retryFetchJson(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, patchOptions, 4, 200);
        } else if (reference) {
          await retryFetchJson(`${supabaseUrl}/rest/v1/orders?paystack_reference=eq.${encodeURIComponent(reference)}`, patchOptions, 4, 200);
        }
      } catch (err) {
        console.error("Failed to update order status after retries:", err);
        await sendMonitoringAlert(env, { level: "error", action: "update_order", error: String(err), reference, orderId });
      }
      return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
    }
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  } catch (err) {
    console.error("Paystack webhook handling error:", err);
    return new Response(JSON.stringify({ error: err.message || "Webhook handling error" }), { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }
}
__name(handlePaystackWebhook, "handlePaystackWebhook");

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-Vm0T4n/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-Vm0T4n/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
