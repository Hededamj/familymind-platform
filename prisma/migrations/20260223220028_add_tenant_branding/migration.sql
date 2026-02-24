-- AlterTable: add tenant branding fields to Organization
-- Step 1: Add updatedAt with a default so existing rows get a value
ALTER TABLE "Organization" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now();

-- Step 2: Remove the default (Prisma @updatedAt manages this at application level)
ALTER TABLE "Organization" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- Step 3: Add all other new columns
ALTER TABLE "Organization" ADD COLUMN     "aboutBio" TEXT,
ADD COLUMN     "aboutHeading" TEXT,
ADD COLUMN     "aboutImageUrl" TEXT,
ADD COLUMN     "aboutName" TEXT,
ADD COLUMN     "aboutUrl" TEXT,
ADD COLUMN     "brandName" TEXT NOT NULL DEFAULT 'FamilyMind',
ADD COLUMN     "colorAccent" TEXT NOT NULL DEFAULT '#E8715A',
ADD COLUMN     "colorBackground" TEXT NOT NULL DEFAULT '#FAFAF8',
ADD COLUMN     "colorBorder" TEXT NOT NULL DEFAULT '#E8E4DF',
ADD COLUMN     "colorForeground" TEXT NOT NULL DEFAULT '#1A1A1A',
ADD COLUMN     "colorPrimary" TEXT NOT NULL DEFAULT '#86A0A6',
ADD COLUMN     "colorPrimaryForeground" TEXT NOT NULL DEFAULT '#1A1A1A',
ADD COLUMN     "colorSand" TEXT NOT NULL DEFAULT '#F5F0EB',
ADD COLUMN     "colorSuccess" TEXT NOT NULL DEFAULT '#2A6B5A',
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "contactUrl" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "emailFromEmail" TEXT,
ADD COLUMN     "emailFromName" TEXT,
ADD COLUMN     "faviconUrl" TEXT,
ADD COLUMN     "footerCopyright" TEXT,
ADD COLUMN     "footerLinks" JSONB,
ADD COLUMN     "heroCtaText" TEXT,
ADD COLUMN     "heroCtaUrl" TEXT,
ADD COLUMN     "heroHeading" TEXT,
ADD COLUMN     "heroSubheading" TEXT,
ADD COLUMN     "landingBenefits" JSONB,
ADD COLUMN     "landingFaq" JSONB,
ADD COLUMN     "landingFeatures" JSONB,
ADD COLUMN     "landingSteps" JSONB,
ADD COLUMN     "landingTestimonials" JSONB,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "subscriptionPeriodDisplay" TEXT,
ADD COLUMN     "subscriptionPriceDisplay" TEXT,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "websiteUrl" TEXT;
