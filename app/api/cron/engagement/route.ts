import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyCronSecret } from '@/lib/cron-auth'
import {
  sendTemplatedEmail,
  createInAppNotification,
} from '@/lib/services/engagement.service'
import { getDanishTime } from '@/lib/utils/timezone'
import type { NotificationType } from '@prisma/client'

/**
 * Check whether we already sent this notification type to this user within
 * a given window (prevents duplicate sends in the same schedule period).
 */
async function alreadySentInWindow(
  userId: string,
  key: string,
  windowHours: number
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000)
  const existing = await prisma.userNotificationLog.findFirst({
    where: {
      userId,
      type: 'engagement',
      key,
      sentAt: { gte: windowStart },
    },
  })
  return !!existing
}

async function logNotificationSent(userId: string, key: string) {
  await prisma.userNotificationLog.create({
    data: { userId, type: 'engagement', key },
  })
}

// ---------------------------------------------------------------------------
// Notification type template keys and in-app titles (Danish)
// ---------------------------------------------------------------------------

const TEMPLATE_CONFIG: Record<
  NotificationType,
  {
    templateKey: string
    inAppTitle: string
    inAppBody: string
    actionUrl: string
    /** Window in hours to prevent re-sending */
    dedupeWindowHours: number
  }
> = {
  WEEKLY_PLAN: {
    templateKey: 'weekly_plan',
    inAppTitle: 'Din uge er klar',
    inAppBody: 'Se hvad der venter dig denne uge i dit forløb.',
    actionUrl: '/dashboard',
    dedupeWindowHours: 24,
  },
  MIDWEEK_NUDGE: {
    templateKey: 'midweek_nudge',
    inAppTitle: 'Har du set ugens indhold?',
    inAppBody: 'Du har nyt indhold klar — tag et kig.',
    actionUrl: '/dashboard',
    dedupeWindowHours: 24,
  },
  REFLECTION: {
    templateKey: 'reflection',
    inAppTitle: 'Tid til refleksion',
    inAppBody: 'Giv dig selv et øjeblik og reflekter over din uge.',
    actionUrl: '/dashboard',
    dedupeWindowHours: 24,
  },
  MONTHLY_PROGRESS: {
    templateKey: 'monthly_progress',
    inAppTitle: 'Din månedlige opsummering',
    inAppBody: 'Se hvor langt du er kommet denne måned.',
    actionUrl: '/dashboard',
    dedupeWindowHours: 24 * 7, // once per week window to be safe for monthly
  },
}

// ---------------------------------------------------------------------------
// User queries per notification type
// ---------------------------------------------------------------------------

/** Users with an active journey (for WEEKLY_PLAN) */
async function getUsersWithActiveJourney(): Promise<string[]> {
  const userJourneys = await prisma.userJourney.findMany({
    where: { status: 'ACTIVE' },
    select: { userId: true },
    distinct: ['userId'],
  })
  return userJourneys.map((uj) => uj.userId)
}

/** Users who have NOT opened any content this week (for MIDWEEK_NUDGE) */
async function getUsersWithoutContentThisWeek(): Promise<string[]> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // All users with active journeys
  const activeUserIds = await getUsersWithActiveJourney()
  if (activeUserIds.length === 0) return []

  // Users who HAVE opened content this week
  const usersWithProgress = await prisma.userContentProgress.findMany({
    where: {
      userId: { in: activeUserIds },
      createdAt: { gte: weekAgo },
    },
    select: { userId: true },
    distinct: ['userId'],
  })
  const progressUserIds = new Set(usersWithProgress.map((p) => p.userId))

  // Return users who have NOT opened content
  return activeUserIds.filter((id) => !progressUserIds.has(id))
}

/** Users who consumed content but have NOT done a check-in recently (for REFLECTION) */
async function getUsersWithContentButNoCheckin(): Promise<string[]> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Users who opened content this week
  const usersWithProgress = await prisma.userContentProgress.findMany({
    where: { createdAt: { gte: weekAgo } },
    select: { userId: true },
    distinct: ['userId'],
  })
  const progressUserIds = usersWithProgress.map((p) => p.userId)
  if (progressUserIds.length === 0) return []

  // Users who have done a check-in this week
  const usersWithCheckIn = await prisma.userDayCheckIn.findMany({
    where: {
      completedAt: { gte: weekAgo },
      userJourney: { userId: { in: progressUserIds } },
    },
    select: { userJourney: { select: { userId: true } } },
  })
  const checkInUserIds = new Set(
    usersWithCheckIn.map((c) => c.userJourney.userId)
  )

  return progressUserIds.filter((id) => !checkInUserIds.has(id))
}

/** All users with active journeys (for MONTHLY_PROGRESS) */
async function getUsersForMonthlyProgress(): Promise<string[]> {
  return getUsersWithActiveJourney()
}

const USER_QUERY_MAP: Record<NotificationType, () => Promise<string[]>> = {
  WEEKLY_PLAN: getUsersWithActiveJourney,
  MIDWEEK_NUDGE: getUsersWithoutContentThisWeek,
  REFLECTION: getUsersWithContentButNoCheckin,
  MONTHLY_PROGRESS: getUsersForMonthlyProgress,
}

// ---------------------------------------------------------------------------
// Map NotificationType to InAppNotificationType
// ---------------------------------------------------------------------------

function toInAppType(
  notificationType: NotificationType
): 'WEEKLY_PLAN' | 'MIDWEEK_NUDGE' | 'REFLECTION' | 'SYSTEM' {
  switch (notificationType) {
    case 'WEEKLY_PLAN':
      return 'WEEKLY_PLAN'
    case 'MIDWEEK_NUDGE':
      return 'MIDWEEK_NUDGE'
    case 'REFLECTION':
      return 'REFLECTION'
    case 'MONTHLY_PROGRESS':
      return 'SYSTEM'
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const danishTime = getDanishTime()
  const currentDayOfWeek = danishTime.dayOfWeek
  const currentHour = danishTime.hour
  const currentTimeStr = danishTime.timeStr

  // Find all schedules matching the current day + hour
  const matchingSchedules = await prisma.notificationSchedule.findMany({
    where: {
      isActive: true,
      dayOfWeek: currentDayOfWeek,
    },
  })

  // Filter by hour (timeOfDay is stored as "HH:MM", we compare the hour part)
  const schedulesToRun = matchingSchedules.filter((s) => {
    const scheduleHour = s.timeOfDay.split(':')[0]
    const nowHour = String(currentHour).padStart(2, '0')
    return scheduleHour === nowHour
  })

  if (schedulesToRun.length === 0) {
    return NextResponse.json({
      message: 'No schedules match this hour',
      currentDayOfWeek,
      currentTime: currentTimeStr,
      schedulesChecked: matchingSchedules.length,
    })
  }

  const results: Array<{
    type: NotificationType
    targetUsers: number
    sent: number
    skipped: number
    failed: number
  }> = []

  for (const schedule of schedulesToRun) {
    const config = TEMPLATE_CONFIG[schedule.notificationType]
    const getUserIds = USER_QUERY_MAP[schedule.notificationType]

    // Get target users for this notification type
    const userIds = await getUserIds()

    let sent = 0
    let skipped = 0
    let failed = 0

    // Process users in batches to avoid overwhelming DB connection pool and Resend rate limits
    const BATCH_SIZE = 20
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.allSettled(
        batch.map(async (userId) => {
          // Check deduplication window
          const alreadySent = await alreadySentInWindow(
            userId,
            schedule.notificationType,
            config.dedupeWindowHours
          )
          if (alreadySent) {
            return 'skipped' as const
          }

          // Send email
          const emailResult = await sendTemplatedEmail(
            userId,
            config.templateKey
          )

          // Create in-app notification
          await createInAppNotification(
            userId,
            toInAppType(schedule.notificationType),
            config.inAppTitle,
            config.inAppBody,
            config.actionUrl
          )

          // Log successful send
          await logNotificationSent(userId, schedule.notificationType)

          return emailResult ? ('sent' as const) : ('failed' as const)
        })
      )

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          switch (result.value) {
            case 'sent':
              sent++
              break
            case 'skipped':
              skipped++
              break
            case 'failed':
              failed++
              break
          }
        } else {
          console.error(
            `[cron/engagement] Error processing user for ${schedule.notificationType}:`,
            result.reason
          )
          failed++
        }
      }
    }

    results.push({
      type: schedule.notificationType,
      targetUsers: userIds.length,
      sent,
      skipped,
      failed,
    })

    console.log(
      `[cron/engagement] ${schedule.notificationType}: ${sent} sent, ${skipped} skipped, ${failed} failed out of ${userIds.length} users`
    )
  }

  return NextResponse.json({
    message: 'Engagement cron completed',
    currentDayOfWeek,
    currentTime: currentTimeStr,
    schedulesExecuted: schedulesToRun.length,
    results,
  })
}
