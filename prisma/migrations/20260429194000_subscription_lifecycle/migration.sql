-- Subscription lifecycle: support PAUSED and PAST_DUE entitlement states,
-- plus a pausedUntil timestamp that mirrors Stripe's pause_collection
-- resumes_at so UI can show "paused until X".

-- 1. Extend the EntitlementStatus enum with the two new states.
ALTER TYPE "EntitlementStatus" ADD VALUE IF NOT EXISTS 'PAUSED';
ALTER TYPE "EntitlementStatus" ADD VALUE IF NOT EXISTS 'PAST_DUE';

-- 2. Add pausedUntil column to Entitlement.
ALTER TABLE "Entitlement" ADD COLUMN "pausedUntil" TIMESTAMP(3);
