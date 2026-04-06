import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { trackActivity } from '@/lib/track-activity'
import { getDashboardState } from '@/lib/services/dashboard.service'
import { getTenantConfig } from '@/lib/services/tenant.service'
import { CommunityPills } from '@/components/community-pills'
import { listRooms } from '@/lib/services/community.service'
import { DashboardMessageBanner } from './_components/dashboard-message-banner'
import { CourseProgressCard } from './_components/course-progress-card'
import { RecommendationSection } from './_components/recommendation-section'
import { CompletedJourneyCard } from './_components/completed-journey-card'
import { DashboardCheckIn } from './_components/dashboard-check-in'
import { SectionHeading } from './_components/section-heading'
import { WeeklyFocusCard } from './_components/weekly-focus-card'
import { WelcomeDialog } from '@/components/welcome-dialog'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 10) return 'Godmorgen'
  if (hour < 17) return 'Hej'
  return 'God aften'
}

export default async function DashboardPage() {
  const user = await requireAuth()
  trackActivity() // fire-and-forget, no await

  // Redirect non-admin users who haven't completed onboarding
  if (!user.onboardingCompleted && user.role !== 'ADMIN') {
    redirect('/onboarding')
  }

  const [dashboardState, tenantConfig, rooms] = await Promise.all([
    getDashboardState(user.id),
    getTenantConfig(),
    listRooms(),
  ])

  const {
    checkInPrompt,
    weeklyFocus,
    personalizedWelcome,
    activeJourney,
    inProgressCourses,
    recommendations,
    recentlyCompleted,
  } = dashboardState

  const displayName = user.name || user.email.split('@')[0]

  const showWelcome = !user.hasSeenWelcome && !recentlyCompleted

  return (
    <div className="overflow-hidden px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-2xl">
        {showWelcome && (
          <WelcomeDialog
            brandName={tenantConfig.brandName}
            hasActiveJourney={!!activeJourney}
          />
        )}
        {/* Greeting */}
        <h1 className="mb-2 font-serif text-2xl sm:text-3xl">
          {getGreeting()}, {displayName}
        </h1>

        {/* Personalized welcome subtitle */}
        {personalizedWelcome?.body && (
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            {personalizedWelcome.body}
          </p>
        )}

        <CommunityPills rooms={rooms} />

        <div className="mt-6 space-y-8">
          {/* Section 1: Check-in (always shown) */}
          <section>
            <SectionHeading title="Hvordan har du det?" subtitle="Del dine tanker" />
            <DashboardCheckIn
              prompt={checkInPrompt}
              hasActiveDay={!!(activeJourney?.currentDay)}
            />
          </section>

          {/* Section 2: Today's Focus (shown when weeklyFocus exists) */}
          {weeklyFocus?.currentDay && activeJourney && (
            <section>
              <SectionHeading title="Din gode uge" subtitle="Nyt hver mandag" />
              <WeeklyFocusCard
                weeklyFocus={weeklyFocus}
                journeyTitle={activeJourney.journey.title}
                journeySlug={activeJourney.journey.slug}
              />
            </section>
          )}

          {/* Section 3: Completed journey celebration */}
          {recentlyCompleted && (
            <CompletedJourneyCard journeyTitle={recentlyCompleted.journey.title} />
          )}

          {/* Section 4: Dashboard message / personalized welcome CTA */}
          {personalizedWelcome?.ctaLabel && personalizedWelcome?.ctaUrl && (
            <DashboardMessageBanner
              heading={personalizedWelcome.heading}
              body={personalizedWelcome.body}
              ctaLabel={personalizedWelcome.ctaLabel}
              ctaUrl={personalizedWelcome.ctaUrl}
            />
          )}

          {/* Section 5: In-progress courses */}
          {inProgressCourses.length > 0 && (
            <section>
              <SectionHeading title="Dine kurser" subtitle="Fortsæt hvor du slap" />
              <div className="grid gap-4 sm:grid-cols-2">
                {inProgressCourses.map((course) => (
                  <CourseProgressCard key={course.product.id} {...course} />
                ))}
              </div>
            </section>
          )}

          {/* Section 6: Recommendations (RecommendationSection has its own heading) */}
          {recommendations.length > 0 && (
            <RecommendationSection recommendations={recommendations} />
          )}
        </div>
      </div>
    </div>
  )
}
