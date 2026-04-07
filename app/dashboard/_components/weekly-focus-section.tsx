import { getWeeklyFocus } from '@/lib/services/dashboard.service'
import { getUserActiveJourney } from '@/lib/services/journey.service'
import { SectionHeading } from './section-heading'
import { WeeklyFocusCard } from './weekly-focus-card'

export async function WeeklyFocusSection({ userId }: { userId: string }) {
  const [weeklyFocus, activeJourney] = await Promise.all([
    getWeeklyFocus(userId),
    getUserActiveJourney(userId),
  ])

  if (!weeklyFocus?.currentDay || !activeJourney) return null

  return (
    <section>
      <SectionHeading title="Din gode uge" subtitle="Nyt hver mandag" />
      <WeeklyFocusCard
        weeklyFocus={weeklyFocus}
        journeyTitle={activeJourney.journey.title}
        journeySlug={activeJourney.journey.slug}
      />
    </section>
  )
}
