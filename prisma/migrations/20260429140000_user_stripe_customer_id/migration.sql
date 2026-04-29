-- Add Stripe Customer ID to User so we can reuse a single Customer across
-- multiple checkouts instead of creating a fresh one each time via
-- customer_email. Backfill for existing users runs separately via
-- scripts/backfill-stripe-customers.ts.

ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;

CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User" ("stripeCustomerId");
