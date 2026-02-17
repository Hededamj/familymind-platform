import { prisma } from '@/lib/prisma'
import { getResend } from '@/lib/resend'
import type { InAppNotificationType } from '@prisma/client'

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

/**
 * Load an EmailTemplate from the DB by key, interpolate `{{variable}}`
 * placeholders, and send via Resend.
 *
 * Falls back to console logging when RESEND_API_KEY is not configured
 * (e.g. in local development).
 */
export async function sendTemplatedEmail(
  userId: string,
  templateKey: string,
  variables?: Record<string, string>
) {
  // Look up user for email address
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    console.error(`[engagement] sendTemplatedEmail: user ${userId} not found`)
    return null
  }

  // Look up template
  const template = await prisma.emailTemplate.findUnique({
    where: { templateKey },
  })
  if (!template || !template.isActive) {
    console.warn(
      `[engagement] sendTemplatedEmail: template "${templateKey}" not found or inactive`
    )
    return null
  }

  // Interpolate variables into subject and body
  const vars: Record<string, string> = {
    userName: user.name || user.email.split('@')[0],
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings`,
    ...variables,
  }

  const subject = interpolate(template.subject, vars)
  const bodyHtml = interpolate(template.bodyHtml, vars)

  // Dev fallback: log instead of sending when no API key
  if (!process.env.RESEND_API_KEY) {
    console.log('[engagement] Email (dev mode - no RESEND_API_KEY):')
    console.log(`  To: ${user.email}`)
    console.log(`  Subject: ${subject}`)
    console.log(`  Body: ${bodyHtml.substring(0, 200)}...`)
    return { id: 'dev-mode', to: user.email, subject }
  }

  const resend = getResend()
  const fromAddress =
    process.env.RESEND_FROM_EMAIL || 'FamilyMind <noreply@familymind.dk>'

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: user.email,
    subject,
    html: bodyHtml,
  })

  if (error) {
    console.error('[engagement] Resend error:', error)
    return null
  }

  return data
}

// ---------------------------------------------------------------------------
// In-App Notifications
// ---------------------------------------------------------------------------

/**
 * Create a new in-app notification for a user.
 */
export async function createInAppNotification(
  userId: string,
  type: InAppNotificationType,
  title: string,
  body: string,
  actionUrl?: string
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      actionUrl,
    },
  })
}

/**
 * Count unread notifications for a user.
 */
export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  })
}

/**
 * Get the latest notifications for a user, ordered by most recent first.
 */
export async function getUserNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  })
}

/**
 * Mark all unread notifications for a user as read.
 */
export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  })
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

/**
 * Check if user has earned any new milestones.
 * Reads MilestoneDefinition table, evaluates triggers against user data,
 * returns newly earned milestones (not previously celebrated).
 */
export async function checkMilestones(userId: string): Promise<
  Array<{
    id: string
    name: string
    celebrationTitle: string
    celebrationMessage: string
  }>
> {
  // Load all active milestone definitions
  const definitions = await prisma.milestoneDefinition.findMany({
    where: { isActive: true },
  })

  if (definitions.length === 0) return []

  // Load which milestones user already earned
  const alreadyAwarded = await prisma.userNotificationLog.findMany({
    where: { userId, type: 'milestone' },
    select: { key: true },
  })
  const awardedIds = new Set(alreadyAwarded.map((a) => a.key))

  // Filter to only un-awarded definitions
  const unchecked = definitions.filter((d) => !awardedIds.has(d.id))
  if (unchecked.length === 0) return []

  // Pre-compute user stats needed for evaluation
  const stats = await computeUserStats(userId)

  // Evaluate each definition
  const newlyEarned: Array<{
    id: string
    name: string
    celebrationTitle: string
    celebrationMessage: string
  }> = []

  for (const def of unchecked) {
    let currentValue = 0

    switch (def.triggerType) {
      case 'DAYS_ACTIVE':
        currentValue = stats.daysActive
        break
      case 'PHASE_COMPLETE':
        currentValue = stats.phasesCompleted
        break
      case 'JOURNEY_COMPLETE':
        currentValue = stats.journeysCompleted
        break
      case 'CONTENT_COUNT':
        currentValue = stats.contentCompleted
        break
      case 'CHECKIN_STREAK':
        currentValue = stats.checkinStreak
        break
    }

    if (currentValue >= def.triggerValue) {
      newlyEarned.push({
        id: def.id,
        name: def.name,
        celebrationTitle: def.celebrationTitle,
        celebrationMessage: def.celebrationMessage,
      })
    }
  }

  return newlyEarned
}

/**
 * Check milestones for a user and send notifications for new ones.
 * Call this after key user actions (completing a day, finishing content, etc.).
 */
export async function checkAndNotifyMilestones(
  userId: string
): Promise<void> {
  const newMilestones = await checkMilestones(userId)

  for (const milestone of newMilestones) {
    // Create in-app notification
    await createInAppNotification(
      userId,
      'MILESTONE',
      milestone.celebrationTitle,
      milestone.celebrationMessage,
      '/dashboard/progress'
    )

    // Send email notification
    await sendTemplatedEmail(userId, 'milestone_celebration', {
      milestoneName: milestone.name,
      celebrationTitle: milestone.celebrationTitle,
      celebrationMessage: milestone.celebrationMessage,
    })

    // Record the milestone as awarded so it is not re-awarded
    await prisma.userNotificationLog.create({
      data: {
        userId,
        type: 'milestone',
        key: milestone.id,
      },
    })
  }
}

/**
 * Get monthly progress summary for a user.
 * Content consumed, actions completed, check-in history, milestones earned.
 */
export async function getMonthlyProgress(userId: string): Promise<{
  contentConsumed: number
  actionsCompleted: number
  checkInsCompleted: number
  daysActive: number
  milestonesEarned: number
}> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Content consumed this month
  const contentConsumed = await prisma.userContentProgress.count({
    where: {
      userId,
      completedAt: { gte: startOfMonth },
    },
  })

  // Check-ins this month
  const checkIns = await prisma.userDayCheckIn.findMany({
    where: {
      userJourney: { userId },
      completedAt: { gte: startOfMonth },
    },
    select: { completedAt: true },
  })
  const checkInsCompleted = checkIns.length

  // Days active this month: distinct calendar dates with activity
  const contentDates = await prisma.userContentProgress.findMany({
    where: {
      userId,
      createdAt: { gte: startOfMonth },
    },
    select: { createdAt: true },
  })

  const activeDates = new Set<string>()
  for (const c of contentDates) {
    activeDates.add(c.createdAt.toISOString().slice(0, 10))
  }
  for (const ci of checkIns) {
    activeDates.add(ci.completedAt.toISOString().slice(0, 10))
  }
  const daysActive = activeDates.size

  // Milestones earned this month
  const milestonesEarned = await prisma.userNotificationLog.count({
    where: {
      userId,
      type: 'milestone',
      sentAt: { gte: startOfMonth },
    },
  })

  return {
    contentConsumed,
    actionsCompleted: checkInsCompleted, // check-ins represent completed day actions
    checkInsCompleted,
    daysActive,
    milestonesEarned,
  }
}

/**
 * Get full progress history for the progress page.
 * Returns all-time stats plus per-month breakdowns.
 */
export async function getProgressHistory(userId: string): Promise<{
  allTime: {
    contentConsumed: number
    checkInsCompleted: number
    journeysCompleted: number
    daysActive: number
    currentStreak: number
  }
  milestones: Array<{
    id: string
    name: string
    celebrationTitle: string
    celebrationMessage: string
    earnedAt: Date
  }>
  monthlyBreakdown: Array<{
    month: string // YYYY-MM
    contentConsumed: number
    checkInsCompleted: number
    daysActive: number
  }>
}> {
  const stats = await computeUserStats(userId)

  // All-time stats
  const allTime = {
    contentConsumed: stats.contentCompleted,
    checkInsCompleted: stats.checkInsTotal,
    journeysCompleted: stats.journeysCompleted,
    daysActive: stats.daysActive,
    currentStreak: stats.checkinStreak,
  }

  // Earned milestones with dates
  const awardLogs = await prisma.userNotificationLog.findMany({
    where: { userId, type: 'milestone' },
    orderBy: { sentAt: 'desc' },
  })

  const milestoneIds = awardLogs.map((a) => a.key)
  const milestoneDefinitions = await prisma.milestoneDefinition.findMany({
    where: { id: { in: milestoneIds } },
  })
  const defMap = new Map(milestoneDefinitions.map((d) => [d.id, d]))

  const milestones = awardLogs
    .map((log) => {
      const def = defMap.get(log.key)
      if (!def) return null
      return {
        id: def.id,
        name: def.name,
        celebrationTitle: def.celebrationTitle,
        celebrationMessage: def.celebrationMessage,
        earnedAt: log.sentAt,
      }
    })
    .filter(
      (
        m
      ): m is {
        id: string
        name: string
        celebrationTitle: string
        celebrationMessage: string
        earnedAt: Date
      } => m !== null
    )

  // Monthly breakdown (last 6 months)
  const monthlyBreakdown: Array<{
    month: string
    contentConsumed: number
    checkInsCompleted: number
    daysActive: number
  }> = []

  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const monthStr = monthDate.toISOString().slice(0, 7)

    const contentCount = await prisma.userContentProgress.count({
      where: {
        userId,
        completedAt: { gte: monthDate, lt: nextMonth },
      },
    })

    const checkInList = await prisma.userDayCheckIn.findMany({
      where: {
        userJourney: { userId },
        completedAt: { gte: monthDate, lt: nextMonth },
      },
      select: { completedAt: true },
    })

    const contentDatesMonth = await prisma.userContentProgress.findMany({
      where: {
        userId,
        createdAt: { gte: monthDate, lt: nextMonth },
      },
      select: { createdAt: true },
    })

    const activeDatesSet = new Set<string>()
    for (const c of contentDatesMonth) {
      activeDatesSet.add(c.createdAt.toISOString().slice(0, 10))
    }
    for (const ci of checkInList) {
      activeDatesSet.add(ci.completedAt.toISOString().slice(0, 10))
    }

    monthlyBreakdown.push({
      month: monthStr,
      contentConsumed: contentCount,
      checkInsCompleted: checkInList.length,
      daysActive: activeDatesSet.size,
    })
  }

  return { allTime, milestones, monthlyBreakdown }
}

// ---------------------------------------------------------------------------
// Internal stat computation
// ---------------------------------------------------------------------------

interface UserStats {
  daysActive: number
  phasesCompleted: number
  journeysCompleted: number
  contentCompleted: number
  checkinStreak: number
  checkInsTotal: number
}

/**
 * Compute aggregate stats for a user, used by milestone evaluation and
 * progress display.
 */
async function computeUserStats(userId: string): Promise<UserStats> {
  // DAYS_ACTIVE: distinct calendar dates across UserContentProgress + UserDayCheckIn
  const contentDates = await prisma.userContentProgress.findMany({
    where: { userId },
    select: { createdAt: true },
  })
  const checkInDates = await prisma.userDayCheckIn.findMany({
    where: { userJourney: { userId } },
    select: { completedAt: true },
  })

  const activeDates = new Set<string>()
  for (const c of contentDates) {
    activeDates.add(c.createdAt.toISOString().slice(0, 10))
  }
  for (const ci of checkInDates) {
    activeDates.add(ci.completedAt.toISOString().slice(0, 10))
  }

  // JOURNEY_COMPLETE
  const journeysCompleted = await prisma.userJourney.count({
    where: { userId, status: 'COMPLETED' },
  })

  // CONTENT_COUNT
  const contentCompleted = await prisma.userContentProgress.count({
    where: { userId, completedAt: { not: null } },
  })

  // PHASE_COMPLETE: count phases where all days have at least one check-in
  const userJourneys = await prisma.userJourney.findMany({
    where: { userId },
    select: {
      id: true,
      journey: {
        select: {
          phases: {
            select: {
              id: true,
              days: { select: { id: true } },
            },
          },
        },
      },
      checkIns: {
        select: { dayId: true },
      },
    },
  })

  let phasesCompleted = 0
  for (const uj of userJourneys) {
    const checkedInDayIds = new Set(uj.checkIns.map((ci) => ci.dayId))
    for (const phase of uj.journey.phases) {
      if (phase.days.length === 0) continue
      const allDaysCheckedIn = phase.days.every((d) =>
        checkedInDayIds.has(d.id)
      )
      if (allDaysCheckedIn) {
        phasesCompleted++
      }
    }
  }

  // CHECKIN_STREAK: consecutive calendar days with at least one check-in
  // (counting backwards from today)
  const checkinStreak = computeCheckinStreak(checkInDates.map((ci) => ci.completedAt))

  return {
    daysActive: activeDates.size,
    phasesCompleted,
    journeysCompleted,
    contentCompleted,
    checkinStreak,
    checkInsTotal: checkInDates.length,
  }
}

/**
 * Compute the current check-in streak: how many consecutive calendar days
 * (ending today or yesterday) the user has at least one check-in.
 */
function computeCheckinStreak(dates: Date[]): number {
  if (dates.length === 0) return 0

  // Build set of unique date strings
  const dateStrings = new Set<string>()
  for (const d of dates) {
    dateStrings.add(d.toISOString().slice(0, 10))
  }

  // Start from today and walk backwards
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  let current = new Date(today)

  // Allow the streak to start from today or yesterday
  const todayStr = current.toISOString().slice(0, 10)
  if (!dateStrings.has(todayStr)) {
    // Check if yesterday has a check-in (streak might still be valid)
    current.setDate(current.getDate() - 1)
    const yesterdayStr = current.toISOString().slice(0, 10)
    if (!dateStrings.has(yesterdayStr)) {
      return 0
    }
  }

  // Count consecutive days backwards
  while (dateStrings.has(current.toISOString().slice(0, 10))) {
    streak++
    current.setDate(current.getDate() - 1)
  }

  return streak
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Replace `{{key}}` patterns in a string with corresponding values.
 */
function interpolate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return variables[key] ?? match
  })
}
