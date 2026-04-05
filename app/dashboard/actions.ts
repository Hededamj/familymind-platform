'use server'

import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getUserActiveJourney } from '@/lib/services/journey.service'

export async function submitDashboardReflection(reflection: string) {
  if (!reflection.trim()) {
    throw new Error('Refleksion må ikke være tom.')
  }

  const user = await requireAuth()

  const activeJourney = await getUserActiveJourney(user.id)

  if (!activeJourney || !activeJourney.currentDayId) {
    return { error: 'Ingen aktiv dag at registrere refleksion for.' }
  }

  const checkInOption = await prisma.checkInOption.findFirst({
    where: { isActive: true },
    orderBy: { position: 'asc' },
  })

  if (!checkInOption) {
    return { error: 'Ingen check-in muligheder konfigureret.' }
  }

  await prisma.userDayCheckIn.create({
    data: {
      userJourneyId: activeJourney.id,
      dayId: activeJourney.currentDayId,
      checkInOptionId: checkInOption.id,
      reflection: reflection.trim(),
    },
  })

  revalidatePath('/dashboard')

  return { success: true }
}
