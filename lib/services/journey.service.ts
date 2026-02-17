import { prisma } from '@/lib/prisma'

// --- Admin CRUD ---

export async function createJourney(data: {
  title: string
  description?: string
  slug: string
  targetAgeMin?: number
  targetAgeMax?: number
  estimatedDays?: number
}) {
  return prisma.journey.create({ data })
}

export async function updateJourney(id: string, data: Partial<{
  title: string
  description: string | null
  slug: string
  targetAgeMin: number | null
  targetAgeMax: number | null
  estimatedDays: number | null
  isActive: boolean
}>) {
  return prisma.journey.update({ where: { id }, data })
}

export async function deleteJourney(id: string) {
  return prisma.journey.delete({ where: { id } })
}

export async function listJourneys(filters?: { isActive?: boolean }) {
  return prisma.journey.findMany({
    where: filters?.isActive !== undefined ? { isActive: filters.isActive } : undefined,
    include: {
      phases: {
        include: { days: true },
        orderBy: { position: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getJourney(slug: string) {
  return prisma.journey.findUnique({
    where: { slug },
    include: {
      phases: {
        include: {
          days: {
            include: {
              contents: { include: { contentUnit: true }, orderBy: { position: 'asc' } },
              actions: true,
            },
            orderBy: { position: 'asc' },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
  })
}

export async function getJourneyById(id: string) {
  return prisma.journey.findUnique({
    where: { id },
    include: {
      phases: {
        include: {
          days: {
            include: {
              contents: { include: { contentUnit: true }, orderBy: { position: 'asc' } },
              actions: true,
            },
            orderBy: { position: 'asc' },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
  })
}

// --- Phase Management ---

export async function createPhase(journeyId: string, title: string) {
  const maxPos = await prisma.journeyPhase.aggregate({
    where: { journeyId },
    _max: { position: true },
  })
  return prisma.journeyPhase.create({
    data: { journeyId, title, position: (maxPos._max.position ?? 0) + 1 },
  })
}

export async function updatePhase(id: string, data: { title?: string; position?: number }) {
  return prisma.journeyPhase.update({ where: { id }, data })
}

export async function deletePhase(id: string) {
  return prisma.journeyPhase.delete({ where: { id } })
}

// --- Day Management ---

export async function createDay(phaseId: string, title?: string) {
  const maxPos = await prisma.journeyDay.aggregate({
    where: { phaseId },
    _max: { position: true },
  })
  return prisma.journeyDay.create({
    data: { phaseId, title, position: (maxPos._max.position ?? 0) + 1 },
  })
}

export async function updateDay(id: string, data: { title?: string; position?: number }) {
  return prisma.journeyDay.update({ where: { id }, data })
}

export async function deleteDay(id: string) {
  return prisma.journeyDay.delete({ where: { id } })
}

// --- Day Content ---

export async function addContentToDay(dayId: string, contentUnitId: string) {
  const maxPos = await prisma.journeyDayContent.aggregate({
    where: { dayId },
    _max: { position: true },
  })
  return prisma.journeyDayContent.create({
    data: { dayId, contentUnitId, position: (maxPos._max.position ?? 0) + 1 },
  })
}

export async function removeContentFromDay(id: string) {
  return prisma.journeyDayContent.delete({ where: { id } })
}

// --- Day Actions ---

export async function createDayAction(dayId: string, data: { actionText: string; reflectionPrompt?: string }) {
  return prisma.journeyDayAction.create({ data: { dayId, ...data } })
}

export async function updateDayAction(id: string, data: { actionText?: string; reflectionPrompt?: string }) {
  return prisma.journeyDayAction.update({ where: { id }, data })
}

export async function deleteDayAction(id: string) {
  return prisma.journeyDayAction.delete({ where: { id } })
}

// --- User Journey Progression ---

export async function startJourney(userId: string, journeyId: string) {
  return prisma.$transaction(async (tx) => {
    // Prevent duplicate active journeys at service layer
    const existing = await tx.userJourney.findFirst({
      where: { userId, status: 'ACTIVE' },
    })
    if (existing) throw new Error('User already has an active journey')

    const journey = await tx.journey.findUniqueOrThrow({
      where: { id: journeyId },
      include: {
        phases: {
          include: { days: { orderBy: { position: 'asc' } } },
          orderBy: { position: 'asc' },
        },
      },
    })

    const firstDay = journey.phases[0]?.days[0]
    if (!firstDay) throw new Error('Journey has no days')

    return tx.userJourney.create({
      data: {
        userId,
        journeyId,
        currentDayId: firstDay.id,
        status: 'ACTIVE',
      },
    })
  })
}

export async function getUserActiveJourney(userId: string) {
  return prisma.userJourney.findFirst({
    where: { userId, status: 'ACTIVE' },
    include: {
      journey: {
        include: {
          phases: {
            include: {
              days: { orderBy: { position: 'asc' } },
            },
            orderBy: { position: 'asc' },
          },
        },
      },
      currentDay: {
        include: {
          contents: { include: { contentUnit: true }, orderBy: { position: 'asc' } },
          actions: true,
          phase: true,
        },
      },
      checkIns: true,
    },
  })
}

export async function completeDay(userJourneyId: string, dayId: string, checkInOptionId: string, reflection?: string) {
  return prisma.$transaction(async (tx) => {
    // Re-verify current day inside transaction (prevents race conditions)
    const uj = await tx.userJourney.findUniqueOrThrow({
      where: { id: userJourneyId },
    })
    if (uj.currentDayId !== dayId) {
      throw new Error('Day already completed or skipped')
    }

    // Create check-in
    await tx.userDayCheckIn.create({
      data: { userJourneyId, dayId, checkInOptionId, reflection },
    })

    // Find next day
    const userJourney = await tx.userJourney.findUniqueOrThrow({
      where: { id: userJourneyId },
      include: {
        journey: {
          include: {
            phases: {
              include: { days: { orderBy: { position: 'asc' } } },
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    })

    // Flatten all days in order
    const allDays = userJourney.journey.phases.flatMap(p => p.days)
    const currentIndex = allDays.findIndex(d => d.id === dayId)
    const nextDay = allDays[currentIndex + 1]

    if (nextDay) {
      return tx.userJourney.update({
        where: { id: userJourneyId },
        data: { currentDayId: nextDay.id },
      })
    } else {
      return tx.userJourney.update({
        where: { id: userJourneyId },
        data: { status: 'COMPLETED', completedAt: new Date(), currentDayId: null },
      })
    }
  })
}

export async function getJourneyProgress(userJourneyId: string) {
  const userJourney = await prisma.userJourney.findUniqueOrThrow({
    where: { id: userJourneyId },
    include: {
      journey: {
        include: {
          phases: {
            include: { days: { orderBy: { position: 'asc' } } },
            orderBy: { position: 'asc' },
          },
        },
      },
      checkIns: true,
    },
  })

  const allDays = userJourney.journey.phases.flatMap(p => p.days)
  const completedDayIds = new Set(userJourney.checkIns.map(c => c.dayId))
  const totalDays = allDays.length
  const completedDays = completedDayIds.size
  const currentDayIndex = allDays.findIndex(d => d.id === userJourney.currentDayId)

  return {
    totalDays,
    completedDays,
    currentDayNumber: currentDayIndex + 1,
    percentComplete: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
    phases: userJourney.journey.phases.map(phase => ({
      id: phase.id,
      title: phase.title,
      days: phase.days.map(day => ({
        id: day.id,
        title: day.title,
        completed: completedDayIds.has(day.id),
        isCurrent: day.id === userJourney.currentDayId,
      })),
    })),
  }
}
