'use server'

import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import {
  startJourney,
  completeDay,
  getUserActiveJourney,
} from '@/lib/services/journey.service'

export async function startJourneyAction(journeyId: string) {
  const user = await requireAuth()

  // Prevent starting if user already has an active journey
  const existing = await getUserActiveJourney(user.id)
  if (existing) {
    return { error: 'Du har allerede et aktivt forløb.' }
  }

  const userJourney = await startJourney(user.id, journeyId)

  revalidatePath('/dashboard')
  revalidatePath('/journeys')

  return { userJourneyId: userJourney.id, currentDayId: userJourney.currentDayId }
}

export async function completeDayAction(
  userJourneyId: string,
  dayId: string,
  checkInOptionId: string,
  reflection?: string,
  journeySlug?: string
) {
  await requireAuth()

  const updatedJourney = await completeDay(
    userJourneyId,
    dayId,
    checkInOptionId,
    reflection || undefined
  )

  revalidatePath('/dashboard')
  if (journeySlug) {
    revalidatePath(`/journeys/${journeySlug}`)
  }

  if (updatedJourney.status === 'COMPLETED') {
    return { completed: true, nextDayId: null }
  }

  return { completed: false, nextDayId: updatedJourney.currentDayId }
}
