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

export async function getCohortFeedAction(cohortId: string, cursor?: string) {
  await requireAdmin()
  return communityService.getCohortFeed(cohortId, cursor)
}

export async function hidePostAction(postId: string, cohortId: string) {
  await requireAdmin()
  await communityService.hidePost(postId)
  revalidatePath(`/admin/cohorts/${cohortId}`)
  revalidatePath('/admin/moderation')
}

export async function unhidePostAction(postId: string, cohortId: string) {
  await requireAdmin()
  await communityService.unhidePost(postId)
  revalidatePath(`/admin/cohorts/${cohortId}`)
  revalidatePath('/admin/moderation')
}

export async function hideReplyAction(replyId: string, cohortId: string) {
  await requireAdmin()
  await communityService.hideReply(replyId)
  revalidatePath(`/admin/cohorts/${cohortId}`)
  revalidatePath('/admin/moderation')
}

export async function unhideReplyAction(replyId: string, cohortId: string) {
  await requireAdmin()
  await communityService.unhideReply(replyId)
  revalidatePath(`/admin/cohorts/${cohortId}`)
  revalidatePath('/admin/moderation')
}

export async function banUserAction(
  cohortId: string,
  userId: string,
  reason?: string
) {
  await requireAdmin()
  await communityService.banUserFromCohort(cohortId, userId, reason)
  revalidatePath(`/admin/cohorts/${cohortId}`)
  revalidatePath('/admin/moderation')
}

export async function unbanUserAction(cohortId: string, userId: string) {
  await requireAdmin()
  await communityService.unbanUserFromCohort(cohortId, userId)
  revalidatePath(`/admin/cohorts/${cohortId}`)
}

export async function listCohortBansAction(cohortId: string) {
  await requireAdmin()
  return communityService.listCohortBans(cohortId)
}

export async function resolveReportAction(
  reportId: string,
  action: 'dismiss' | 'hide'
) {
  await requireAdmin()
  await communityService.resolveReport(reportId, action)
  revalidatePath('/admin/moderation')
}

export async function listReportsAction(
  status?: 'PENDING' | 'REVIEWED' | 'DISMISSED'
) {
  await requireAdmin()
  return communityService.listReports(status)
}

export async function countPendingReportsAction() {
  await requireAdmin()
  return communityService.countPendingReports()
}
