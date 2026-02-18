import { prisma } from '@/lib/prisma'
import { getSiteSetting } from './settings.service'
import { createInAppNotification } from './engagement.service'
import type { Prisma } from '@prisma/client'

const DEFAULT_COHORT_MAX_MEMBERS = 25

// --- Cohort Assignment ---

/**
 * Find an open cohort with available space for the given journey,
 * or create a new one. Uses the SiteSetting 'default_cohort_max_members'
 * to determine max size (defaults to 25).
 */
export async function findOrCreateCohort(
  journeyId: string,
  tx?: Prisma.TransactionClient
) {
  const client = tx ?? prisma

  const maxMembersSetting = await getSiteSetting('default_cohort_max_members')
  const maxMembers = maxMembersSetting
    ? parseInt(maxMembersSetting, 10)
    : DEFAULT_COHORT_MAX_MEMBERS

  // Find an open cohort with space
  const openCohort = await client.cohort.findFirst({
    where: {
      journeyId,
      isOpen: true,
    },
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  if (openCohort && openCohort._count.members < openCohort.maxMembers) {
    return openCohort
  }

  // Close any full cohort that was returned
  if (openCohort && openCohort._count.members >= openCohort.maxMembers) {
    await client.cohort.update({
      where: { id: openCohort.id },
      data: { isOpen: false },
    })
  }

  // Create a new cohort
  const cohortCount = await client.cohort.count({ where: { journeyId } })
  const newCohort = await client.cohort.create({
    data: {
      journeyId,
      maxMembers,
      name: `Kohorte ${cohortCount + 1}`,
      isOpen: true,
    },
    include: {
      _count: { select: { members: true } },
    },
  })

  return newCohort
}

/**
 * Assign a user to a cohort for a journey. Uses $transaction to ensure
 * atomicity when not already inside one.
 */
export async function assignUserToCohort(
  userId: string,
  journeyId: string,
  tx?: Prisma.TransactionClient
) {
  async function doAssign(client: Prisma.TransactionClient) {
    // Check if user is already in a cohort for this journey
    const existing = await client.cohortMember.findFirst({
      where: {
        userId,
        cohort: { journeyId },
      },
    })
    if (existing) return existing

    const cohort = await findOrCreateCohort(journeyId, client)

    return client.cohortMember.create({
      data: {
        cohortId: cohort.id,
        userId,
      },
    })
  }

  if (tx) {
    return doAssign(tx)
  }

  return prisma.$transaction(async (txClient) => {
    return doAssign(txClient)
  })
}

/**
 * Get the user's cohort for a specific journey.
 */
export async function getUserCohort(userId: string, journeyId: string) {
  return prisma.cohortMember.findFirst({
    where: {
      userId,
      cohort: { journeyId },
    },
    include: {
      cohort: {
        include: {
          journey: { select: { id: true, title: true, slug: true } },
          _count: { select: { members: true } },
        },
      },
    },
  })
}

/**
 * Get all members of a cohort with user names.
 */
export async function getCohortMembers(cohortId: string) {
  return prisma.cohortMember.findMany({
    where: { cohortId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { joinedAt: 'asc' },
  })
}

// --- Admin Functions ---

/**
 * List cohorts with member counts. Optionally filter by journeyId.
 */
export async function listCohorts(journeyId?: string) {
  return prisma.cohort.findMany({
    where: journeyId ? { journeyId } : undefined,
    include: {
      journey: { select: { id: true, title: true, slug: true } },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Update a cohort's settings (admin).
 */
export async function updateCohort(
  id: string,
  data: { name?: string; maxMembers?: number; isOpen?: boolean }
) {
  return prisma.cohort.update({
    where: { id },
    data,
  })
}

/**
 * Get a single cohort by ID with members and journey info.
 */
export async function getCohortById(id: string) {
  return prisma.cohort.findUnique({
    where: { id },
    include: {
      journey: { select: { id: true, title: true, slug: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
      _count: { select: { members: true } },
    },
  })
}

// --- Discussion Feed ---

const FEED_PAGE_SIZE = 20

/**
 * Get paginated discussion feed for a cohort.
 */
export async function getCohortFeed(
  cohortId: string,
  cursor?: string,
  userId?: string
) {
  const posts = await prisma.discussionPost.findMany({
    where: { cohortId, isHidden: false },
    take: FEED_PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    include: {
      author: { select: { id: true, name: true } },
      day: { select: { id: true, title: true, position: true } },
      _count: { select: { replies: true, reactions: true } },
      reactions: userId
        ? { where: { userId }, select: { id: true, emoji: true } }
        : false,
    },
  })

  const hasMore = posts.length > FEED_PAGE_SIZE
  const items = hasMore ? posts.slice(0, FEED_PAGE_SIZE) : posts
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined

  return { items, nextCursor, hasMore }
}

/**
 * Get a single post with all replies and reactions.
 */
export async function getPostWithReplies(
  postId: string,
  userId?: string
) {
  return prisma.discussionPost.findUnique({
    where: { id: postId },
    include: {
      author: { select: { id: true, name: true } },
      day: { select: { id: true, title: true, position: true } },
      reactions: {
        include: { user: { select: { id: true, name: true } } },
      },
      replies: {
        where: { isHidden: false },
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, name: true } },
          reactions: userId
            ? { where: { userId }, select: { id: true, emoji: true } }
            : { include: { user: { select: { id: true, name: true } } } },
        },
      },
    },
  })
}

/**
 * Create a new discussion post. Verifies user is a cohort member.
 */
export async function createPost(
  cohortId: string,
  authorId: string,
  body: string,
  dayId?: string
) {
  // Check ban
  const banned = await prisma.cohortBan.findUnique({
    where: { cohortId_userId: { cohortId, userId: authorId } },
  })
  if (banned) {
    throw new Error('Du er udelukket fra denne gruppe')
  }

  // Verify membership
  const membership = await prisma.cohortMember.findFirst({
    where: { cohortId, userId: authorId },
  })
  if (!membership) {
    throw new Error('Du er ikke medlem af denne kohorte')
  }

  return prisma.discussionPost.create({
    data: { cohortId, authorId, body, dayId },
    include: {
      author: { select: { id: true, name: true } },
      _count: { select: { replies: true, reactions: true } },
    },
  })
}

/**
 * Create a reply to a discussion post. Notifies original author.
 */
export async function createReply(
  postId: string,
  authorId: string,
  body: string
) {
  const post = await prisma.discussionPost.findUnique({
    where: { id: postId },
    include: {
      cohort: { select: { id: true, journeyId: true } },
      author: { select: { id: true, name: true } },
    },
  })

  if (!post) throw new Error('Indlæg ikke fundet')

  // Check ban
  const banned = await prisma.cohortBan.findUnique({
    where: { cohortId_userId: { cohortId: post.cohortId, userId: authorId } },
  })
  if (banned) {
    throw new Error('Du er udelukket fra denne gruppe')
  }

  // Verify membership
  const membership = await prisma.cohortMember.findFirst({
    where: { cohortId: post.cohortId, userId: authorId },
  })
  if (!membership) {
    throw new Error('Du er ikke medlem af denne kohorte')
  }

  const reply = await prisma.discussionReply.create({
    data: { postId, authorId, body },
    include: {
      author: { select: { id: true, name: true } },
    },
  })

  // Notify original post author (don't notify yourself)
  if (post.authorId !== authorId) {
    const authorName = reply.author.name ?? 'Nogen'
    await createInAppNotification(
      post.authorId,
      'COMMUNITY_REPLY',
      `${authorName} svarede på dit indlæg`,
      body.length > 100 ? body.slice(0, 100) + '…' : body,
      `/journeys/community/${post.cohortId}/${postId}`
    )
  }

  return reply
}

/**
 * Toggle a reaction on a post or reply.
 * Returns true if added, false if removed.
 */
export async function toggleReaction(
  userId: string,
  emoji: string,
  postId?: string,
  replyId?: string
) {
  if (!postId && !replyId) throw new Error('postId eller replyId påkrævet')

  // Check for existing reaction
  const existing = postId
    ? await prisma.postReaction.findUnique({
        where: { userId_postId_emoji: { userId, postId, emoji } },
      })
    : await prisma.postReaction.findUnique({
        where: { userId_replyId_emoji: { userId, replyId: replyId!, emoji } },
      })

  if (existing) {
    await prisma.postReaction.delete({ where: { id: existing.id } })
    return false
  }

  await prisma.postReaction.create({
    data: { userId, postId, replyId, emoji },
  })
  return true
}

// --- Discussion Prompts (Admin) ---

/**
 * List discussion prompts for a journey day.
 */
export async function listPrompts(dayId: string) {
  return prisma.discussionPrompt.findMany({
    where: { dayId },
    orderBy: { promptText: 'asc' },
  })
}

/**
 * List all prompts for a journey (grouped by day).
 */
export async function listJourneyPrompts(journeyId: string) {
  return prisma.discussionPrompt.findMany({
    where: {
      day: {
        phase: { journeyId },
      },
    },
    include: {
      day: {
        select: {
          id: true,
          title: true,
          position: true,
          phase: { select: { title: true, position: true } },
        },
      },
    },
    orderBy: {
      day: { position: 'asc' },
    },
  })
}

/**
 * Create a discussion prompt for a journey day.
 */
export async function createPrompt(dayId: string, promptText: string) {
  return prisma.discussionPrompt.create({
    data: { dayId, promptText },
  })
}

/**
 * Update a discussion prompt.
 */
export async function updatePrompt(
  id: string,
  data: { promptText?: string; isActive?: boolean }
) {
  return prisma.discussionPrompt.update({
    where: { id },
    data,
  })
}

/**
 * Delete a discussion prompt.
 */
export async function deletePrompt(id: string) {
  return prisma.discussionPrompt.delete({ where: { id } })
}

/**
 * Auto-post a discussion prompt to a cohort as a system post.
 * Used by the cron job when cohort members reach a new journey day.
 */
export async function autoPostPrompt(
  promptId: string,
  cohortId: string,
  dayId: string,
  systemUserId: string
) {
  // Check if this prompt has already been posted in this cohort
  const existing = await prisma.discussionPost.findFirst({
    where: { cohortId, promptId, isPrompt: true },
  })
  if (existing) return existing

  return prisma.discussionPost.create({
    data: {
      cohortId,
      authorId: systemUserId,
      promptId,
      dayId,
      body: (
        await prisma.discussionPrompt.findUniqueOrThrow({
          where: { id: promptId },
        })
      ).promptText,
      isPrompt: true,
      isPinned: true,
    },
  })
}

// --- Moderation ---

/**
 * Hide a post (admin moderation).
 */
export async function hidePost(postId: string) {
  return prisma.discussionPost.update({
    where: { id: postId },
    data: { isHidden: true },
  })
}

/**
 * Unhide a post (admin).
 */
export async function unhidePost(postId: string) {
  return prisma.discussionPost.update({
    where: { id: postId },
    data: { isHidden: false },
  })
}

/**
 * Hide a reply (admin moderation).
 */
export async function hideReply(replyId: string) {
  return prisma.discussionReply.update({
    where: { id: replyId },
    data: { isHidden: true },
  })
}

/**
 * Unhide a reply (admin).
 */
export async function unhideReply(replyId: string) {
  return prisma.discussionReply.update({
    where: { id: replyId },
    data: { isHidden: false },
  })
}

/**
 * Delete a post and all its replies (admin or author).
 */
export async function deletePost(postId: string) {
  return prisma.discussionPost.delete({ where: { id: postId } })
}

/**
 * Delete a reply (admin or author).
 */
export async function deleteReply(replyId: string) {
  return prisma.discussionReply.delete({ where: { id: replyId } })
}

// --- Cohort Bans ---

/**
 * Ban a user from a cohort. Removes membership and hides their posts.
 */
export async function banUserFromCohort(
  cohortId: string,
  userId: string,
  reason?: string
) {
  return prisma.$transaction(async (tx) => {
    // Create ban record
    await tx.cohortBan.upsert({
      where: { cohortId_userId: { cohortId, userId } },
      create: { cohortId, userId, reason },
      update: { reason, bannedAt: new Date() },
    })

    // Remove membership
    await tx.cohortMember.deleteMany({
      where: { cohortId, userId },
    })

    // Hide all their posts in this cohort
    await tx.discussionPost.updateMany({
      where: { cohortId, authorId: userId },
      data: { isHidden: true },
    })

    // Hide all their replies in this cohort's posts
    const cohortPostIds = await tx.discussionPost.findMany({
      where: { cohortId },
      select: { id: true },
    })
    if (cohortPostIds.length > 0) {
      await tx.discussionReply.updateMany({
        where: {
          authorId: userId,
          postId: { in: cohortPostIds.map((p) => p.id) },
        },
        data: { isHidden: true },
      })
    }
  })
}

/**
 * Unban a user from a cohort.
 */
export async function unbanUserFromCohort(cohortId: string, userId: string) {
  return prisma.cohortBan.delete({
    where: { cohortId_userId: { cohortId, userId } },
  })
}

/**
 * Check if a user is banned from a cohort.
 */
export async function isUserBanned(cohortId: string, userId: string) {
  const ban = await prisma.cohortBan.findUnique({
    where: { cohortId_userId: { cohortId, userId } },
  })
  return !!ban
}

/**
 * List bans for a cohort (admin).
 */
export async function listCohortBans(cohortId: string) {
  return prisma.cohortBan.findMany({
    where: { cohortId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { bannedAt: 'desc' },
  })
}

// --- Content Reports ---

/**
 * Report a post or reply (user action).
 */
export async function createReport(
  reporterId: string,
  reason: string,
  postId?: string,
  replyId?: string
) {
  if (!postId && !replyId) throw new Error('postId eller replyId påkrævet')

  return prisma.contentReport.create({
    data: { reporterId, postId, replyId, reason },
  })
}

/**
 * List pending reports (admin).
 */
export async function listReports(status?: 'PENDING' | 'REVIEWED' | 'DISMISSED') {
  return prisma.contentReport.findMany({
    where: status ? { status } : undefined,
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      post: {
        include: {
          author: { select: { id: true, name: true } },
          cohort: {
            include: {
              journey: { select: { id: true, title: true, slug: true } },
            },
          },
        },
      },
      reply: {
        include: {
          author: { select: { id: true, name: true } },
          post: {
            select: {
              id: true,
              cohort: {
                select: {
                  id: true,
                  journey: { select: { id: true, title: true, slug: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Resolve a report (admin). Optionally hide the reported content.
 */
export async function resolveReport(
  reportId: string,
  action: 'dismiss' | 'hide'
) {
  const report = await prisma.contentReport.findUniqueOrThrow({
    where: { id: reportId },
  })

  return prisma.$transaction(async (tx) => {
    // Update report status
    await tx.contentReport.update({
      where: { id: reportId },
      data: {
        status: action === 'dismiss' ? 'DISMISSED' : 'REVIEWED',
        resolvedAt: new Date(),
      },
    })

    // Hide content if action is 'hide'
    if (action === 'hide') {
      if (report.postId) {
        await tx.discussionPost.update({
          where: { id: report.postId },
          data: { isHidden: true },
        })
      }
      if (report.replyId) {
        await tx.discussionReply.update({
          where: { id: report.replyId },
          data: { isHidden: true },
        })
      }
    }
  })
}

/**
 * Count pending reports (for admin badge).
 */
export async function countPendingReports() {
  return prisma.contentReport.count({
    where: { status: 'PENDING' },
  })
}
