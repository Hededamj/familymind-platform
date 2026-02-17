import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getMonthlyProgress,
  checkAndNotifyMilestones,
  sendTemplatedEmail,
  createInAppNotification,
} from '@/lib/services/engagement.service'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function verifyCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get('authorization')
  if (!process.env.CRON_SECRET) {
    console.warn(
      '[cron/monthly-progress] CRON_SECRET not configured, skipping auth'
    )
    return true
  }
  return secret === `Bearer ${process.env.CRON_SECRET}`
}

// ---------------------------------------------------------------------------
// Main handler — runs on the 1st of each month
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find all active users (users with at least one journey or content progress)
  const activeUsers = await prisma.user.findMany({
    where: {
      role: 'USER',
      OR: [
        { userJourneys: { some: {} } },
        { contentProgress: { some: {} } },
      ],
    },
    select: { id: true },
  })

  let totalProcessed = 0
  let totalSent = 0
  let totalFailed = 0

  const results = await Promise.allSettled(
    activeUsers.map(async (user) => {
      const progress = await getMonthlyProgress(user.id)

      // Skip users with no activity this month
      if (
        progress.contentConsumed === 0 &&
        progress.checkInsCompleted === 0 &&
        progress.daysActive === 0
      ) {
        return 'skipped' as const
      }

      // Build summary text for in-app notification
      const summaryParts: string[] = []
      if (progress.daysActive > 0) {
        summaryParts.push(`${progress.daysActive} aktive dage`)
      }
      if (progress.contentConsumed > 0) {
        summaryParts.push(`${progress.contentConsumed} indhold gennemgaet`)
      }
      if (progress.checkInsCompleted > 0) {
        summaryParts.push(`${progress.checkInsCompleted} check-ins`)
      }
      if (progress.milestonesEarned > 0) {
        summaryParts.push(
          `${progress.milestonesEarned} milepael${progress.milestonesEarned > 1 ? 'e' : ''} naaet`
        )
      }

      const summaryText =
        summaryParts.length > 0
          ? `Denne maaned: ${summaryParts.join(', ')}.`
          : 'Se din fremgang denne maaned.'

      // Create SYSTEM in-app notification with summary
      await createInAppNotification(
        user.id,
        'SYSTEM',
        'Din maanedlige opsummering',
        summaryText,
        '/dashboard/progress'
      )

      // Send email via the monthly_progress template
      await sendTemplatedEmail(user.id, 'monthly_progress', {
        daysActive: String(progress.daysActive),
        contentConsumed: String(progress.contentConsumed),
        checkInsCompleted: String(progress.checkInsCompleted),
        milestonesEarned: String(progress.milestonesEarned),
      })

      // Also check for new milestones while we are processing
      await checkAndNotifyMilestones(user.id)

      return 'sent' as const
    })
  )

  for (const result of results) {
    totalProcessed++
    if (result.status === 'fulfilled') {
      if (result.value === 'sent') totalSent++
    } else {
      console.error(
        '[cron/monthly-progress] Error processing user:',
        result.reason
      )
      totalFailed++
    }
  }

  console.log(
    `[cron/monthly-progress] Processed ${totalProcessed} users: ${totalSent} sent, ${totalFailed} failed`
  )

  return NextResponse.json({
    message: 'Monthly progress cron completed',
    totalUsersChecked: totalProcessed,
    totalSent,
    totalFailed,
  })
}
