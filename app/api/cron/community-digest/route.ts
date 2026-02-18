import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyCronSecret } from '@/lib/cron-auth'
import { sendTemplatedEmail, createInAppNotification } from '@/lib/services/engagement.service'
import {
  getActiveCohortsForDigest,
  getCohortWeeklyStats,
  getCohortMemberIds,
} from '@/lib/services/community.service'

const BATCH_SIZE = 20

/**
 * Weekly community digest cron job.
 *
 * Sends a summary of cohort activity to all members:
 * - Number of new posts and replies
 * - Number of active members
 * - Link to the community feed
 *
 * Only sends if there was activity in the past week.
 * Runs weekly (configured in vercel.json).
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cohorts = await getActiveCohortsForDigest()

  if (cohorts.length === 0) {
    return NextResponse.json({
      message: 'No active cohorts with members',
      sent: 0,
    })
  }

  let totalSent = 0
  let totalSkipped = 0
  let totalFailed = 0

  for (const cohort of cohorts) {
    const stats = await getCohortWeeklyStats(cohort.id)

    // Skip cohorts with no activity
    if (stats.newPosts === 0 && stats.newReplies === 0) {
      totalSkipped++
      continue
    }

    const memberIds = await getCohortMemberIds(cohort.id)

    // Deduplicate: check if we already sent a digest this week
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    for (let i = 0; i < memberIds.length; i += BATCH_SIZE) {
      const batch = memberIds.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(
        batch.map(async (userId) => {
          // Check if already sent this week
          const alreadySent = await prisma.userNotificationLog.findFirst({
            where: {
              userId,
              type: 'community_digest',
              key: cohort.id,
              sentAt: { gte: weekAgo },
            },
          })
          if (alreadySent) return 'skipped' as const

          // Send email
          await sendTemplatedEmail(userId, 'community_digest', {
            journeyTitle: cohort.journey.title,
            cohortName: cohort.name ?? 'Din gruppe',
            newPosts: String(stats.newPosts),
            newReplies: String(stats.newReplies),
            activeMembers: String(stats.activeMembers),
            communityUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/journeys/${cohort.journey.slug}/community`,
          })

          // In-app notification
          await createInAppNotification(
            userId,
            'SYSTEM',
            'Ugens opsummering fra din gruppe',
            `${stats.newPosts} nye indlæg og ${stats.newReplies} svar i ${cohort.journey.title}`,
            `/journeys/${cohort.journey.slug}/community`
          )

          // Log
          await prisma.userNotificationLog.create({
            data: {
              userId,
              type: 'community_digest',
              key: cohort.id,
            },
          })

          return 'sent' as const
        })
      )

      for (const result of results) {
        if (result.status === 'fulfilled') {
          if (result.value === 'sent') totalSent++
          else totalSkipped++
        } else {
          console.error(
            '[cron/community-digest] Error:',
            result.reason
          )
          totalFailed++
        }
      }
    }
  }

  console.log(
    `[cron/community-digest] ${totalSent} sent, ${totalSkipped} skipped, ${totalFailed} failed across ${cohorts.length} cohorts`
  )

  return NextResponse.json({
    message: 'Community digest cron completed',
    cohortsChecked: cohorts.length,
    sent: totalSent,
    skipped: totalSkipped,
    failed: totalFailed,
  })
}
