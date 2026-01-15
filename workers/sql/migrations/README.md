Migration checklist — Add PayPal fields

Overview
--------
This migration adds PayPal-specific columns and unique indexes used to enforce idempotency and track PayPal orders/transactions.
Files:
- `workers/sql/migrations/2026-01-15-add-paypal-fields.sql` — SQL to run.

Pre-apply (staging first)
-------------------------
1. Backup DB (always):
   - Via Supabase SQL editor: run `SELECT pg_dump();` or use Supabase's DB backup UI OR
   - With psql: `pg_dump --format=custom --file=backup_before_paypal.migr.sql <connection-string>`
2. Review the migration file and confirm it contains only non-destructive changes.

Apply to staging
----------------
1. Open Supabase project for staging.
2. Navigate to the SQL editor and paste the contents of `2026-01-15-add-paypal-fields.sql` and execute.
3. Validate schema:
   - Check `orders` table contains `paypal_order_id`.
   - Check `payments` table contains `paypal_order_id` and `paypal_transaction_id`.
   - Confirm indexes exist: `ux_payments_paypal_order_id`, `ux_payments_paypal_transaction_id`, `idx_orders_paypal_order_id`.
4. Run tests against staging (webhook POC / E2E):
   - Use PayPal sandbox credentials; create a sandbox order and send a sandbox webhook (PayPal webhook simulator).
   - Confirm webhook handler verifies the webhook and writes a payment record.

Apply to production (after staging validation)
----------------------------------------------
1. Backup production DB (mandatory): `pg_dump` or Supabase DB backup.
2. Run the same SQL file in the production Supabase SQL editor.
3. Verify schema and indexes in production.
4. Run low-traffic sanity checks:
   - Create a small test transaction on PayPal sandbox (if you use staging for this) or use a low-value live transaction if your policy allows.

Rollback plan
-------------
- The migration is mostly additive. If you must rollback:
  1. Ensure you have DB backup created before the migration.
  2. Run the provided DROP COLUMN / DROP INDEX rollback snippet (in migration file comments).
  3. Confirm application changes (code) are reverted or can operate without the PayPal columns.

Post-apply notes
----------------
- Update the Worker env/secrets for PayPal (sandbox) and test webhook flow before switching to live keys.
- Add/enable Playwright E2E tests that exercise PayPal flows in CI (use sandbox secrets in the CI matrix).
- Monitor for any constraint violations or duplicate webhooks — unique indexes should catch duplicates.

Contact
-------
If you want, I can apply the migration to your staging environment now if you provide access/confirm the staging Supabase connection string, or I can provide the exact SQL commands to run in the Supabase UI.