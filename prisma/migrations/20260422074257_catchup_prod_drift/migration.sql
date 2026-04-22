-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('one_time', 'recurring');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('month', 'year');

-- CreateEnum
CREATE TYPE "RetentionOfferType" AS ENUM ('DISCOUNT', 'PAUSE', 'SUPPORT', 'CONTENT_HELP', 'NONE');

-- DropForeignKey
ALTER TABLE "BundleItem" DROP CONSTRAINT "BundleItem_bundleProductId_fkey";

-- DropForeignKey
ALTER TABLE "BundleItem" DROP CONSTRAINT "BundleItem_includedProductId_fkey";

-- DropForeignKey
ALTER TABLE "CourseLesson" DROP CONSTRAINT "CourseLesson_productId_fkey";

-- DropForeignKey
ALTER TABLE "CourseModule" DROP CONSTRAINT "CourseModule_productId_fkey";

-- DropForeignKey
ALTER TABLE "DiscountCode" DROP CONSTRAINT "DiscountCode_applicableProductId_fkey";

-- DropForeignKey
ALTER TABLE "Entitlement" DROP CONSTRAINT "Entitlement_productId_fkey";

-- DropForeignKey
ALTER TABLE "Journey" DROP CONSTRAINT "Journey_productId_fkey";

-- DropIndex
DROP INDEX "CourseLesson_productId_contentUnitId_key";

-- DropIndex
DROP INDEX "CourseModule_productId_idx";

-- AlterTable
ALTER TABLE "AdminTag" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ContentUnit" DROP COLUMN "accessLevel",
DROP COLUMN "isStandalone",
ADD COLUMN     "bodyHtml" TEXT,
ALTER COLUMN "ageMin" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "ageMax" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "CourseLesson" DROP COLUMN "productId",
ADD COLUMN     "courseId" UUID NOT NULL,
ADD COLUMN     "isFreePreview" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CourseModule" DROP COLUMN "productId",
ADD COLUMN     "courseId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "DiscountCode" DROP COLUMN "applicableProductId",
ADD COLUMN     "applicableBundleId" UUID,
ADD COLUMN     "applicableCourseId" UUID;

-- AlterTable
ALTER TABLE "Entitlement" DROP COLUMN "productId",
ADD COLUMN     "bundleId" UUID,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "courseId" UUID,
ADD COLUMN     "paidAmountCents" INTEGER,
ADD COLUMN     "paidCurrency" TEXT,
ADD COLUMN     "priceVariantId" UUID,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Journey" DROP COLUMN "productId",
ADD COLUMN     "courseId" UUID,
ALTER COLUMN "targetAgeMin" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "targetAgeMax" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "UserTag" ALTER COLUMN "id" DROP DEFAULT;

-- DropTable
DROP TABLE "BundleItem";

-- DropTable
DROP TABLE "CorpusEntry";

-- DropTable
DROP TABLE "Product";

-- DropEnum
DROP TYPE "AccessLevel";

-- DropEnum
DROP TYPE "CorpusType";

-- DropEnum
DROP TYPE "ProductType";

-- CreateTable
CREATE TABLE "Course" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "landingPage" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "showStandalone" BOOLEAN NOT NULL DEFAULT false,
    "stripeProductId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bundle" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "landingPage" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "stripeProductId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleCourse" (
    "id" UUID NOT NULL,
    "bundleId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BundleCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceVariant" (
    "id" UUID NOT NULL,
    "courseId" UUID,
    "bundleId" UUID,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'DKK',
    "billingType" "BillingType" NOT NULL,
    "interval" "BillingInterval",
    "intervalCount" INTEGER NOT NULL DEFAULT 1,
    "trialDays" INTEGER,
    "stripePriceId" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isHighlighted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedContent" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "contentUnitId" UUID NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityRoomTag" (
    "roomId" UUID NOT NULL,
    "tagId" UUID NOT NULL,

    CONSTRAINT "CommunityRoomTag_pkey" PRIMARY KEY ("roomId","tagId")
);

-- CreateTable
CREATE TABLE "CancellationReason" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "CancellationReason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CancellationSurvey" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "entitlementId" UUID NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "primaryReasonId" UUID,
    "feedback" TEXT,
    "wouldReturn" BOOLEAN,
    "offeredPause" BOOLEAN NOT NULL DEFAULT false,
    "pauseAccepted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CancellationSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CancellationSurveyTag" (
    "surveyId" UUID NOT NULL,
    "reasonId" UUID NOT NULL,

    CONSTRAINT "CancellationSurveyTag_pkey" PRIMARY KEY ("surveyId","reasonId")
);

-- CreateTable
CREATE TABLE "RetentionOffer" (
    "id" UUID NOT NULL,
    "organizationId" UUID,
    "name" TEXT NOT NULL,
    "offerType" "RetentionOfferType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "maxUsesPerUser" INTEGER NOT NULL DEFAULT 1,
    "cooldownDays" INTEGER NOT NULL DEFAULT 365,
    "stripeCouponId" TEXT,
    "durationMonths" INTEGER,
    "pauseMonths" INTEGER,
    "supportUrl" TEXT,
    "supportMessage" TEXT,
    "contentUrl" TEXT,
    "contentMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetentionOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetentionOfferTrigger" (
    "id" UUID NOT NULL,
    "offerId" UUID NOT NULL,
    "cancellationReasonId" UUID NOT NULL,

    CONSTRAINT "RetentionOfferTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetentionOfferAcceptance" (
    "id" UUID NOT NULL,
    "offerId" UUID NOT NULL,
    "surveyId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "offerType" "RetentionOfferType" NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "RetentionOfferAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE INDEX "Course_isActive_idx" ON "Course"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Bundle_slug_key" ON "Bundle"("slug");

-- CreateIndex
CREATE INDEX "Bundle_isActive_idx" ON "Bundle"("isActive");

-- CreateIndex
CREATE INDEX "BundleCourse_bundleId_position_idx" ON "BundleCourse"("bundleId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "BundleCourse_bundleId_courseId_key" ON "BundleCourse"("bundleId", "courseId");

-- CreateIndex
CREATE INDEX "PriceVariant_courseId_position_idx" ON "PriceVariant"("courseId", "position");

-- CreateIndex
CREATE INDEX "PriceVariant_bundleId_position_idx" ON "PriceVariant"("bundleId", "position");

-- CreateIndex
CREATE INDEX "SavedContent_userId_savedAt_idx" ON "SavedContent"("userId", "savedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SavedContent_userId_contentUnitId_key" ON "SavedContent"("userId", "contentUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "CancellationReason_slug_key" ON "CancellationReason"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CancellationSurvey_entitlementId_key" ON "CancellationSurvey"("entitlementId");

-- CreateIndex
CREATE INDEX "CancellationSurvey_userId_submittedAt_idx" ON "CancellationSurvey"("userId", "submittedAt");

-- CreateIndex
CREATE INDEX "CancellationSurvey_cancelledAt_idx" ON "CancellationSurvey"("cancelledAt");

-- CreateIndex
CREATE UNIQUE INDEX "CancellationSurvey_userId_entitlementId_key" ON "CancellationSurvey"("userId", "entitlementId");

-- CreateIndex
CREATE INDEX "RetentionOffer_organizationId_isActive_priority_idx" ON "RetentionOffer"("organizationId", "isActive", "priority");

-- CreateIndex
CREATE INDEX "RetentionOffer_offerType_isActive_idx" ON "RetentionOffer"("offerType", "isActive");

-- CreateIndex
CREATE INDEX "RetentionOfferTrigger_cancellationReasonId_idx" ON "RetentionOfferTrigger"("cancellationReasonId");

-- CreateIndex
CREATE UNIQUE INDEX "RetentionOfferTrigger_offerId_cancellationReasonId_key" ON "RetentionOfferTrigger"("offerId", "cancellationReasonId");

-- CreateIndex
CREATE UNIQUE INDEX "RetentionOfferAcceptance_surveyId_key" ON "RetentionOfferAcceptance"("surveyId");

-- CreateIndex
CREATE INDEX "RetentionOfferAcceptance_userId_acceptedAt_idx" ON "RetentionOfferAcceptance"("userId", "acceptedAt");

-- CreateIndex
CREATE INDEX "RetentionOfferAcceptance_offerId_acceptedAt_idx" ON "RetentionOfferAcceptance"("offerId", "acceptedAt");

-- CreateIndex
CREATE INDEX "CourseLesson_courseId_position_idx" ON "CourseLesson"("courseId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "CourseLesson_courseId_contentUnitId_key" ON "CourseLesson"("courseId", "contentUnitId");

-- CreateIndex
CREATE INDEX "CourseModule_courseId_idx" ON "CourseModule"("courseId");

-- CreateIndex
CREATE INDEX "Entitlement_userId_status_courseId_idx" ON "Entitlement"("userId", "status", "courseId");

-- CreateIndex
CREATE INDEX "Entitlement_userId_status_bundleId_idx" ON "Entitlement"("userId", "status", "bundleId");

-- CreateIndex
CREATE INDEX "Entitlement_organizationId_status_idx" ON "Entitlement"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Entitlement_status_cancelledAt_idx" ON "Entitlement"("status", "cancelledAt");

-- CreateIndex
CREATE INDEX "JourneyDay_phaseId_position_idx" ON "JourneyDay"("phaseId", "position");

-- CreateIndex
CREATE INDEX "JourneyDayAction_dayId_idx" ON "JourneyDayAction"("dayId");

-- CreateIndex
CREATE INDEX "JourneyDayContent_dayId_position_idx" ON "JourneyDayContent"("dayId", "position");

-- CreateIndex
CREATE INDEX "JourneyPhase_journeyId_position_idx" ON "JourneyPhase"("journeyId", "position");

-- CreateIndex
CREATE INDEX "User_organizationId_createdAt_idx" ON "User"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "User_organizationId_lastActiveAt_idx" ON "User"("organizationId", "lastActiveAt");

-- CreateIndex
CREATE INDEX "UserJourney_userId_completedAt_idx" ON "UserJourney"("userId", "completedAt");

-- AddForeignKey
ALTER TABLE "BundleCourse" ADD CONSTRAINT "BundleCourse_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleCourse" ADD CONSTRAINT "BundleCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceVariant" ADD CONSTRAINT "PriceVariant_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceVariant" ADD CONSTRAINT "PriceVariant_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseLesson" ADD CONSTRAINT "CourseLesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseModule" ADD CONSTRAINT "CourseModule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_priceVariantId_fkey" FOREIGN KEY ("priceVariantId") REFERENCES "PriceVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCode" ADD CONSTRAINT "DiscountCode_applicableCourseId_fkey" FOREIGN KEY ("applicableCourseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCode" ADD CONSTRAINT "DiscountCode_applicableBundleId_fkey" FOREIGN KEY ("applicableBundleId") REFERENCES "Bundle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedContent" ADD CONSTRAINT "SavedContent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedContent" ADD CONSTRAINT "SavedContent_contentUnitId_fkey" FOREIGN KEY ("contentUnitId") REFERENCES "ContentUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journey" ADD CONSTRAINT "Journey_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityRoomTag" ADD CONSTRAINT "CommunityRoomTag_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CommunityRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityRoomTag" ADD CONSTRAINT "CommunityRoomTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "ContentTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancellationSurvey" ADD CONSTRAINT "CancellationSurvey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancellationSurvey" ADD CONSTRAINT "CancellationSurvey_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "Entitlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancellationSurvey" ADD CONSTRAINT "CancellationSurvey_primaryReasonId_fkey" FOREIGN KEY ("primaryReasonId") REFERENCES "CancellationReason"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancellationSurveyTag" ADD CONSTRAINT "CancellationSurveyTag_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "CancellationSurvey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancellationSurveyTag" ADD CONSTRAINT "CancellationSurveyTag_reasonId_fkey" FOREIGN KEY ("reasonId") REFERENCES "CancellationReason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetentionOfferTrigger" ADD CONSTRAINT "RetentionOfferTrigger_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "RetentionOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetentionOfferTrigger" ADD CONSTRAINT "RetentionOfferTrigger_cancellationReasonId_fkey" FOREIGN KEY ("cancellationReasonId") REFERENCES "CancellationReason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetentionOfferAcceptance" ADD CONSTRAINT "RetentionOfferAcceptance_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "RetentionOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetentionOfferAcceptance" ADD CONSTRAINT "RetentionOfferAcceptance_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "CancellationSurvey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

