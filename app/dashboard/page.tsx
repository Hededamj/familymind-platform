import Link from 'next/link'
import { Settings, ArrowRight, Compass, TrendingUp } from 'lucide-react'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getDashboardState } from '@/lib/services/dashboard.service'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DashboardMessageBanner } from './_components/dashboard-message-banner'
import { JourneyDayCard } from './_components/journey-day-card'
import { CourseProgressCard } from './_components/course-progress-card'
import { RecommendationSection } from './_components/recommendation-section'
import { CompletedJourneyCard } from './_components/completed-journey-card'
import { NotificationBell } from './_components/notification-bell'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 10) return 'Godmorgen'
  if (hour < 17) return 'Hej'
  return 'God aften'
}

export default async function DashboardPage() {
  const user = await requireAuth()

  // Redirect non-admin users who haven't completed onboarding
  if (!user.onboardingCompleted && user.role !== 'ADMIN') {
    redirect('/onboarding')
  }

  const {
    stateKey,
    message,
    activeJourney,
    journeyProgress,
    inProgressCourses,
    recommendations,
    recentlyCompleted,
  } = await getDashboardState(user.id)

  const displayName = user.name || user.email.split('@')[0]

  return (
    <div className="flex min-h-screen flex-col px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/" className="mb-2 block font-serif text-lg text-primary">
              FamilyMind
            </Link>
            <h1 className="font-serif text-2xl sm:text-3xl">
              {getGreeting()}, {displayName}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Link
              href="/dashboard/progress"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
            >
              <TrendingUp className="size-4" />
              <span className="hidden sm:inline">Fremgang</span>
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
            >
              <Settings className="size-4" />
              <span className="hidden sm:inline">Indstillinger</span>
            </Link>
          </div>
        </div>

        {/* State-based content */}
        <div className="space-y-6">
          {stateKey === 'new_user' && (
            <NewUserView
              message={message}
              recommendations={recommendations}
            />
          )}

          {stateKey === 'active_journey' && activeJourney?.currentDay && journeyProgress && (
            <ActiveJourneyView
              message={message}
              activeJourney={activeJourney}
              journeyProgress={journeyProgress}
            />
          )}

          {stateKey === 'active_journey_plus_courses' && activeJourney?.currentDay && journeyProgress && (
            <ActiveJourneyPlusCoursesView
              message={message}
              activeJourney={activeJourney}
              journeyProgress={journeyProgress}
              inProgressCourses={inProgressCourses}
            />
          )}

          {stateKey === 'no_journey_has_courses' && (
            <NoJourneyHasCoursesView
              message={message}
              inProgressCourses={inProgressCourses}
            />
          )}

          {stateKey === 'completed_journey' && (
            <CompletedJourneyView
              message={message}
              recentlyCompleted={recentlyCompleted}
              recommendations={recommendations}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  State views                                                               */
/* -------------------------------------------------------------------------- */

interface DashboardMessage {
  heading: string
  body: string
  ctaLabel?: string | null
  ctaUrl?: string | null
}

/* --- new_user --- */

function NewUserView({
  message,
  recommendations,
}: {
  message: DashboardMessage | null
  recommendations: Array<{
    type: string
    id: string
    title: string
    description: string | null
    slug: string
    priority: number
  }>
}) {
  return (
    <>
      {message ? (
        <DashboardMessageBanner
          heading={message.heading}
          body={message.body}
          ctaLabel={message.ctaLabel}
          ctaUrl={message.ctaUrl}
        />
      ) : (
        <DashboardMessageBanner
          heading="Velkommen til FamilyMind!"
          body="Start dit første forløb eller udforsk vores kurser for at komme i gang."
          ctaLabel="Udforsk indhold"
          ctaUrl="/browse"
        />
      )}

      <RecommendationSection recommendations={recommendations} />

      {recommendations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-10 text-center">
            <Compass className="mb-4 size-12 text-muted-foreground/50" />
            <h2 className="mb-2 text-lg font-semibold">
              Udforsk vores indhold
            </h2>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Find forløb og kurser der passer til din familie.
            </p>
            <Button asChild>
              <Link href="/browse">
                Se alle forløb og kurser
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  )
}

/* --- active_journey --- */

function ActiveJourneyView({
  message,
  activeJourney,
  journeyProgress,
}: {
  message: DashboardMessage | null
  activeJourney: NonNullable<
    Awaited<ReturnType<typeof getDashboardState>>['activeJourney']
  >
  journeyProgress: NonNullable<
    Awaited<ReturnType<typeof getDashboardState>>['journeyProgress']
  >
}) {
  return (
    <>
      {message && (
        <DashboardMessageBanner
          heading={message.heading}
          body={message.body}
          ctaLabel={message.ctaLabel}
          ctaUrl={message.ctaUrl}
        />
      )}

      <JourneyDayCard
        journey={activeJourney.journey}
        currentDay={activeJourney.currentDay!}
        progress={journeyProgress}
      />
    </>
  )
}

/* --- active_journey_plus_courses --- */

function ActiveJourneyPlusCoursesView({
  message,
  activeJourney,
  journeyProgress,
  inProgressCourses,
}: {
  message: DashboardMessage | null
  activeJourney: NonNullable<
    Awaited<ReturnType<typeof getDashboardState>>['activeJourney']
  >
  journeyProgress: NonNullable<
    Awaited<ReturnType<typeof getDashboardState>>['journeyProgress']
  >
  inProgressCourses: Awaited<
    ReturnType<typeof getDashboardState>
  >['inProgressCourses']
}) {
  return (
    <>
      {message && (
        <DashboardMessageBanner
          heading={message.heading}
          body={message.body}
          ctaLabel={message.ctaLabel}
          ctaUrl={message.ctaUrl}
        />
      )}

      <JourneyDayCard
        journey={activeJourney.journey}
        currentDay={activeJourney.currentDay!}
        progress={journeyProgress}
      />

      {inProgressCourses.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Dine kurser</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {inProgressCourses.map((course) => (
              <CourseProgressCard key={course.product.id} {...course} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

/* --- no_journey_has_courses --- */

function NoJourneyHasCoursesView({
  message,
  inProgressCourses,
}: {
  message: DashboardMessage | null
  inProgressCourses: Awaited<
    ReturnType<typeof getDashboardState>
  >['inProgressCourses']
}) {
  return (
    <>
      {message ? (
        <DashboardMessageBanner
          heading={message.heading}
          body={message.body}
          ctaLabel={message.ctaLabel}
          ctaUrl={message.ctaUrl}
        />
      ) : (
        <DashboardMessageBanner
          heading="Prøv et forløb"
          body="Udover dine kurser kan du starte et dagligt forløb, der guider dig skridt for skridt."
          ctaLabel="Se forløb"
          ctaUrl="/browse"
        />
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold">Dine kurser</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {inProgressCourses.map((course) => (
            <CourseProgressCard key={course.product.id} {...course} />
          ))}
        </div>
      </section>
    </>
  )
}

/* --- completed_journey --- */

function CompletedJourneyView({
  message,
  recentlyCompleted,
  recommendations,
}: {
  message: DashboardMessage | null
  recentlyCompleted: Awaited<
    ReturnType<typeof getDashboardState>
  >['recentlyCompleted']
  recommendations: Awaited<
    ReturnType<typeof getDashboardState>
  >['recommendations']
}) {
  return (
    <>
      {recentlyCompleted && (
        <CompletedJourneyCard
          journeyTitle={recentlyCompleted.journey.title}
        />
      )}

      {message ? (
        <DashboardMessageBanner
          heading={message.heading}
          body={message.body}
          ctaLabel={message.ctaLabel}
          ctaUrl={message.ctaUrl}
        />
      ) : (
        <DashboardMessageBanner
          heading="Hvad bliver det næste?"
          body="Du har gennemført dit forløb - fantastisk! Er du klar til at starte et nyt?"
          ctaLabel="Se flere forløb"
          ctaUrl="/browse"
        />
      )}

      <RecommendationSection recommendations={recommendations} />
    </>
  )
}
