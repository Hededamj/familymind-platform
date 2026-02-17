import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
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
      '[cron/reengagement] CRON_SECRET not configured, skipping auth'
    )
    return true
  }
  return secret === `Bearer ${process.env.CRON_SECRET}`
}

/**
 * Compute days since a user's last meaningful activity.
 * Activity is defined as: last content progress, last check-in, or account
 * updatedAt (which acts as a rough proxy for last login).
 */
function daysSinceLastActivity(
  lastContentProgressAt: Date | null,
  lastCheckInAt: Date | null,
  userUpdatedAt: Date
): number {
  const candidates: Date[] = [userUpdatedAt]
  if (lastContentProgressAt) candidates.push(lastContentProgressAt)
  if (lastCheckInAt) candidates.push(lastCheckInAt)

  const mostRecent = candidates.reduce((a, b) => (a > b ? a : b))
  const diffMs = Date.now() - mostRecent.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Check if a user has already received a notification for a specific
 * re-engagement tier.
 */
async function hasReceivedTier(
  userId: string,
  tierNumber: number
): Promise<boolean> {
  const existing = await prisma.userNotificationLog.findFirst({
    where: {
      userId,
      type: 'reengagement',
      key: String(tierNumber),
    },
  })
  return !!existing
}

async function logReengagementSent(userId: string, tierNumber: number) {
  await prisma.userNotificationLog.create({
    data: {
      userId,
      type: 'reengagement',
      key: String(tierNumber),
    },
  })
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Load active tiers, ordered by tier number
  const tiers = await prisma.reEngagementTier.findMany({
    where: { isActive: true },
    include: { emailTemplate: true },
    orderBy: { tierNumber: 'asc' },
  })

  if (tiers.length === 0) {
    return NextResponse.json({
      message: 'No active re-engagement tiers configured',
    })
  }

  // Find the maximum inactivity range we care about
  const maxDays = Math.max(...tiers.map((t) => t.daysInactiveMax))
  const cutoffDate = new Date(
    Date.now() - maxDays * 24 * 60 * 60 * 1000
  )

  // Batch query: get all users who might be inactive.
  // We fetch users whose updatedAt is older than (now - maxDays) OR who have
  // no recent content progress / check-ins. We do a broader query and filter
  // in-memory to keep the SQL simple and avoid complex joins.
  const allUsers = await prisma.user.findMany({
    where: {
      role: 'USER',
      // Only consider users who have at least started using the platform
      // (have at least one journey)
      userJourneys: { some: {} },
    },
    select: {
      id: true,
      updatedAt: true,
      contentProgress: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true },
      },
      userJourneys: {
        where: { status: 'ACTIVE' },
        select: {
          checkIns: {
            orderBy: { completedAt: 'desc' },
            take: 1,
            select: { completedAt: true },
          },
        },
      },
    },
  })

  let totalProcessed = 0
  let totalSent = 0
  let totalSkipped = 0
  let totalFailed = 0
  const tierStats: Record<number, { sent: number; skipped: number }> = {}

  for (const tier of tiers) {
    tierStats[tier.tierNumber] = { sent: 0, skipped: 0 }
  }

  // Build a list of (userId, matchedTier) pairs
  const userTierPairs: Array<{
    userId: string
    tier: (typeof tiers)[number]
  }> = []

  for (const user of allUsers) {
    const lastContentAt =
      user.contentProgress.length > 0
        ? user.contentProgress[0].createdAt
        : null

    // Find the most recent check-in across all active journeys
    let lastCheckInAt: Date | null = null
    for (const uj of user.userJourneys) {
      if (uj.checkIns.length > 0) {
        const checkInDate = uj.checkIns[0].completedAt
        if (!lastCheckInAt || checkInDate > lastCheckInAt) {
          lastCheckInAt = checkInDate
        }
      }
    }

    const daysInactive = daysSinceLastActivity(
      lastContentAt,
      lastCheckInAt,
      user.updatedAt
    )

    // Find the matching tier (highest tier number that matches)
    // We iterate in reverse so higher tiers take priority
    let matchedTier: (typeof tiers)[number] | null = null
    for (let i = tiers.length - 1; i >= 0; i--) {
      const t = tiers[i]
      if (daysInactive >= t.daysInactiveMin && daysInactive <= t.daysInactiveMax) {
        matchedTier = t
        break
      }
    }

    if (matchedTier) {
      userTierPairs.push({ userId: user.id, tier: matchedTier })
    }

    totalProcessed++
  }

  // Process sends in parallel with Promise.allSettled
  const sendResults = await Promise.allSettled(
    userTierPairs.map(async ({ userId, tier }) => {
      // Check if already received this tier
      const alreadyReceived = await hasReceivedTier(userId, tier.tierNumber)
      if (alreadyReceived) {
        tierStats[tier.tierNumber].skipped++
        return 'skipped' as const
      }

      // Send the email using the tier's linked template
      const emailResult = await sendTemplatedEmail(
        userId,
        tier.emailTemplate.templateKey
      )

      // Create in-app notification
      await createInAppNotification(
        userId,
        'REENGAGEMENT',
        'Vi savner dig!',
        'Det er et stykke tid siden du sidst var forbi. Kom tilbage og fortsæt dit forløb.',
        '/dashboard'
      )

      // Log so we don't re-send this tier
      await logReengagementSent(userId, tier.tierNumber)

      tierStats[tier.tierNumber].sent++

      return emailResult ? ('sent' as const) : ('failed' as const)
    })
  )

  for (const result of sendResults) {
    if (result.status === 'fulfilled') {
      switch (result.value) {
        case 'sent':
          totalSent++
          break
        case 'skipped':
          totalSkipped++
          break
        case 'failed':
          totalFailed++
          break
      }
    } else {
      console.error(
        '[cron/reengagement] Error processing user:',
        result.reason
      )
      totalFailed++
    }
  }

  console.log(
    `[cron/reengagement] Processed ${totalProcessed} users: ${totalSent} sent, ${totalSkipped} skipped, ${totalFailed} failed`
  )

  return NextResponse.json({
    message: 'Re-engagement cron completed',
    totalUsersChecked: totalProcessed,
    totalSent,
    totalSkipped,
    totalFailed,
    tierStats,
  })
}
