'use server'

import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const SETTINGS_PATH = '/admin/settings'

// ─── Email Templates ────────────────────────────────

export async function updateEmailTemplateAction(
  id: string,
  data: {
    subject?: string
    bodyHtml?: string
    description?: string
    isActive?: boolean
  }
) {
  await requireAdmin()

  await prisma.emailTemplate.update({
    where: { id },
    data: {
      ...(data.subject !== undefined && { subject: data.subject }),
      ...(data.bodyHtml !== undefined && { bodyHtml: data.bodyHtml }),
      ...(data.description !== undefined && {
        description: data.description || null,
      }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  })

  revalidatePath(`${SETTINGS_PATH}/emails`)
}

// ─── Notification Schedule ──────────────────────────

export async function updateNotificationScheduleAction(
  id: string,
  data: {
    dayOfWeek?: number
    timeOfDay?: string
    isActive?: boolean
  }
) {
  await requireAdmin()

  await prisma.notificationSchedule.update({
    where: { id },
    data: {
      ...(data.dayOfWeek !== undefined && { dayOfWeek: data.dayOfWeek }),
      ...(data.timeOfDay !== undefined && { timeOfDay: data.timeOfDay }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  })

  revalidatePath(`${SETTINGS_PATH}/notifications`)
}

// ─── Re-engagement Tiers ────────────────────────────

export async function updateReEngagementTierAction(
  id: string,
  data: {
    daysInactiveMin?: number
    daysInactiveMax?: number
    emailTemplateId?: string
    isActive?: boolean
  }
) {
  await requireAdmin()

  await prisma.reEngagementTier.update({
    where: { id },
    data: {
      ...(data.daysInactiveMin !== undefined && {
        daysInactiveMin: data.daysInactiveMin,
      }),
      ...(data.daysInactiveMax !== undefined && {
        daysInactiveMax: data.daysInactiveMax,
      }),
      ...(data.emailTemplateId !== undefined && {
        emailTemplateId: data.emailTemplateId,
      }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  })

  revalidatePath(`${SETTINGS_PATH}/reengagement`)
}

// ─── Milestone Definitions ──────────────────────────

export async function updateMilestoneDefinitionAction(
  id: string,
  data: {
    name?: string
    triggerType?: 'DAYS_ACTIVE' | 'PHASE_COMPLETE' | 'JOURNEY_COMPLETE' | 'CONTENT_COUNT' | 'CHECKIN_STREAK'
    triggerValue?: number
    celebrationTitle?: string
    celebrationMessage?: string
    isActive?: boolean
  }
) {
  await requireAdmin()

  await prisma.milestoneDefinition.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.triggerType !== undefined && { triggerType: data.triggerType }),
      ...(data.triggerValue !== undefined && {
        triggerValue: data.triggerValue,
      }),
      ...(data.celebrationTitle !== undefined && {
        celebrationTitle: data.celebrationTitle,
      }),
      ...(data.celebrationMessage !== undefined && {
        celebrationMessage: data.celebrationMessage,
      }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  })

  revalidatePath(`${SETTINGS_PATH}/milestones`)
}
