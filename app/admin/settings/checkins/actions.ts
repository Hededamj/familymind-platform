'use server'

import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import {
  createCheckInOptionSchema,
  updateCheckInOptionSchema,
} from '@/lib/validators/settings'

const uuid = z.string().uuid()
const PATH = '/admin/settings/checkins'

export async function createCheckInOptionAction(data: {
  label: string
  value: string
  emoji?: string
}) {
  await requireAdmin()
  const valid = createCheckInOptionSchema.parse(data)

  const maxPos = await prisma.checkInOption.aggregate({
    _max: { position: true },
  })
  const position = (maxPos._max.position ?? -1) + 1

  await prisma.checkInOption.create({
    data: {
      label: valid.label,
      value: valid.value,
      emoji: valid.emoji || null,
      position,
    },
  })

  revalidatePath(PATH)
}

export async function updateCheckInOptionAction(
  id: string,
  data: {
    label: string
    value: string
    emoji?: string
    isActive: boolean
  }
) {
  await requireAdmin()
  const validId = uuid.parse(id)
  const valid = updateCheckInOptionSchema.parse(data)

  await prisma.checkInOption.update({
    where: { id: validId },
    data: {
      label: valid.label,
      value: valid.value,
      emoji: valid.emoji || null,
      isActive: valid.isActive,
    },
  })

  revalidatePath(PATH)
}

export async function deleteCheckInOptionAction(id: string) {
  await requireAdmin()
  const validId = uuid.parse(id)
  await prisma.checkInOption.delete({ where: { id: validId } })
  revalidatePath(PATH)
}

export async function moveCheckInOptionAction(
  id: string,
  direction: 'up' | 'down'
) {
  await requireAdmin()
  const validId = uuid.parse(id)

  const options = await prisma.checkInOption.findMany({
    orderBy: { position: 'asc' },
  })

  const idx = options.findIndex((o) => o.id === validId)
  if (idx === -1) return

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= options.length) return

  const current = options[idx]
  const swap = options[swapIdx]

  await prisma.$transaction([
    prisma.checkInOption.update({
      where: { id: current.id },
      data: { position: swap.position },
    }),
    prisma.checkInOption.update({
      where: { id: swap.id },
      data: { position: current.position },
    }),
  ])

  revalidatePath(PATH)
}
