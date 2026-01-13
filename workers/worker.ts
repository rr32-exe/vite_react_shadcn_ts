/* Cloudflare Worker that implements three endpoints:
   - POST /api/create-checkout
   - POST /api/contact-submit
   - POST /api/newsletter-subscribe

   Uses environment variables (set with `wrangler secret put` or via `vars`):
   - STRIPE_SECRET_KEY (secret)
   - SUPABASE_URL (secret or var, e.g., https://xyz.supabase.co)
   - SUPABASE_SERVICE_ROLE_KEY (secret)

   Implementation notes:
   - Uses Supabase REST (PostgREST) with the Service Role key to insert/upsert rows.
   - Uses Stripe REST API to create Checkout sessions (form-encoded body).
*/

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

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
      if (url.pathname === '/api/create-checkout' && request.method === 'POST') {
        return handleCreateCheckout(request, env);
      }

      if (url.pathname === '/api/contact-submit' && request.method === 'POST') {
        return handleContactSubmit(request, env);
      }

      if (url.pathname === '/api/newsletter-subscribe' && request.method === 'POST') {
        return handleNewsletterSubscribe(request, env);
      }

      if (url.pathname === '/api/stripe-webhook' && request.method === 'POST') {
        return handleStripeWebhook(request, env);
      }

      return new Response('Not Found', { status: 404 });
    } catch (err: any) {
      console.error('Uncaught error:', err);
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
  const stripeKey = env.STRIPE_SECRET_KEY;
  if (!stripeKey) return jsonResponse({ error: 'Stripe not configured' }, 500);

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

  // Create Stripe checkout session using Stripe REST API (form-encoded)
  const params = new URLSearchParams();
  params.append('payment_method_types[]', 'card');
  params.append('customer_email', customerEmail.toLowerCase());
  params.append('line_items[0][price_data][currency]', service.currency.toLowerCase());
  params.append('line_items[0][price_data][product_data][name]', `${service.name} - 50% Deposit`);
  params.append('line_items[0][price_data][product_data][description]', `Deposit payment for ${service.name}. Remaining 50% due upon completion.`);
  params.append('line_items[0][price_data][unit_amount]', String(depositAmountCents));
  params.append('line_items[0][quantity]', '1');
  params.append('mode', 'payment');
  params.append('success_url', successUrl || `${request.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}`);
  params.append('cancel_url', cancelUrl || `${request.headers.get('origin')}/payment-cancelled`);
  params.append('metadata[order_id]', String(order.id));
  params.append('metadata[service_id]', serviceId);
  params.append('metadata[service_name]', service.name);
  params.append('metadata[customer_name]', customerName);
  params.append('metadata[payment_type]', 'deposit');

  const stripeResp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  const stripeBody = await stripeResp.json();
  if (!stripeResp.ok) {
    console.error('Stripe error:', stripeBody);
    return jsonResponse({ error: stripeBody.error?.message || 'Failed to create Stripe session' }, 500);
  }

  // Update order with stripe_session_id
  await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: 'return=representation'
    },
    body: JSON.stringify({ stripe_session_id: stripeBody.id })
  });

  return jsonResponse({
    success: true,
    sessionId: stripeBody.id,
    sessionUrl: stripeBody.url,
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

/* --- Stripe Webhook handling --- */

async function hmacSHA256Hex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function secureCompare(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function verifyStripeSignature(payload: string, sigHeader: string, secret: string, toleranceSec = 300) {
  if (!sigHeader || !secret) return false;
  const parts = sigHeader.split(',').map(s => s.split('='));
  const map: Record<string, string[]> = {};
  for (const [k, v] of parts) {
    if (!map[k]) map[k] = [];
    map[k].push(v);
  }
  const ts = map['t'] ? Number(map['t'][0]) : null;
  const v1s = map['v1'] || [];
  if (!ts || v1s.length === 0) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > toleranceSec) return false;
  const signedPayload = `${ts}.${payload}`;
  const expected = await hmacSHA256Hex(secret, signedPayload);
  for (const s of v1s) {
    if (secureCompare(expected, s)) return true;
  }
  return false;
}

async function handleStripeWebhook(request: Request, env: any) {
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    return new Response(JSON.stringify({ error: 'Stripe webhook secret not configured' }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  }

  const payload = await request.text();
  const sigHeader = request.headers.get('stripe-signature') || '';
  const ok = await verifyStripeSignature(payload, sigHeader, webhookSecret, 300);
  if (!ok) {
    console.error('Invalid stripe webhook signature');
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  }

  let event: any;
  try {
    event = JSON.parse(payload);
  } catch (err) {
    console.error('Invalid JSON payload', err);
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  }

  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase not configured (webhook)');
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  }

  try {
    const type = event.type;

    if (type === 'checkout.session.completed') {
      const session = event.data.object;
      const sessionId = session.id;
      const orderId = session.metadata?.order_id ? Number(session.metadata.order_id) : null;
      const paymentIntent = session.payment_intent || null;
      const amount = session.amount_total || session.amount_subtotal || 0;
      const currency = session.currency || null;

      // Idempotency check: does a payment with this payment_intent already exist?
      if (paymentIntent) {
        const existsResp = await fetch(`${supabaseUrl}/rest/v1/payments?stripe_payment_intent=eq.${encodeURIComponent(paymentIntent)}`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
        });
        if (existsResp.ok) {
          const rows = await existsResp.json();
          if (rows && rows.length > 0) {
            console.log('Payment already recorded for', paymentIntent);
            // still ensure order status set to paid
            if (orderId) {
              await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
                body: JSON.stringify({ status: 'paid', updated_at: new Date().toISOString() })
              });
            } else if (sessionId) {
              await fetch(`${supabaseUrl}/rest/v1/orders?stripe_session_id=eq.${encodeURIComponent(sessionId)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
                body: JSON.stringify({ status: 'paid', updated_at: new Date().toISOString() })
              });
            }
            return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
          }
        }
      }

      // Insert payment record
      try {
        const paymentInsertResp = await fetch(`${supabaseUrl}/rest/v1/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Prefer: 'return=representation' },
          body: JSON.stringify([{
            order_id: orderId,
            stripe_payment_intent: paymentIntent,
            stripe_session_id: sessionId,
            amount: amount,
            currency: currency,
            status: 'succeeded',
            raw: event
          }])
        });
        if (!paymentInsertResp.ok) {
          const errText = await paymentInsertResp.text();
          console.error('Failed to insert payment:', errText);
        }
      } catch (err) {
        console.error('Error inserting payment:', err);
      }

      // Update order status
      if (orderId) {
        await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
          body: JSON.stringify({ status: 'paid', updated_at: new Date().toISOString() })
        });
      } else if (sessionId) {
        await fetch(`${supabaseUrl}/rest/v1/orders?stripe_session_id=eq.${encodeURIComponent(sessionId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
          body: JSON.stringify({ status: 'paid', updated_at: new Date().toISOString() })
        });
      }

      return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
    }

    if (type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const paymentIntent = pi.id;
      const amount = pi.amount || 0;
      const currency = pi.currency || null;
      const orderId = pi.metadata?.order_id ? Number(pi.metadata.order_id) : null;
      const sessionId = pi.metadata?.session_id || null;

      // idempotency
      const existsResp = await fetch(`${supabaseUrl}/rest/v1/payments?stripe_payment_intent=eq.${encodeURIComponent(paymentIntent)}`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
      });
      if (existsResp.ok) {
        const rows = await existsResp.json();
        if (rows && rows.length > 0) {
          console.log('Payment already recorded for PI', paymentIntent);
          return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
        }
      }

      await fetch(`${supabaseUrl}/rest/v1/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Prefer: 'return=representation' },
        body: JSON.stringify([{
          order_id: orderId,
          stripe_payment_intent: paymentIntent,
          stripe_session_id: sessionId,
          amount: amount,
          currency: currency,
          status: 'succeeded',
          raw: event
        }])
      });

      if (orderId) {
        await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
          body: JSON.stringify({ status: 'paid', updated_at: new Date().toISOString() })
        });
      } else if (sessionId) {
        await fetch(`${supabaseUrl}/rest/v1/orders?stripe_session_id=eq.${encodeURIComponent(sessionId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
          body: JSON.stringify({ status: 'paid', updated_at: new Date().toISOString() })
        });
      }

      return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
    }

    // For other events, acknowledge
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  } catch (err: any) {
    console.error('Webhook handling error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Webhook handling error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
  }
}
