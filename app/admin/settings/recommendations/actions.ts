'use server'

import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type { InputJsonValue } from '@prisma/client/runtime/library'
import {
  createRecommendationRuleSchema,
  updateRecommendationRuleSchema,
} from '@/lib/validators/settings'

const uuid = z.string().uuid()
const PATH = '/admin/settings/recommendations'

export async function createRuleAction(data: {
  name: string
  conditions: Record<string, unknown>
  targetType: string
  targetId: string
  priority: number
}) {
  await requireAdmin()
  const valid = createRecommendationRuleSchema.parse(data)

  await prisma.recommendationRule.create({
    data: {
      name: valid.name,
      conditions: (valid.conditions ?? {}) as InputJsonValue,
      targetType: valid.targetType,
      targetId: valid.targetId,
      priority: valid.priority,
    },
  })

  revalidatePath(PATH)
}

export async function updateRuleAction(
  id: string,
  data: {
    name: string
    conditions: Record<string, unknown>
    targetType: string
    targetId: string
    priority: number
    isActive: boolean
  }
) {
  await requireAdmin()
  const validId = uuid.parse(id)
  const valid = updateRecommendationRuleSchema.parse(data)

  await prisma.recommendationRule.update({
    where: { id: validId },
    data: {
      name: valid.name,
      conditions: (valid.conditions ?? {}) as InputJsonValue,
      targetType: valid.targetType,
      targetId: valid.targetId,
      priority: valid.priority,
      isActive: valid.isActive,
    },
  })

  revalidatePath(PATH)
}

export async function deleteRuleAction(id: string) {
  await requireAdmin()
  const validId = uuid.parse(id)
  await prisma.recommendationRule.delete({ where: { id: validId } })
  revalidatePath(PATH)
}
