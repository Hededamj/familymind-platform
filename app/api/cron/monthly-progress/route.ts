import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyCronSecret } from '@/lib/cron-auth'
import {
  getMonthlyProgress,
  checkAndNotifyMilestones,
  sendTemplatedEmail,
  createInAppNotification,
} from '@/lib/services/engagement.service'

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

  // Process users in batches to avoid overwhelming DB connection pool and Resend rate limits
  const BATCH_SIZE = 20
  for (let i = 0; i < activeUsers.length; i += BATCH_SIZE) {
    const batch = activeUsers.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.allSettled(
      batch.map(async (user) => {
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
          summaryParts.push(`${progress.contentConsumed} indhold gennemgået`)
        }
        if (progress.checkInsCompleted > 0) {
          summaryParts.push(`${progress.checkInsCompleted} check-ins`)
        }
        if (progress.milestonesEarned > 0) {
          summaryParts.push(
            `${progress.milestonesEarned} milepæl${progress.milestonesEarned > 1 ? 'e' : ''} nået`
          )
        }

        const summaryText =
          summaryParts.length > 0
            ? `Denne måned: ${summaryParts.join(', ')}.`
            : 'Se din fremgang denne måned.'

        // Create SYSTEM in-app notification with summary
        await createInAppNotification(
          user.id,
          'SYSTEM',
          'Din månedlige opsummering',
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

    for (const result of batchResults) {
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
