import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron-auth'
import { prisma } from '@/lib/prisma'
import * as communityService from '@/lib/services/community.service'
import { generatePostSlug } from '@/lib/slugify'

const BATCH_SIZE = 20

/**
 * Cron job: auto-post queued prompts to community rooms.
 *
 * For each active (non-archived) room, finds the next unposted prompt
 * from the RoomPromptQueue and creates a public discussion post.
 *
 * Uses a configurable author via SiteSetting 'community_prompt_author_id',
 * falling back to the first admin user.
 *
 * Runs daily at 07:00 (configured in vercel.json).
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get prompt author from settings or fall back to first admin
  let authorId: string | undefined
  const settingAuthor = await prisma.siteSetting.findUnique({
    where: { key: 'community_prompt_author_id' },
  })
  authorId = settingAuthor?.value || undefined

  if (!authorId) {
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    })
    if (!admin) {
      return NextResponse.json({ message: 'No admin user found', posted: 0 })
    }
    authorId = admin.id
  }

  // Get all active, non-archived rooms
  const rooms = await prisma.communityRoom.findMany({
    where: { isArchived: false },
    select: { id: true, slug: true },
  })

  let posted = 0
  let skipped = 0

  for (let i = 0; i < rooms.length; i += BATCH_SIZE) {
    const batch = rooms.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map(async (room) => {
        const nextPrompt = await communityService.getNextUnpostedPrompt(room.id)
        if (!nextPrompt) return 'skipped'

        await prisma.$transaction(async (tx) => {
          await tx.discussionPost.create({
            data: {
              roomId: room.id,
              authorId: authorId!,
              body: nextPrompt.promptText,
              slug: generatePostSlug(nextPrompt.promptText),
              isPublic: true,
              isPrompt: true,
              cohortId: null,
            },
          })
          await tx.roomPromptQueue.update({
            where: { id: nextPrompt.id },
            data: { postedAt: new Date() },
          })
        })

        return 'posted'
      })
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value === 'posted') posted++
        else skipped++
      } else {
        console.error('[cron/room-prompts] Error:', result.reason)
      }
    }
  }

  console.log(
    `[cron/room-prompts] ${posted} posted, ${skipped} skipped across ${rooms.length} rooms`
  )

  return NextResponse.json({
    message: 'Room prompts cron completed',
    roomsChecked: rooms.length,
    posted,
    skipped,
  })
}
