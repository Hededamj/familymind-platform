'use server'

import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

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

  await prisma.dashboardMessage.update({
    where: { id },
    data: {
      heading: data.heading,
      body: data.body,
      ctaLabel: data.ctaLabel || null,
      ctaUrl: data.ctaUrl || null,
    },
  })

  revalidatePath(PATH)
}
