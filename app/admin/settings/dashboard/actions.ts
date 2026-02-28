'use server'

import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { updateDashboardMessageSchema } from '@/lib/validators/settings'

const uuid = z.string().uuid()
const PATH = '/admin/settings/dashboard'

export async function updateDashboardMessageAction(
  id: string,
  data: {
    heading: string
    body: string
    ctaLabel?: string
    ctaUrl?: string
  }
) {
  await requireAdmin()
  const validId = uuid.parse(id)
  const valid = updateDashboardMessageSchema.parse(data)

  await prisma.dashboardMessage.update({
    where: { id: validId },
    data: {
      heading: valid.heading,
      body: valid.body,
      ctaLabel: valid.ctaLabel || null,
      ctaUrl: valid.ctaUrl || null,
    },
  })

  revalidatePath(PATH)
}
