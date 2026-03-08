import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyCronSecret } from '@/lib/cron-auth'
import { sendTemplatedEmail, createInAppNotification } from '@/lib/services/engagement.service'
import {
  getActiveCohortsForDigest,
  getCohortWeeklyStats,
  getCohortMemberIds,
  listRooms,
  getRoomWeeklyStats,
} from '@/lib/services/community.service'
import { getSiteSetting } from '@/lib/services/settings.service'

const BATCH_SIZE = 20

type DigestFrequency = 'daily' | 'weekly' | 'monthly' | 'off'

/** Map frequency to milliseconds. */
function frequencyToMs(freq: DigestFrequency): number {
  switch (freq) {
    case 'daily':
      return 1 * 24 * 60 * 60 * 1000
    case 'weekly':
      return 7 * 24 * 60 * 60 * 1000
    case 'monthly':
      return 30 * 24 * 60 * 60 * 1000
    default:
      return 7 * 24 * 60 * 60 * 1000
  }
}

type RoomStats = {
  roomName: string
  roomSlug: string
  newPosts: number
  newReplies: number
  activeMembers: number
}

/**
 * Community digest cron job.
 *
 * Sends a summary of cohort + room activity to members:
 * - Number of new posts and replies per cohort
 * - Number of active members per cohort
 * - Open room activity stats (if enabled via SiteSetting)
 * - Configurable frequency: daily / weekly / monthly / off
 *
 * Only sends if there was activity in the configured period.
 * Runs on a schedule configured in vercel.json.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check digest frequency setting
  const frequencyRaw = await getSiteSetting('community_digest_frequency')
  const frequency: DigestFrequency =
    frequencyRaw && ['daily', 'weekly', 'monthly', 'off'].includes(frequencyRaw)
      ? (frequencyRaw as DigestFrequency)
      : 'weekly'

  if (frequency === 'off') {
    return NextResponse.json({
      message: 'Community digest is disabled',
      sent: 0,
    })
  }

  const intervalMs = frequencyToMs(frequency)
  const sinceDate = new Date(Date.now() - intervalMs)

  // Check if room stats should be included
  const includeRoomsRaw = await getSiteSetting('community_digest_includes_rooms')
  const includeRooms = includeRoomsRaw === 'true'

  let totalSent = 0
  let totalSkipped = 0
  let totalFailed = 0

  // --- Room stats (sent to ALL registered users) ---
  let roomStatsList: RoomStats[] = []

  if (includeRooms) {
    const rooms = await listRooms(false) // only active (non-archived) rooms
    const roomStatsResults = await Promise.all(
      rooms.map(async (room) => {
        const stats = await getRoomWeeklyStats(room.id)
        return {
          roomName: room.name,
          roomSlug: room.slug,
          newPosts: stats.newPosts,
          newReplies: stats.newReplies,
          activeMembers: stats.activeMembers,
        }
      })
    )
    // Only include rooms that had activity
    roomStatsList = roomStatsResults.filter(
      (rs) => rs.newPosts > 0 || rs.newReplies > 0
    )
  }

  const hasRoomActivity = roomStatsList.length > 0

  // If rooms are included and have activity, send digest to recently active users
  if (hasRoomActivity) {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const allUsers = await prisma.user.findMany({
      where: { lastActiveAt: { gte: ninetyDaysAgo } },
      select: { id: true },
    })

    const roomSummaryLines = roomStatsList.map(
      (rs) =>
        `${rs.roomName}: ${rs.newPosts} nye indl\u00e6g, ${rs.newReplies} svar, ${rs.activeMembers} aktive`
    )
    const roomSummary = roomSummaryLines.join('\n')

    for (let i = 0; i < allUsers.length; i += BATCH_SIZE) {
      const batch = allUsers.slice(i, i + BATCH_SIZE)
      const batchUserIds = batch.map((u) => u.id)

      // Batch dedup: check which users already received a room digest in this period
      const alreadySentRecords = await prisma.userNotificationLog.findMany({
        where: {
          userId: { in: batchUserIds },
          type: 'community_digest',
          key: 'rooms',
          sentAt: { gte: sinceDate },
        },
        select: { userId: true },
      })
      const sentUserIds = new Set(alreadySentRecords.map((n) => n.userId))

      const results = await Promise.allSettled(
        batch.map(async (user) => {
          if (sentUserIds.has(user.id)) return 'skipped' as const

          await sendTemplatedEmail(user.id, 'community_digest', {
            journeyTitle: 'Community',
            cohortName: 'Alle rum',
            newPosts: String(roomStatsList.reduce((sum, rs) => sum + rs.newPosts, 0)),
            newReplies: String(roomStatsList.reduce((sum, rs) => sum + rs.newReplies, 0)),
            activeMembers: String(roomStatsList.reduce((sum, rs) => sum + rs.activeMembers, 0)),
            roomSummary,
            communityUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/community`,
          })

          await createInAppNotification(
            user.id,
            'SYSTEM',
            'Nyt fra f\u00e6llesskabet',
            `${roomStatsList.reduce((sum, rs) => sum + rs.newPosts, 0)} nye indl\u00e6g p\u00e5 tv\u00e6rs af ${roomStatsList.length} rum`,
            '/community'
          )

          await prisma.userNotificationLog.create({
            data: {
              userId: user.id,
              type: 'community_digest',
              key: 'rooms',
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
          console.error('[cron/community-digest] Room digest error:', result.reason)
          totalFailed++
        }
      }
    }
  }

  // --- Cohort digests (existing functionality) ---
  const cohorts = await getActiveCohortsForDigest()

  for (const cohort of cohorts) {
    const stats = await getCohortWeeklyStats(cohort.id)

    // Skip cohorts with no activity
    if (stats.newPosts === 0 && stats.newReplies === 0) {
      totalSkipped++
      continue
    }

    const memberIds = await getCohortMemberIds(cohort.id)

    for (let i = 0; i < memberIds.length; i += BATCH_SIZE) {
      const batch = memberIds.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(
        batch.map(async (userId) => {
          // Check if already sent in this period
          const alreadySent = await prisma.userNotificationLog.findFirst({
            where: {
              userId,
              type: 'community_digest',
              key: cohort.id,
              sentAt: { gte: sinceDate },
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
            `${stats.newPosts} nye indl\u00e6g og ${stats.newReplies} svar i ${cohort.journey.title}`,
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
    `[cron/community-digest] ${totalSent} sent, ${totalSkipped} skipped, ${totalFailed} failed across ${cohorts.length} cohorts${hasRoomActivity ? ` + ${roomStatsList.length} rooms` : ''}`
  )

  return NextResponse.json({
    message: 'Community digest cron completed',
    frequency,
    includeRooms,
    cohortsChecked: cohorts.length,
    roomsWithActivity: roomStatsList.length,
    sent: totalSent,
    skipped: totalSkipped,
    failed: totalFailed,
  })
}
