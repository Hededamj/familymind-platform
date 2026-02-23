-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AccessLevel" AS ENUM ('FREE', 'SUBSCRIPTION', 'PURCHASE');

-- CreateEnum
CREATE TYPE "public"."Difficulty" AS ENUM ('INTRODUCTORY', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "public"."DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "public"."EntitlementSource" AS ENUM ('PURCHASE', 'SUBSCRIPTION', 'GIFT', 'B2B_LICENSE');

-- CreateEnum
CREATE TYPE "public"."EntitlementStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."InAppNotificationType" AS ENUM ('WEEKLY_PLAN', 'MIDWEEK_NUDGE', 'REFLECTION', 'MILESTONE', 'REENGAGEMENT', 'COMMUNITY_REPLY', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."JourneyStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "public"."MediaType" AS ENUM ('VIDEO', 'AUDIO', 'PDF', 'TEXT');

-- CreateEnum
CREATE TYPE "public"."MilestoneTriggerType" AS ENUM ('DAYS_ACTIVE', 'PHASE_COMPLETE', 'JOURNEY_COMPLETE', 'CONTENT_COUNT', 'CHECKIN_STREAK');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('WEEKLY_PLAN', 'MIDWEEK_NUDGE', 'REFLECTION', 'MONTHLY_PROGRESS');

-- CreateEnum
CREATE TYPE "public"."ProductType" AS ENUM ('SUBSCRIPTION', 'COURSE', 'SINGLE', 'BUNDLE');

-- CreateEnum
CREATE TYPE "public"."QuestionType" AS ENUM ('SINGLE_SELECT', 'MULTI_SELECT', 'DATE', 'SLIDER');

-- CreateEnum
CREATE TYPE "public"."ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateTable
CREATE TABLE "public"."BundleItem" (
    "id" UUID NOT NULL,
    "bundleProductId" UUID NOT NULL,
    "includedProductId" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BundleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CheckInOption" (
    "id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "emoji" TEXT,
    "position" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CheckInOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cohort" (
    "id" UUID NOT NULL,
    "journeyId" UUID NOT NULL,
    "name" TEXT,
    "maxMembers" INTEGER NOT NULL DEFAULT 25,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cohort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CohortBan" (
    "id" UUID NOT NULL,
    "cohortId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "reason" TEXT,
    "bannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CohortBan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CohortMember" (
    "id" UUID NOT NULL,
    "cohortId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CohortMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContentReport" (
    "id" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "postId" UUID,
    "replyId" UUID,
    "reason" TEXT NOT NULL,
    "status" "public"."ReportStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContentTag" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "ContentTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContentUnit" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "mediaType" "public"."MediaType" NOT NULL,
    "mediaUrl" TEXT,
    "bunnyVideoId" TEXT,
    "thumbnailUrl" TEXT,
    "durationMinutes" INTEGER,
    "difficulty" "public"."Difficulty" NOT NULL DEFAULT 'INTRODUCTORY',
    "ageMin" INTEGER,
    "ageMax" INTEGER,
    "isStandalone" BOOLEAN NOT NULL DEFAULT false,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "accessLevel" "public"."AccessLevel" NOT NULL DEFAULT 'FREE',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContentUnitTag" (
    "contentUnitId" UUID NOT NULL,
    "tagId" UUID NOT NULL,

    CONSTRAINT "ContentUnitTag_pkey" PRIMARY KEY ("contentUnitId","tagId")
);

-- CreateTable
CREATE TABLE "public"."CookieConsent" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "ipHash" TEXT NOT NULL,
    "statistics" BOOLEAN NOT NULL DEFAULT false,
    "marketing" BOOLEAN NOT NULL DEFAULT false,
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CookieConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourseLesson" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "contentUnitId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "moduleId" UUID,

    CONSTRAINT "CourseLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourseModule" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,

    CONSTRAINT "CourseModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DashboardMessage" (
    "id" UUID NOT NULL,
    "stateKey" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,

    CONSTRAINT "DashboardMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DiscountCode" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "type" "public"."DiscountType" NOT NULL,
    "value" INTEGER NOT NULL,
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "applicableProductId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DiscussionPost" (
    "id" UUID NOT NULL,
    "cohortId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "dayId" UUID,
    "promptId" UUID,
    "body" TEXT NOT NULL,
    "isPrompt" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DiscussionPrompt" (
    "id" UUID NOT NULL,
    "dayId" UUID NOT NULL,
    "promptText" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DiscussionPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DiscussionReply" (
    "id" UUID NOT NULL,
    "postId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailTemplate" (
    "id" UUID NOT NULL,
    "templateKey" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Entitlement" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "organizationId" UUID,
    "productId" UUID NOT NULL,
    "source" "public"."EntitlementSource" NOT NULL,
    "status" "public"."EntitlementStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeSubscriptionId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Journey" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "targetAgeMin" INTEGER,
    "targetAgeMax" INTEGER,
    "estimatedDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "coverImageUrl" TEXT,
    "productId" UUID,

    CONSTRAINT "Journey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JourneyDay" (
    "id" UUID NOT NULL,
    "phaseId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT,

    CONSTRAINT "JourneyDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JourneyDayAction" (
    "id" UUID NOT NULL,
    "dayId" UUID NOT NULL,
    "actionText" TEXT NOT NULL,
    "reflectionPrompt" TEXT,

    CONSTRAINT "JourneyDayAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JourneyDayContent" (
    "id" UUID NOT NULL,
    "dayId" UUID NOT NULL,
    "contentUnitId" UUID NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "JourneyDayContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JourneyPhase" (
    "id" UUID NOT NULL,
    "journeyId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "JourneyPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MilestoneDefinition" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "triggerType" "public"."MilestoneTriggerType" NOT NULL,
    "triggerValue" INTEGER NOT NULL,
    "celebrationTitle" TEXT NOT NULL,
    "celebrationMessage" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MilestoneDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "public"."InAppNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "actionUrl" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationSchedule" (
    "id" UUID NOT NULL,
    "notificationType" "public"."NotificationType" NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "timeOfDay" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OnboardingOption" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "tagId" UUID,
    "position" INTEGER NOT NULL,

    CONSTRAINT "OnboardingOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OnboardingQuestion" (
    "id" UUID NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" "public"."QuestionType" NOT NULL,
    "position" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "helperText" TEXT,

    CONSTRAINT "OnboardingQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Organization" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PostReaction" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "postId" UUID,
    "replyId" UUID,
    "emoji" TEXT NOT NULL DEFAULT '❤️',

    CONSTRAINT "PostReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "type" "public"."ProductType" NOT NULL,
    "priceAmountCents" INTEGER NOT NULL,
    "priceCurrency" TEXT NOT NULL DEFAULT 'DKK',
    "stripeProductId" TEXT,
    "stripePriceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "coverImageUrl" TEXT,
    "landingPage" JSONB,
    "thumbnailUrl" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReEngagementTier" (
    "id" UUID NOT NULL,
    "tierNumber" INTEGER NOT NULL,
    "daysInactiveMin" INTEGER NOT NULL,
    "daysInactiveMax" INTEGER NOT NULL,
    "emailTemplateId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ReEngagementTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RecommendationRule" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" UUID NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RecommendationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SiteSetting" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "organizationId" UUID,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserContentProgress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "contentUnitId" UUID NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserContentProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserDayCheckIn" (
    "id" UUID NOT NULL,
    "userJourneyId" UUID NOT NULL,
    "dayId" UUID NOT NULL,
    "checkInOptionId" UUID NOT NULL,
    "reflection" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDayCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserJourney" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "journeyId" UUID NOT NULL,
    "currentDayId" UUID,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "public"."JourneyStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "UserJourney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserNotificationLog" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "responses" JSONB,
    "childAges" JSONB,
    "primaryChallengeTagId" UUID,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BundleItem_bundleProductId_includedProductId_key" ON "public"."BundleItem"("bundleProductId" ASC, "includedProductId" ASC);

-- CreateIndex
CREATE INDEX "Cohort_journeyId_isOpen_idx" ON "public"."Cohort"("journeyId" ASC, "isOpen" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CohortBan_cohortId_userId_key" ON "public"."CohortBan"("cohortId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "CohortBan_userId_idx" ON "public"."CohortBan"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CohortMember_cohortId_userId_key" ON "public"."CohortMember"("cohortId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "CohortMember_userId_idx" ON "public"."CohortMember"("userId" ASC);

-- CreateIndex
CREATE INDEX "ContentReport_postId_idx" ON "public"."ContentReport"("postId" ASC);

-- CreateIndex
CREATE INDEX "ContentReport_replyId_idx" ON "public"."ContentReport"("replyId" ASC);

-- CreateIndex
CREATE INDEX "ContentReport_status_createdAt_idx" ON "public"."ContentReport"("status" ASC, "createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ContentTag_name_key" ON "public"."ContentTag"("name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ContentTag_slug_key" ON "public"."ContentTag"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ContentUnit_slug_key" ON "public"."ContentUnit"("slug" ASC);

-- CreateIndex
CREATE INDEX "CookieConsent_userId_idx" ON "public"."CookieConsent"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CourseLesson_productId_contentUnitId_key" ON "public"."CourseLesson"("productId" ASC, "contentUnitId" ASC);

-- CreateIndex
CREATE INDEX "CourseModule_productId_idx" ON "public"."CourseModule"("productId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "DashboardMessage_stateKey_key" ON "public"."DashboardMessage"("stateKey" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCode_code_key" ON "public"."DiscountCode"("code" ASC);

-- CreateIndex
CREATE INDEX "DiscussionPost_authorId_idx" ON "public"."DiscussionPost"("authorId" ASC);

-- CreateIndex
CREATE INDEX "DiscussionPost_cohortId_createdAt_idx" ON "public"."DiscussionPost"("cohortId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "DiscussionPrompt_dayId_idx" ON "public"."DiscussionPrompt"("dayId" ASC);

-- CreateIndex
CREATE INDEX "DiscussionReply_authorId_idx" ON "public"."DiscussionReply"("authorId" ASC);

-- CreateIndex
CREATE INDEX "DiscussionReply_postId_createdAt_idx" ON "public"."DiscussionReply"("postId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_templateKey_key" ON "public"."EmailTemplate"("templateKey" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Entitlement_stripeCheckoutSessionId_key" ON "public"."Entitlement"("stripeCheckoutSessionId" ASC);

-- CreateIndex
CREATE INDEX "Entitlement_stripeSubscriptionId_idx" ON "public"."Entitlement"("stripeSubscriptionId" ASC);

-- CreateIndex
CREATE INDEX "Entitlement_userId_status_idx" ON "public"."Entitlement"("userId" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Journey_slug_key" ON "public"."Journey"("slug" ASC);

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "public"."Notification"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "public"."Notification"("userId" ASC, "readAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "public"."Organization"("slug" ASC);

-- CreateIndex
CREATE INDEX "PostReaction_postId_idx" ON "public"."PostReaction"("postId" ASC);

-- CreateIndex
CREATE INDEX "PostReaction_replyId_idx" ON "public"."PostReaction"("replyId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PostReaction_userId_postId_emoji_key" ON "public"."PostReaction"("userId" ASC, "postId" ASC, "emoji" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PostReaction_userId_replyId_emoji_key" ON "public"."PostReaction"("userId" ASC, "replyId" ASC, "emoji" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "public"."Product"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ReEngagementTier_tierNumber_key" ON "public"."ReEngagementTier"("tierNumber" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SiteSetting_key_key" ON "public"."SiteSetting"("key" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE INDEX "UserContentProgress_userId_completedAt_idx" ON "public"."UserContentProgress"("userId" ASC, "completedAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UserContentProgress_userId_contentUnitId_key" ON "public"."UserContentProgress"("userId" ASC, "contentUnitId" ASC);

-- CreateIndex
CREATE INDEX "UserDayCheckIn_userJourneyId_idx" ON "public"."UserDayCheckIn"("userJourneyId" ASC);

-- CreateIndex
CREATE INDEX "UserJourney_userId_status_idx" ON "public"."UserJourney"("userId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "UserNotificationLog_userId_type_key_idx" ON "public"."UserNotificationLog"("userId" ASC, "type" ASC, "key" ASC);

-- CreateIndex
CREATE INDEX "UserNotificationLog_userId_type_sentAt_idx" ON "public"."UserNotificationLog"("userId" ASC, "type" ASC, "sentAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "public"."UserProfile"("userId" ASC);

-- AddForeignKey
ALTER TABLE "public"."BundleItem" ADD CONSTRAINT "BundleItem_bundleProductId_fkey" FOREIGN KEY ("bundleProductId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BundleItem" ADD CONSTRAINT "BundleItem_includedProductId_fkey" FOREIGN KEY ("includedProductId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cohort" ADD CONSTRAINT "Cohort_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "public"."Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CohortBan" ADD CONSTRAINT "CohortBan_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "public"."Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CohortBan" ADD CONSTRAINT "CohortBan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CohortMember" ADD CONSTRAINT "CohortMember_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "public"."Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CohortMember" ADD CONSTRAINT "CohortMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentReport" ADD CONSTRAINT "ContentReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."DiscussionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentReport" ADD CONSTRAINT "ContentReport_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "public"."DiscussionReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentReport" ADD CONSTRAINT "ContentReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentUnitTag" ADD CONSTRAINT "ContentUnitTag_contentUnitId_fkey" FOREIGN KEY ("contentUnitId") REFERENCES "public"."ContentUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentUnitTag" ADD CONSTRAINT "ContentUnitTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."ContentTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CookieConsent" ADD CONSTRAINT "CookieConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseLesson" ADD CONSTRAINT "CourseLesson_contentUnitId_fkey" FOREIGN KEY ("contentUnitId") REFERENCES "public"."ContentUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseLesson" ADD CONSTRAINT "CourseLesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "public"."CourseModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseLesson" ADD CONSTRAINT "CourseLesson_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseModule" ADD CONSTRAINT "CourseModule_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiscountCode" ADD CONSTRAINT "DiscountCode_applicableProductId_fkey" FOREIGN KEY ("applicableProductId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiscussionPost" ADD CONSTRAINT "DiscussionPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiscussionPost" ADD CONSTRAINT "DiscussionPost_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "public"."Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiscussionPost" ADD CONSTRAINT "DiscussionPost_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "public"."JourneyDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiscussionPost" ADD CONSTRAINT "DiscussionPost_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "public"."DiscussionPrompt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiscussionPrompt" ADD CONSTRAINT "DiscussionPrompt_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "public"."JourneyDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiscussionReply" ADD CONSTRAINT "DiscussionReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiscussionReply" ADD CONSTRAINT "DiscussionReply_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."DiscussionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Entitlement" ADD CONSTRAINT "Entitlement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Entitlement" ADD CONSTRAINT "Entitlement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Entitlement" ADD CONSTRAINT "Entitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Journey" ADD CONSTRAINT "Journey_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JourneyDay" ADD CONSTRAINT "JourneyDay_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "public"."JourneyPhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JourneyDayAction" ADD CONSTRAINT "JourneyDayAction_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "public"."JourneyDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JourneyDayContent" ADD CONSTRAINT "JourneyDayContent_contentUnitId_fkey" FOREIGN KEY ("contentUnitId") REFERENCES "public"."ContentUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JourneyDayContent" ADD CONSTRAINT "JourneyDayContent_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "public"."JourneyDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JourneyPhase" ADD CONSTRAINT "JourneyPhase_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "public"."Journey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OnboardingOption" ADD CONSTRAINT "OnboardingOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."OnboardingQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OnboardingOption" ADD CONSTRAINT "OnboardingOption_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."ContentTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostReaction" ADD CONSTRAINT "PostReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."DiscussionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostReaction" ADD CONSTRAINT "PostReaction_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "public"."DiscussionReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostReaction" ADD CONSTRAINT "PostReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReEngagementTier" ADD CONSTRAINT "ReEngagementTier_emailTemplateId_fkey" FOREIGN KEY ("emailTemplateId") REFERENCES "public"."EmailTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserContentProgress" ADD CONSTRAINT "UserContentProgress_contentUnitId_fkey" FOREIGN KEY ("contentUnitId") REFERENCES "public"."ContentUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserContentProgress" ADD CONSTRAINT "UserContentProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserDayCheckIn" ADD CONSTRAINT "UserDayCheckIn_checkInOptionId_fkey" FOREIGN KEY ("checkInOptionId") REFERENCES "public"."CheckInOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserDayCheckIn" ADD CONSTRAINT "UserDayCheckIn_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "public"."JourneyDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserDayCheckIn" ADD CONSTRAINT "UserDayCheckIn_userJourneyId_fkey" FOREIGN KEY ("userJourneyId") REFERENCES "public"."UserJourney"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserJourney" ADD CONSTRAINT "UserJourney_currentDayId_fkey" FOREIGN KEY ("currentDayId") REFERENCES "public"."JourneyDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserJourney" ADD CONSTRAINT "UserJourney_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "public"."Journey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserJourney" ADD CONSTRAINT "UserJourney_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserNotificationLog" ADD CONSTRAINT "UserNotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

