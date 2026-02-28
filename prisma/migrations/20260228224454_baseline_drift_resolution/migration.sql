-- Baseline drift resolution: captures all changes applied via db push
-- that were not tracked by migrate dev (AdminTag, UserTag, DiscountCode
-- Stripe fields, User.lastActiveAt).

-- AdminTag
CREATE TABLE IF NOT EXISTS "AdminTag" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminTag_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AdminTag_name_key" ON "AdminTag"("name");

-- UserTag
CREATE TABLE IF NOT EXISTS "UserTag" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "tagId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserTag_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "UserTag_tagId_idx" ON "UserTag"("tagId");
CREATE INDEX IF NOT EXISTS "UserTag_userId_idx" ON "UserTag"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "UserTag_userId_tagId_key" ON "UserTag"("userId", "tagId");
ALTER TABLE "UserTag" ADD CONSTRAINT "UserTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "AdminTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserTag" ADD CONSTRAINT "UserTag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DiscountCode Stripe fields
ALTER TABLE "DiscountCode" ADD COLUMN IF NOT EXISTS "stripeCouponId" TEXT;
ALTER TABLE "DiscountCode" ADD COLUMN IF NOT EXISTS "stripePromotionCodeId" TEXT;
ALTER TABLE "DiscountCode" ADD COLUMN IF NOT EXISTS "duration" TEXT NOT NULL DEFAULT 'once';
ALTER TABLE "DiscountCode" ADD COLUMN IF NOT EXISTS "durationInMonths" INTEGER;

-- User activity tracking
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "User_lastActiveAt_idx" ON "User"("lastActiveAt");
