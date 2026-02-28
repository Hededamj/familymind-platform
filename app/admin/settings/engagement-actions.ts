'use server'

import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import {
  updateEmailTemplateSchema,
  updateNotificationScheduleSchema,
  updateReEngagementTierSchema,
  updateMilestoneSchema,
} from '@/lib/validators/settings'

const uuid = z.string().uuid()
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
  const validId = uuid.parse(id)
  const valid = updateEmailTemplateSchema.parse(data)

  await prisma.emailTemplate.update({
    where: { id: validId },
    data: {
      ...(valid.subject !== undefined && { subject: valid.subject }),
      ...(valid.bodyHtml !== undefined && { bodyHtml: valid.bodyHtml }),
      ...(valid.description !== undefined && {
        description: valid.description || null,
      }),
      ...(valid.isActive !== undefined && { isActive: valid.isActive }),
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
  const validId = uuid.parse(id)
  const valid = updateNotificationScheduleSchema.parse(data)

  await prisma.notificationSchedule.update({
    where: { id: validId },
    data: {
      ...(valid.dayOfWeek !== undefined && { dayOfWeek: valid.dayOfWeek }),
      ...(valid.timeOfDay !== undefined && { timeOfDay: valid.timeOfDay }),
      ...(valid.isActive !== undefined && { isActive: valid.isActive }),
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
  const validId = uuid.parse(id)
  const valid = updateReEngagementTierSchema.parse(data)

  await prisma.reEngagementTier.update({
    where: { id: validId },
    data: {
      ...(valid.daysInactiveMin !== undefined && {
        daysInactiveMin: valid.daysInactiveMin,
      }),
      ...(valid.daysInactiveMax !== undefined && {
        daysInactiveMax: valid.daysInactiveMax,
      }),
      ...(valid.emailTemplateId !== undefined && {
        emailTemplateId: valid.emailTemplateId,
      }),
      ...(valid.isActive !== undefined && { isActive: valid.isActive }),
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
  const validId = uuid.parse(id)
  const valid = updateMilestoneSchema.parse(data)

  await prisma.milestoneDefinition.update({
    where: { id: validId },
    data: {
      ...(valid.name !== undefined && { name: valid.name }),
      ...(valid.triggerType !== undefined && { triggerType: valid.triggerType }),
      ...(valid.triggerValue !== undefined && {
        triggerValue: valid.triggerValue,
      }),
      ...(valid.celebrationTitle !== undefined && {
        celebrationTitle: valid.celebrationTitle,
      }),
      ...(valid.celebrationMessage !== undefined && {
        celebrationMessage: valid.celebrationMessage,
      }),
      ...(valid.isActive !== undefined && { isActive: valid.isActive }),
    },
  })

  revalidatePath(`${SETTINGS_PATH}/milestones`)
}
