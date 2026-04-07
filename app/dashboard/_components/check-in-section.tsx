import { getCheckInPrompt } from '@/lib/services/dashboard.service'
import { getUserActiveJourney } from '@/lib/services/journey.service'
import { DashboardCheckIn } from './dashboard-check-in'
import { SectionHeading } from './section-heading'

export async function CheckInSection({ userId }: { userId: string }) {
  const [checkInPrompt, activeJourney] = await Promise.all([
    getCheckInPrompt(userId),
    getUserActiveJourney(userId),
  ])

  return (
    <section>
      <SectionHeading title="Hvordan har du det?" subtitle="Del dine tanker" />
      <DashboardCheckIn
        prompt={checkInPrompt}
        hasActiveDay={!!activeJourney?.currentDay}
      />
    </section>
  )
}
