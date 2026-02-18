import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyCronSecret } from '@/lib/cron-auth'
import { autoPostPrompt } from '@/lib/services/community.service'

const BATCH_SIZE = 20

/**
 * Cron job: auto-post discussion prompts to cohorts.
 *
 * For each cohort where at least one member is on a journey day that has
 * an active discussion prompt, post the prompt as a system post if it
 * hasn't been posted yet.
 *
 * Uses a system admin user as the post author (first admin found).
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find a system/admin user to use as the prompt author
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true },
  })

  if (!adminUser) {
    return NextResponse.json({
      message: 'No admin user found — cannot post prompts',
      posted: 0,
    })
  }

  // Get all active cohorts (journeys with open or recent cohorts)
  const cohorts = await prisma.cohort.findMany({
    where: {
      journey: { isActive: true },
    },
    select: {
      id: true,
      journeyId: true,
    },
  })

  if (cohorts.length === 0) {
    return NextResponse.json({
      message: 'No active cohorts found',
      posted: 0,
    })
  }

  let posted = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < cohorts.length; i += BATCH_SIZE) {
    const batch = cohorts.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.allSettled(
      batch.map(async (cohort) => {
        // Find which journey days the cohort members are currently on
        const memberDays = await prisma.userJourney.findMany({
          where: {
            journeyId: cohort.journeyId,
            status: 'ACTIVE',
            currentDayId: { not: null },
            user: {
              cohortMemberships: {
                some: { cohortId: cohort.id },
              },
            },
          },
          select: { currentDayId: true },
          distinct: ['currentDayId'],
        })

        const dayIds = memberDays
          .map((m) => m.currentDayId)
          .filter((id): id is string => id !== null)

        if (dayIds.length === 0) return 0

        // Get active prompts for these days
        const prompts = await prisma.discussionPrompt.findMany({
          where: {
            dayId: { in: dayIds },
            isActive: true,
          },
        })

        let cohortPosted = 0
        for (const prompt of prompts) {
          try {
            await autoPostPrompt(
              prompt.id,
              cohort.id,
              prompt.dayId,
              adminUser.id
            )
            cohortPosted++
          } catch {
            // Already posted or other error — skip
          }
        }
        return cohortPosted
      })
    )

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        posted += result.value
      } else {
        console.error(
          '[cron/discussion-prompts] Error processing cohort:',
          result.reason
        )
        failed++
      }
    }
  }

  console.log(
    `[cron/discussion-prompts] Posted ${posted} prompts, ${skipped} skipped, ${failed} failed across ${cohorts.length} cohorts`
  )

  return NextResponse.json({
    message: 'Discussion prompts cron completed',
    cohortsChecked: cohorts.length,
    posted,
    skipped,
    failed,
  })
}
