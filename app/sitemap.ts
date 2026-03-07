import { prisma } from '@/lib/prisma'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://familymind.dk'

  // Get community indexing thresholds
  const [minCharsSetting, minRepliesSetting] = await Promise.all([
    prisma.siteSetting.findUnique({
      where: { key: 'community_index_min_chars' },
    }),
    prisma.siteSetting.findUnique({
      where: { key: 'community_index_min_replies' },
    }),
  ])
  const minChars = parseInt(minCharsSetting?.value || '50')
  const minReplies = parseInt(minRepliesSetting?.value || '1')

  // Community overview
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/community`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // Active, public rooms
  const rooms = await prisma.communityRoom.findMany({
    where: { isArchived: false, isPublic: true },
    select: { slug: true, updatedAt: true },
  })
  for (const room of rooms) {
    entries.push({
      url: `${baseUrl}/community/${room.slug}`,
      lastModified: room.updatedAt,
      changeFrequency: 'daily',
      priority: 0.7,
    })
  }

  // Indexable posts
  const posts = await prisma.discussionPost.findMany({
    where: {
      roomId: { not: null },
      isHidden: false,
      isPublic: true,
      slug: { not: null },
    },
    select: {
      slug: true,
      updatedAt: true,
      body: true,
      room: { select: { slug: true } },
      _count: { select: { replies: true } },
    },
  })

  for (const post of posts) {
    if (
      post.body.length >= minChars &&
      post._count.replies >= minReplies &&
      post.room
    ) {
      entries.push({
        url: `${baseUrl}/community/${post.room.slug}/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.5,
      })
    }
  }

  return entries
}
