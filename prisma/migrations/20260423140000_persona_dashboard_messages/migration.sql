-- Add persona-awareness to DashboardMessage.
-- Existing rows (generic messages) get tagId=NULL and stay in place.
-- New rows with a tagId are persona-specific variants.

-- 1. Add tagId column (nullable FK to ContentTag).
ALTER TABLE "DashboardMessage"
  ADD COLUMN "tagId" UUID;

ALTER TABLE "DashboardMessage"
  ADD CONSTRAINT "DashboardMessage_tagId_fkey"
  FOREIGN KEY ("tagId") REFERENCES "ContentTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Swap the stateKey uniqueness for a composite (stateKey, tagId).
-- Postgres treats NULL as distinct in UNIQUE by default — that's OK here,
-- we enforce "exactly one generic row per stateKey" at the seed layer.
DROP INDEX "DashboardMessage_stateKey_key";

CREATE UNIQUE INDEX "DashboardMessage_stateKey_tagId_key"
  ON "DashboardMessage" ("stateKey", "tagId");

CREATE INDEX "DashboardMessage_stateKey_idx"
  ON "DashboardMessage" ("stateKey");
