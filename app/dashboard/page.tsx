import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { trackActivity } from '@/lib/track-activity'
import { CheckInSection } from './_components/check-in-section'
import { WeeklyFocusSection } from './_components/weekly-focus-section'
import { CoursesSection } from './_components/courses-section'
import { RecommendationsSectionAsync } from './_components/recommendations-section-async'
import { CommunityPillsSection } from './_components/community-pills-section'
import {
  PersonalizedWelcomeSubtitle,
  CompletedJourneyBanner,
  DashboardMessageSection,
} from './_components/personalized-welcome-section'
import { WelcomeDialogSection } from './_components/welcome-dialog-section'
import {
  CheckInSkeleton,
  CommunityPillsSkeleton,
  CoursesSkeleton,
  PersonalizedWelcomeSkeleton,
  RecommendationsSkeleton,
  WeeklyFocusSkeleton,
} from './_components/dashboard-skeletons'

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

  const displayName = user.name || user.email.split('@')[0]

  return (
    <div className="overflow-hidden px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-2xl">
        <Suspense fallback={null}>
          <WelcomeDialogSection
            userId={user.id}
            hasSeenWelcome={user.hasSeenWelcome}
          />
        </Suspense>

        {/* Greeting — renders immediately */}
        <h1 className="mb-2 font-serif text-2xl sm:text-3xl">
          {getGreeting()}, {displayName}
        </h1>

        {/* Personalized welcome subtitle */}
        <Suspense fallback={<PersonalizedWelcomeSkeleton />}>
          <PersonalizedWelcomeSubtitle userId={user.id} />
        </Suspense>

        <Suspense fallback={<CommunityPillsSkeleton />}>
          <CommunityPillsSection />
        </Suspense>

        <div className="mt-6 space-y-8">
          <Suspense fallback={<CheckInSkeleton />}>
            <CheckInSection userId={user.id} />
          </Suspense>

          <Suspense fallback={<WeeklyFocusSkeleton />}>
            <WeeklyFocusSection userId={user.id} />
          </Suspense>

          <Suspense fallback={null}>
            <CompletedJourneyBanner userId={user.id} />
          </Suspense>

          <Suspense fallback={null}>
            <DashboardMessageSection userId={user.id} />
          </Suspense>

          <Suspense fallback={<CoursesSkeleton />}>
            <CoursesSection userId={user.id} />
          </Suspense>

          <Suspense fallback={<RecommendationsSkeleton />}>
            <RecommendationsSectionAsync userId={user.id} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
