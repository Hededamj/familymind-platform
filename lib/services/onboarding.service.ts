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

export async function saveOnboardingProfile(userId: string, data: {
  responses: Array<{ questionId: string; selectedOptionIds: string[] }>
  childAges?: number[]
  primaryChallengeTagId?: string
}) {
  await prisma.userProfile.upsert({
    where: { userId },
    update: {
      responses: data.responses,
      childAges: data.childAges ?? Prisma.DbNull,
      primaryChallengeTagId: data.primaryChallengeTagId || null,
      completedAt: new Date(),
    },
    create: {
      userId,
      responses: data.responses,
      childAges: data.childAges ?? Prisma.DbNull,
      primaryChallengeTagId: data.primaryChallengeTagId || null,
      completedAt: new Date(),
    },
  })

  // Mark onboarding as completed
  await prisma.user.update({
    where: { id: userId },
    data: { onboardingCompleted: true },
  })
}

export async function getRecommendations(userId: string) {
  const profile = await prisma.userProfile.findUnique({ where: { userId } })
  if (!profile) return []

  const rules = await prisma.recommendationRule.findMany({
    where: { isActive: true },
    orderBy: { priority: 'desc' },
  })

  const recommendations: Array<{
    type: string
    id: string
    title: string
    description: string | null
    slug: string
    priority: number
  }> = []

  for (const rule of rules) {
    const conditions = rule.conditions as Record<string, unknown>
    let matches = true

    // Check tag condition
    if (conditions.tagId && profile.primaryChallengeTagId !== conditions.tagId) {
      matches = false
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
        if (!hasMatchingAge) matches = false
      }
    }

    if (matches) {
      if (rule.targetType === 'JOURNEY') {
        const journey = await prisma.journey.findUnique({
          where: { id: rule.targetId, isActive: true },
        })
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
        const product = await prisma.product.findUnique({
          where: { id: rule.targetId, isActive: true },
        })
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
      }
    }
  }

  return recommendations
}
