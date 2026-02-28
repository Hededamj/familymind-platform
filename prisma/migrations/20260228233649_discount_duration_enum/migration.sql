-- CreateEnum
CREATE TYPE "DiscountDuration" AS ENUM ('once', 'repeating', 'forever');

-- AlterTable: convert duration from String to enum, drop unused column
ALTER TABLE "DiscountCode" DROP COLUMN "stripePromotionCodeId";
ALTER TABLE "DiscountCode" DROP COLUMN "duration";
ALTER TABLE "DiscountCode" ADD COLUMN "duration" "DiscountDuration" NOT NULL DEFAULT 'once';
