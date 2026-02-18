'use server'

import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import * as communityService from '@/lib/services/community.service'

export async function getCohortFeedAction(
  cohortId: string,
  cursor?: string
) {
  const user = await requireAuth()
  return communityService.getCohortFeed(cohortId, cursor, user.id)
}

export async function getPostWithRepliesAction(postId: string) {
  const user = await requireAuth()
  return communityService.getPostWithReplies(postId, user.id)
}

export async function createPostAction(
  cohortId: string,
  body: string,
  journeySlug: string,
  dayId?: string
) {
  const user = await requireAuth()

  if (!body.trim()) {
    return { error: 'Indlægget må ikke være tomt' }
  }

  if (body.length > 5000) {
    return { error: 'Indlægget er for langt (maks 5000 tegn)' }
  }

  const post = await communityService.createPost(
    cohortId,
    user.id,
    body.trim(),
    dayId
  )

  revalidatePath(`/journeys/${journeySlug}/community`)
  return { post }
}

export async function createReplyAction(
  postId: string,
  body: string,
  journeySlug: string
) {
  const user = await requireAuth()

  if (!body.trim()) {
    return { error: 'Svaret må ikke være tomt' }
  }

  if (body.length > 2000) {
    return { error: 'Svaret er for langt (maks 2000 tegn)' }
  }

  const reply = await communityService.createReply(postId, user.id, body.trim())

  revalidatePath(`/journeys/${journeySlug}/community`)
  revalidatePath(`/journeys/${journeySlug}/community/${postId}`)
  return { reply }
}

export async function toggleReactionAction(
  emoji: string,
  journeySlug: string,
  postId?: string,
  replyId?: string
) {
  const user = await requireAuth()
  const added = await communityService.toggleReaction(
    user.id,
    emoji,
    postId,
    replyId
  )

  revalidatePath(`/journeys/${journeySlug}/community`)
  return { added }
}

export async function deletePostAction(postId: string, journeySlug: string) {
  const user = await requireAuth()

  // Verify ownership or admin
  const post = await communityService.getPostWithReplies(postId)
  if (!post) return { error: 'Indlæg ikke fundet' }
  if (post.author.id !== user.id && user.role !== 'ADMIN') {
    return { error: 'Ikke autoriseret' }
  }

  await communityService.deletePost(postId)
  revalidatePath(`/journeys/${journeySlug}/community`)
  return { success: true }
}

export async function deleteReplyAction(
  replyId: string,
  postId: string,
  journeySlug: string
) {
  const user = await requireAuth()

  // Need to check ownership — fetch the reply
  const post = await communityService.getPostWithReplies(postId)
  const reply = post?.replies.find((r) => r.id === replyId)
  if (!reply) return { error: 'Svar ikke fundet' }
  if (reply.author.id !== user.id && user.role !== 'ADMIN') {
    return { error: 'Ikke autoriseret' }
  }

  await communityService.deleteReply(replyId)
  revalidatePath(`/journeys/${journeySlug}/community/${postId}`)
  return { success: true }
}

export async function reportContentAction(
  reason: string,
  journeySlug: string,
  postId?: string,
  replyId?: string
) {
  const user = await requireAuth()

  if (!reason.trim()) {
    return { error: 'Angiv venligst en årsag' }
  }

  await communityService.createReport(user.id, reason.trim(), postId, replyId)
  return { success: true }
}
