-- Performance indexes for hot query paths.
-- All statements are additive (CREATE INDEX only). Safe to apply concurrently in production
-- by manually rewriting as `CREATE INDEX CONCURRENTLY` if desired.

-- User: org-scoped analytics queries (signups, active users)
CREATE INDEX "User_organizationId_createdAt_idx" ON "User"("organizationId", "createdAt");
CREATE INDEX "User_organizationId_lastActiveAt_idx" ON "User"("organizationId", "lastActiveAt");

-- Entitlement: org-scoped analytics, product joins, churn calculations
CREATE INDEX "Entitlement_organizationId_status_idx" ON "Entitlement"("organizationId", "status");
CREATE INDEX "Entitlement_productId_idx" ON "Entitlement"("productId");
CREATE INDEX "Entitlement_status_cancelledAt_idx" ON "Entitlement"("status", "cancelledAt");

-- UserJourney: completed-journey lookups (dashboard recently completed, alumni list)
CREATE INDEX "UserJourney_userId_completedAt_idx" ON "UserJourney"("userId", "completedAt");

-- Journey hierarchy: phase/day ordering loaded on every active-journey fetch
CREATE INDEX "JourneyPhase_journeyId_position_idx" ON "JourneyPhase"("journeyId", "position");
CREATE INDEX "JourneyDay_phaseId_position_idx" ON "JourneyDay"("phaseId", "position");
CREATE INDEX "JourneyDayContent_dayId_position_idx" ON "JourneyDayContent"("dayId", "position");
CREATE INDEX "JourneyDayAction_dayId_idx" ON "JourneyDayAction"("dayId");

-- CourseLesson: in-progress courses on dashboard, course detail pages
CREATE INDEX "CourseLesson_productId_position_idx" ON "CourseLesson"("productId", "position");
