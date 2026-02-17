'use server'

import { requireAdmin } from '@/lib/auth'
import * as communityService from '@/lib/services/community.service'
import { revalidatePath } from 'next/cache'

export async function listCohortsAction(journeyId?: string) {
  await requireAdmin()
  return communityService.listCohorts(journeyId)
}

export async function updateCohortAction(
  id: string,
  data: { name?: string; maxMembers?: number; isOpen?: boolean }
) {
  await requireAdmin()
  const result = await communityService.updateCohort(id, data)
  revalidatePath('/admin/cohorts')
  revalidatePath(`/admin/cohorts/${id}`)
  return result
}
