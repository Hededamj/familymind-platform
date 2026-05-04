import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { z } from 'zod'
import { userListFiltersSchema } from '@/lib/validators/admin-user'
import { createAdminClient } from '@/lib/supabase/admin'

type UserListFilters = z.infer<typeof userListFiltersSchema>

const INACTIVE_THRESHOLD_DAYS = 14

function activeEntitlementWhere() {
  return {
    status: 'ACTIVE' as const,
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  }
}

// ---------------------------------------------------------------------------
// 1. listUsers — paginated user list with computed status
// ---------------------------------------------------------------------------

export async function listUsers(rawFilters: UserListFilters) {
  const validated = userListFiltersSchema.parse(rawFilters)
  const { search, role, status, tagId, journeyId, page, pageSize } = validated

  const where: Prisma.UserWhereInput = {}

  // Role filter
  if (role) {
    where.role = role
  }

  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  // Tag filter
  if (tagId) {
    where.tags = { some: { tagId } }
  }

  // Journey filter — only match users with an ACTIVE journey enrollment
  if (journeyId) {
    where.userJourneys = { some: { journeyId, status: 'ACTIVE' } }
  }

  // Status filter
  const now = new Date()
  const inactiveThreshold = new Date(
    now.getTime() - INACTIVE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000
  )

  if (status === 'TRIAL') {
    where.entitlements = { none: {} }
  } else if (status === 'ACTIVE') {
    where.entitlements = {
      some: {
        status: 'ACTIVE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    }
    where.lastActiveAt = { gte: inactiveThreshold }
  } else if (status === 'INACTIVE') {
    where.entitlements = {
      some: {
        status: 'ACTIVE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    }
    where.OR = [
      { lastActiveAt: null },
      { lastActiveAt: { lt: inactiveThreshold } },
    ]
  } else if (status === 'CHURNED') {
    // Has at least one entitlement ever, but none currently active
    where.AND = [
      { entitlements: { some: {} } },
      {
        entitlements: {
          none: {
            status: 'ACTIVE',
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        },
      },
    ]
  }

  // When both search and INACTIVE status are used, the OR clauses conflict.
  // Handle the combined case by wrapping them in AND.
  if (search && status === 'INACTIVE') {
    const searchCondition = {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    }
    const inactiveCondition = {
      OR: [
        { lastActiveAt: null },
        { lastActiveAt: { lt: inactiveThreshold } },
      ],
    }
    // Remove the top-level OR and combine via AND
    delete where.OR
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      searchCondition,
      inactiveCondition,
    ]
  }

  const skip = (page - 1) * pageSize

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      include: {
        tags: { include: { tag: true } },
        entitlements: {
          where: activeEntitlementWhere(),
          select: { id: true, status: true, source: true },
          take: 1,
        },
        _count: { select: { entitlements: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ])

  return {
    users,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

// ---------------------------------------------------------------------------
// 2. getUserStats — stats for overview cards
// ---------------------------------------------------------------------------

export async function getUserStats() {
  const now = new Date()
  const inactiveThreshold = new Date(
    now.getTime() - INACTIVE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000
  )
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [total, active, trial, newUsers, churned] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({
      where: {
        entitlements: {
          some: {
            status: 'ACTIVE',
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        },
        lastActiveAt: { gte: inactiveThreshold },
      },
    }),
    prisma.user.count({
      where: { entitlements: { none: {} } },
    }),
    prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.user.count({
      where: {
        AND: [
          { entitlements: { some: {} } },
          {
            entitlements: {
              none: {
                status: 'ACTIVE',
                OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
              },
            },
          },
        ],
      },
    }),
  ])

  return { total, active, trial, newUsers, churned }
}

// ---------------------------------------------------------------------------
// 3. getUserDetail — full user with all relations
// ---------------------------------------------------------------------------

export async function getUserDetail(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      tags: { include: { tag: true } },
      entitlements: {
        include: { course: true, bundle: true },
        orderBy: { createdAt: 'desc' },
      },
      userJourneys: {
        include: {
          journey: {
            include: {
              phases: {
                include: {
                  _count: { select: { days: true } },
                },
              },
            },
          },
          currentDay: {
            include: {
              phase: { select: { position: true } },
            },
          },
          checkIns: {
            orderBy: { completedAt: 'desc' },
            take: 10,
          },
          _count: { select: { checkIns: true } },
        },
        orderBy: { startedAt: 'desc' },
      },
      cohortMemberships: {
        include: {
          cohort: {
            include: {
              journey: { select: { title: true } },
            },
          },
        },
      },
      userProfile: true,
      _count: {
        select: {
          discussionPosts: true,
          discussionReplies: true,
          notifications: true,
        },
      },
    },
  })
}

// ---------------------------------------------------------------------------
// 4. updateUserRole — change user role
// ---------------------------------------------------------------------------

export async function updateUserRole(
  userId: string,
  role: 'USER' | 'ADMIN'
) {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
  })
}

// ---------------------------------------------------------------------------
// 4b. updateUserProfile — change name and/or email (kept in sync with Supabase auth)
// ---------------------------------------------------------------------------

export async function updateUserProfile(
  userId: string,
  data: { name: string | null; email: string }
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })
  if (!user) throw new Error('Bruger ikke fundet')

  const emailChanged = data.email !== user.email

  if (emailChanged) {
    const conflict = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    })
    if (conflict && conflict.id !== userId) {
      throw new Error('Email er allerede i brug af en anden bruger')
    }

    // Supabase auth must be updated first — if it fails we abort with no DB change.
    // email_confirm: true skips the user-confirmation flow since admin is the actor.
    const supabase = createAdminClient()
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      email: data.email,
      email_confirm: true,
    })
    if (error) throw new Error(`Supabase: ${error.message}`)
  }

  return prisma.user.update({
    where: { id: userId },
    data: { name: data.name, email: data.email },
  })
}

// ---------------------------------------------------------------------------
// 5. getUserActivity — activity timeline
// ---------------------------------------------------------------------------

type Activity = {
  date: Date
  type: string
  description: string
}

export async function getUserActivity(
  userId: string,
  limit: number = 20
): Promise<Activity[]> {
  const [journeyStarts, checkIns, posts, replies] = await Promise.all([
    prisma.userJourney.findMany({
      where: { userId },
      select: {
        startedAt: true,
        journey: { select: { title: true } },
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
    }),
    prisma.userDayCheckIn.findMany({
      where: { userJourney: { userId } },
      select: {
        completedAt: true,
        checkInOption: { select: { label: true } },
        userJourney: {
          select: { journey: { select: { title: true } } },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: limit,
    }),
    prisma.discussionPost.findMany({
      where: { authorId: userId },
      select: {
        createdAt: true,
        cohort: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.discussionReply.findMany({
      where: { authorId: userId },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
  ])

  const activities: Activity[] = []

  for (const j of journeyStarts) {
    activities.push({
      date: j.startedAt,
      type: 'journey_start',
      description: `Startede forløbet "${j.journey.title}"`,
    })
  }

  for (const c of checkIns) {
    const mood = c.checkInOption.label
    const journeyTitle = c.userJourney.journey.title
    activities.push({
      date: c.completedAt,
      type: 'check_in',
      description: `Check-in: ${mood} (${journeyTitle})`,
    })
  }

  for (const p of posts) {
    const cohortName = p.cohort?.name ?? 'Åbent rum'
    activities.push({
      date: p.createdAt,
      type: 'post',
      description: `Indlæg i ${cohortName}`,
    })
  }

  for (const r of replies) {
    activities.push({
      date: r.createdAt,
      type: 'reply',
      description: 'Svarede på et indlæg',
    })
  }

  activities.sort((a, b) => b.date.getTime() - a.date.getTime())

  return activities.slice(0, limit)
}

// ---------------------------------------------------------------------------
// 6. updateLastActive — simple timestamp update
// ---------------------------------------------------------------------------

export async function updateLastActive(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { lastActiveAt: new Date() },
  })
}

// ---------------------------------------------------------------------------
// 7. getUserNotifications — notifications + email logs for a user
// ---------------------------------------------------------------------------

export async function getUserNotifications(userId: string) {
  const [notifications, notificationLogs] = await prisma.$transaction([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.userNotificationLog.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: 50,
    }),
  ])

  return { notifications, notificationLogs }
}
