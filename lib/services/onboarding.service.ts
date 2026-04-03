import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export async function getActiveQuestions() {
  return prisma.onboardingQuestion.findMany({
    where: { isActive: true },
    include: {
      options: {
        include: { tag: true },
        orderBy: { position: 'asc' },
      },
    },
    orderBy: { position: 'asc' },
  })
}

/**
 * Save onboarding profile from raw responses.
 *
 * The client sends only the raw question responses. Derived fields
 * (primaryChallengeTagId, childAges) are computed server-side by
 * looking up the actual questions and options from the database.
 *
 * Convention: For SLIDER questions (which have no OnboardingOption rows),
 * the raw numeric value is stored as a string in selectedOptionIds[0].
 * For DATE questions, the ISO date string is stored in selectedOptionIds[0].
 */
export async function saveOnboardingProfile(userId: string, data: {
  responses: Array<{ questionId: string; selectedOptionIds: string[] }>
}) {
  // Fetch questions to derive fields server-side
  const questions = await getActiveQuestions()

  // Derive childAges from SLIDER and DATE responses
  const childAges: number[] = []
  for (const q of questions) {
    const response = data.responses.find((r) => r.questionId === q.id)
    if (!response) continue

    if (q.questionType === 'SLIDER') {
      const val = parseInt(response.selectedOptionIds[0] ?? '', 10)
      if (!isNaN(val) && val >= 0 && val <= 216) {
        childAges.push(val)
      }
    }
    if (q.questionType === 'DATE') {
      const dateStr = response.selectedOptionIds[0]
      if (dateStr) {
        const birthDate = new Date(dateStr)
        if (!isNaN(birthDate.getTime())) {
          const now = new Date()
          const ageMonths =
            (now.getFullYear() - birthDate.getFullYear()) * 12 +
            (now.getMonth() - birthDate.getMonth())
          if (ageMonths >= 0) {
            childAges.push(ageMonths)
          }
        }
      }
    }
  }

  // Derive primaryChallengeTagId from the first tag-mapped SINGLE_SELECT question
  let primaryChallengeTagId: string | null = null
  for (const q of questions) {
    if (q.questionType === 'SINGLE_SELECT') {
      const hasTaggedOptions = q.options.some((o) => o.tagId)
      if (hasTaggedOptions) {
        const response = data.responses.find((r) => r.questionId === q.id)
        const selectedOptionId = response?.selectedOptionIds[0]
        if (selectedOptionId) {
          const selectedOption = q.options.find((o) => o.id === selectedOptionId)
          if (selectedOption?.tagId) {
            primaryChallengeTagId = selectedOption.tagId
          }
        }
        break
      }
    }
  }

  // Wrap in transaction so UserProfile + User update are atomic
  await prisma.$transaction(async (tx) => {
    await tx.userProfile.upsert({
      where: { userId },
      update: {
        responses: data.responses,
        childAges: childAges.length > 0 ? childAges : Prisma.DbNull,
        primaryChallengeTagId,
        completedAt: new Date(),
      },
      create: {
        userId,
        responses: data.responses,
        childAges: childAges.length > 0 ? childAges : Prisma.DbNull,
        primaryChallengeTagId,
        completedAt: new Date(),
      },
    })

    await tx.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    })
  })
}

export async function getRecommendations(userId: string) {
  const profile = await prisma.userProfile.findUnique({ where: { userId } })
  if (!profile) return []

  const rules = await prisma.recommendationRule.findMany({
    where: { isActive: true },
    orderBy: { priority: 'desc' },
  })

  // Filter matching rules in-memory first
  const matchingRules = rules.filter((rule) => {
    const conditions = rule.conditions as Record<string, unknown>

    // Check tag condition
    if (conditions.tagId && profile.primaryChallengeTagId !== conditions.tagId) {
      return false
    }

    // Check age condition
    if (conditions.ageMin !== undefined || conditions.ageMax !== undefined) {
      const ages = (profile.childAges as number[]) || []
      if (ages.length > 0) {
        const hasMatchingAge = ages.some(age => {
          if (conditions.ageMin !== undefined && age < (conditions.ageMin as number)) return false
          if (conditions.ageMax !== undefined && age > (conditions.ageMax as number)) return false
          return true
        })
        if (!hasMatchingAge) return false
      }
    }

    return true
  })

  if (matchingRules.length === 0) return []

  // Batch-fetch all target journeys, products, and rooms
  const journeyIds = matchingRules
    .filter((r) => r.targetType === 'JOURNEY')
    .map((r) => r.targetId)
  const productIds = matchingRules
    .filter((r) => r.targetType === 'PRODUCT')
    .map((r) => r.targetId)
  const roomIds = matchingRules
    .filter((r) => r.targetType === 'ROOM')
    .map((r) => r.targetId)

  // Exclude journeys the user has already completed
  const completedJourneys = journeyIds.length > 0
    ? await prisma.userJourney.findMany({
        where: { userId, journeyId: { in: journeyIds }, status: 'COMPLETED' },
        select: { journeyId: true },
      })
    : []
  const completedJourneyIds = new Set(completedJourneys.map((uj) => uj.journeyId))
  const eligibleJourneyIds = journeyIds.filter((id) => !completedJourneyIds.has(id))

  const [journeys, products, rooms] = await Promise.all([
    eligibleJourneyIds.length > 0
      ? prisma.journey.findMany({ where: { id: { in: eligibleJourneyIds }, isActive: true } })
      : Promise.resolve([]),
    productIds.length > 0
      ? prisma.product.findMany({ where: { id: { in: productIds }, isActive: true } })
      : Promise.resolve([]),
    roomIds.length > 0
      ? prisma.communityRoom.findMany({ where: { id: { in: roomIds }, isArchived: false } })
      : Promise.resolve([]),
  ])

  const journeyMap = new Map(journeys.map((j) => [j.id, j] as const))
  const productMap = new Map(products.map((p) => [p.id, p] as const))
  const roomMap = new Map(rooms.map((r) => [r.id, r] as const))

  // Build recommendations from matched data
  const recommendations: Array<{
    type: string
    id: string
    title: string
    description: string | null
    slug: string
    priority: number
  }> = []

  for (const rule of matchingRules) {
    if (rule.targetType === 'JOURNEY') {
      const journey = journeyMap.get(rule.targetId)
      if (journey) {
        recommendations.push({
          type: 'JOURNEY',
          id: journey.id,
          title: journey.title,
          description: journey.description,
          slug: journey.slug,
          priority: rule.priority,
        })
      }
    } else if (rule.targetType === 'PRODUCT') {
      const product = productMap.get(rule.targetId)
      if (product) {
        recommendations.push({
          type: 'PRODUCT',
          id: product.id,
          title: product.title,
          description: product.description,
          slug: product.slug,
          priority: rule.priority,
        })
      }
    } else if (rule.targetType === 'ROOM') {
      const room = roomMap.get(rule.targetId)
      if (room) {
        recommendations.push({
          type: 'ROOM',
          id: room.id,
          title: room.name,
          description: room.description,
          slug: room.slug,
          priority: rule.priority,
        })
      }
    }
  }

  return recommendations
}
