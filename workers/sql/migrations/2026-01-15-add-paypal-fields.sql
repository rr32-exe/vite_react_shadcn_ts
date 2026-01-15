-- Migration: Add PayPal fields and indexes (2026-01-15)
-- Run this against your staging database first. Verify then run in production.

BEGIN;

-- Orders: add paypal_order_id column and index (non-destructive)
ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS paypal_order_id text;

CREATE INDEX IF NOT EXISTS idx_orders_paypal_order_id ON public.orders (paypal_order_id);

-- Payments: add paypal columns and unique indexes
ALTER TABLE IF EXISTS public.payments
  ADD COLUMN IF NOT EXISTS paypal_order_id text,
  ADD COLUMN IF NOT EXISTS paypal_transaction_id text;

CREATE INDEX IF NOT EXISTS idx_payments_paypal_order_id ON public.payments (paypal_order_id);

-- Unique indexes to enforce idempotency on PayPal identifiers
CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_paypal_order_id ON public.payments (paypal_order_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_paypal_transaction_id ON public.payments (paypal_transaction_id);

COMMIT;

-- Rollback notes: removing columns is destructive and should be done only when you are sure there is no data.
-- To rollback (destructive):
-- BEGIN;
-- ALTER TABLE public.payments DROP COLUMN IF EXISTS paypal_order_id;
-- ALTER TABLE public.payments DROP COLUMN IF EXISTS paypal_transaction_id;
-- DROP INDEX IF EXISTS ux_payments_paypal_order_id;
-- DROP INDEX IF EXISTS ux_payments_paypal_transaction_id;
-- ALTER TABLE public.orders DROP COLUMN IF EXISTS paypal_order_id;
-- DROP INDEX IF EXISTS idx_orders_paypal_order_id;
-- COMMIT;