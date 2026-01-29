-- Schema for Worker-backed APIs
-- Run these in Supabase SQL editor

-- 1) orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  service_id text NOT NULL,
  service_name text NOT NULL,
  total_amount integer NOT NULL, -- in cents
  deposit_amount integer NOT NULL, -- in cents
  currency text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending', -- values: pending, paid, cancelled
  stripe_session_id text,
  paypal_order_id text,
  yoco_charge_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders (customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON public.orders (stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_paypal_order_id ON public.orders (paypal_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_yoco_charge_id ON public.orders (yoco_charge_id);

-- 2) payments table to record Stripe payments
CREATE TABLE IF NOT EXISTS public.payments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id bigint REFERENCES public.orders(id) ON DELETE SET NULL,
  stripe_payment_intent text,
  stripe_charge_id text,
  stripe_session_id text,
  paypal_order_id text,
  paypal_transaction_id text,
  yoco_charge_id text,
  yoco_transaction_id text,
  amount integer NOT NULL, -- in cents
  currency text NOT NULL,
  status text NOT NULL,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments (order_id);
-- Prevent duplicate payments for the same providers' objects
CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_stripe_payment_intent ON public.payments (stripe_payment_intent);
CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_stripe_session_id ON public.payments (stripe_session_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_paypal_order_id ON public.payments (paypal_order_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_paypal_transaction_id ON public.payments (paypal_transaction_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_yoco_charge_id ON public.payments (yoco_charge_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_yoco_transaction_id ON public.payments (yoco_transaction_id);
-- 3) contact_submissions
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  service text,
  site text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4) newsletter_subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL,
  site text NOT NULL,
  lead_magnet text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint for upsert
CREATE UNIQUE INDEX IF NOT EXISTS ux_newsletter_email_site ON public.newsletter_subscribers (email, site);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_update_timestamp
BEFORE UPDATE ON public.newsletter_subscribers
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Optionally add RLS policies for the tables if you plan to use anon key.
-- Keep service_role key in worker as a secret; do not expose it to clients.
