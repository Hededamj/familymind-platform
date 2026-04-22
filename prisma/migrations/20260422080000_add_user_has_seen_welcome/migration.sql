-- Add User.hasSeenWelcome column
--
-- The column was added to schema.prisma in commit 0a2116f (2026-04-06) but the
-- migration file was never created/committed. Production DB lacks the column,
-- causing P2022 crashes on /dashboard render (findUnique on User).
--
-- IF NOT EXISTS keeps the migration idempotent in case any environment
-- already has the column from out-of-band patching.

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "hasSeenWelcome" BOOLEAN NOT NULL DEFAULT false;
