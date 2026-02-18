'use server'

import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
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
  const user = await requireAuth()

  // Verify the authenticated user owns this journey (prevents IDOR)
  const userJourney = await prisma.userJourney.findUnique({
    where: { id: userJourneyId },
  })
  if (!userJourney || userJourney.userId !== user.id) {
    throw new Error('Ikke autoriseret')
  }

  // Verify this is the current day (prevents skipping ahead)
  if (userJourney.currentDayId !== dayId) {
    throw new Error('Du kan kun færdiggøre den aktuelle dag')
  }

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
