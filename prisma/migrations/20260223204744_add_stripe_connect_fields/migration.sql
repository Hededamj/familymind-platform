-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "stripeAccountStatus" TEXT NOT NULL DEFAULT 'not_connected',
ADD COLUMN     "stripeOnboardedAt" TIMESTAMP(3);
