'use server'

import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type { JsonValue } from '@prisma/client/runtime/library'

const PATH = '/admin/settings/recommendations'

export async function createRuleAction(data: {
  name: string
  conditions: JsonValue
  targetType: string
  targetId: string
  priority: number
}) {
  await requireAdmin()

  await prisma.recommendationRule.create({
    data: {
      name: data.name,
      conditions: data.conditions ?? {},
      targetType: data.targetType,
      targetId: data.targetId,
      priority: data.priority,
    },
  })

  revalidatePath(PATH)
}

export async function updateRuleAction(
  id: string,
  data: {
    name: string
    conditions: JsonValue
    targetType: string
    targetId: string
    priority: number
    isActive: boolean
  }
) {
  await requireAdmin()

  await prisma.recommendationRule.update({
    where: { id },
    data: {
      name: data.name,
      conditions: data.conditions ?? {},
      targetType: data.targetType,
      targetId: data.targetId,
      priority: data.priority,
      isActive: data.isActive,
    },
  })

  revalidatePath(PATH)
}

export async function deleteRuleAction(id: string) {
  await requireAdmin()
  await prisma.recommendationRule.delete({ where: { id } })
  revalidatePath(PATH)
}
