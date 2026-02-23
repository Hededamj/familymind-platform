import { prisma } from '@/lib/prisma'

export async function getOnboardingQuestions() {
  return prisma.onboardingQuestion.findMany({
    where: { isActive: true },
    include: { options: { orderBy: { position: 'asc' } } },
    orderBy: { position: 'asc' },
  })
}

export async function getEmailTemplate(key: string) {
  return prisma.emailTemplate.findUnique({ where: { templateKey: key } })
}

export async function getNotificationSchedule() {
  return prisma.notificationSchedule.findMany({
    where: { isActive: true },
    orderBy: { notificationType: 'asc' },
  })
}

export async function getReEngagementTiers() {
  return prisma.reEngagementTier.findMany({
    where: { isActive: true },
    include: { emailTemplate: true },
    orderBy: { tierNumber: 'asc' },
  })
}

export async function getMilestoneDefinitions() {
  return prisma.milestoneDefinition.findMany({
    where: { isActive: true },
    orderBy: { triggerType: 'asc' },
  })
}

export async function getCheckInOptions() {
  return prisma.checkInOption.findMany({
    where: { isActive: true },
    orderBy: { position: 'asc' },
  })
}

export async function getDashboardMessage(stateKey: string) {
  return prisma.dashboardMessage.findUnique({ where: { stateKey } })
}

export async function getRecommendationRules() {
  return prisma.recommendationRule.findMany({
    where: { isActive: true },
    orderBy: { priority: 'desc' },
  })
}

export async function getSiteSetting(key: string) {
  const setting = await prisma.siteSetting.findUnique({ where: { key } })
  return setting?.value ?? null
}

export async function upsertSiteSetting(key: string, value: string, description?: string) {
  return prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value, description },
  })
}

export async function getSiteSettings(keys: string[]) {
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: keys } },
  })
  const map = new Map(settings.map(s => [s.key, s.value]))
  return Object.fromEntries(keys.map(k => [k, map.get(k) ?? '']))
}
