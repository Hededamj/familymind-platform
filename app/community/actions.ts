'use server'

import { requireAuth, getCurrentUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import * as communityService from '@/lib/services/community.service'
import { z } from 'zod'

const slugSchema = z.string().min(1).max(200).regex(/^[a-z0-9-]+$/)

export async function createRoomPostAction(
  roomId: string,
  body: string,
  roomSlug: string,
  isPublic: boolean = true
) {
  const id = z.string().uuid().parse(roomId)
  slugSchema.parse(roomSlug)
  const user = await requireAuth()

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Indlægget må ikke være tomt' }
  if (trimmed.length > 5000) return { error: 'Indlægget er for langt (maks 5000 tegn)' }

  const post = await communityService.createRoomPost(id, user.id, trimmed, isPublic)
  revalidatePath(`/community/${roomSlug}`)
  return { post }
}

export async function createRoomReplyAction(
  postId: string,
  body: string,
  roomSlug: string,
  postSlug: string
) {
  z.string().uuid().parse(postId)
  slugSchema.parse(roomSlug)
  slugSchema.parse(postSlug)
  const user = await requireAuth()

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Svaret må ikke være tomt' }
  if (trimmed.length > 2000) return { error: 'Svaret er for langt (maks 2000 tegn)' }

  const reply = await communityService.createReply(postId, user.id, trimmed)
  revalidatePath(`/community/${roomSlug}`)
  revalidatePath(`/community/${roomSlug}/${postSlug}`)
  return { reply }
}

export async function toggleRoomReactionAction(
  emoji: string,
  roomSlug: string,
  postId?: string,
  replyId?: string
) {
  if (postId) z.string().uuid().parse(postId)
  if (replyId) z.string().uuid().parse(replyId)
  z.string().min(1).max(10).parse(emoji)
  slugSchema.parse(roomSlug)
  const user = await requireAuth()
  const added = await communityService.toggleReaction(user.id, emoji, postId, replyId)
  revalidatePath(`/community/${roomSlug}`)
  return { added }
}

export async function deleteRoomPostAction(postId: string, roomSlug: string) {
  z.string().uuid().parse(postId)
  slugSchema.parse(roomSlug)
  const user = await requireAuth()

  const post = await communityService.getPostWithReplies(postId)
  if (!post) return { error: 'Indlæg ikke fundet' }
  if (post.author.id !== user.id && user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
    return { error: 'Ikke autoriseret' }
  }

  await communityService.deletePost(postId)
  revalidatePath(`/community/${roomSlug}`)
  return { success: true }
}

export async function updateCommunityPostAction(
  postId: string,
  body: string,
  roomSlug: string,
  postSlug?: string
) {
  z.string().uuid().parse(postId)
  slugSchema.parse(roomSlug)
  if (postSlug) slugSchema.parse(postSlug)
  const user = await requireAuth()

  const post = await communityService.getPostById(postId)
  if (!post) return { error: 'Indlæg ikke fundet' }
  if (post.author.id !== user.id) {
    return { error: 'Ikke autoriseret' }
  }

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Indlægget må ikke være tomt' }
  if (trimmed.length > 5000) return { error: 'Indlægget er for langt (maks 5000 tegn)' }

  await communityService.updatePostBody(postId, trimmed)
  revalidatePath(`/community/${roomSlug}`)
  if (postSlug) revalidatePath(`/community/${roomSlug}/${postSlug}`)
  return { success: true }
}

export async function updateCommunityReplyAction(
  replyId: string,
  body: string,
  roomSlug: string,
  postSlug: string
) {
  z.string().uuid().parse(replyId)
  slugSchema.parse(roomSlug)
  slugSchema.parse(postSlug)
  const user = await requireAuth()

  const reply = await communityService.getReplyById(replyId)
  if (!reply) return { error: 'Svar ikke fundet' }
  if (reply.author.id !== user.id) {
    return { error: 'Ikke autoriseret' }
  }

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Svaret må ikke være tomt' }
  if (trimmed.length > 2000) return { error: 'Svaret er for langt (maks 2000 tegn)' }

  await communityService.updateReplyBody(replyId, trimmed)
  revalidatePath(`/community/${roomSlug}`)
  revalidatePath(`/community/${roomSlug}/${postSlug}`)
  return { success: true }
}

export async function deleteCommunityReplyAction(
  replyId: string,
  roomSlug: string,
  postSlug: string
) {
  z.string().uuid().parse(replyId)
  slugSchema.parse(roomSlug)
  slugSchema.parse(postSlug)
  const user = await requireAuth()

  const reply = await communityService.getReplyById(replyId)
  if (!reply) return { error: 'Svar ikke fundet' }
  if (reply.author.id !== user.id && user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
    return { error: 'Ikke autoriseret' }
  }

  await communityService.deleteReply(replyId)
  revalidatePath(`/community/${roomSlug}`)
  revalidatePath(`/community/${roomSlug}/${postSlug}`)
  return { success: true }
}

export async function reportRoomContentAction(
  reason: string,
  roomSlug: string,
  postId?: string,
  replyId?: string
) {
  if (postId) z.string().uuid().parse(postId)
  if (replyId) z.string().uuid().parse(replyId)
  const user = await requireAuth()
  if (!reason.trim()) return { error: 'Angiv venligst en årsag' }

  await communityService.createReport(user.id, reason.trim(), postId, replyId)
  return { success: true }
}

export async function getRoomFeedAction(roomId: string, cursor?: string) {
  z.string().uuid().parse(roomId)
  const user = await getCurrentUser()
  return communityService.getRoomFeed(roomId, cursor, user?.id)
}
