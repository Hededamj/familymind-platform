import { getAppUrl } from '@/lib/app-url'

export function RoomJsonLd({
  room,
  postCount,
}: {
  room: { name: string; slug: string; description?: string | null }
  postCount: number
}) {
  const baseUrl = getAppUrl()
  const data = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: room.name,
    description: room.description || `Community room: ${room.name}`,
    url: `${baseUrl}/community/${room.slug}`,
    numberOfItems: postCount,
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function PostJsonLd({
  post,
  roomSlug,
}: {
  post: {
    body: string
    slug: string | null
    createdAt: Date
    author: { name: string | null }
    _count: { replies: number }
  }
  roomSlug: string
}) {
  const baseUrl = getAppUrl()
  const data = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    text: post.body.slice(0, 500),
    datePublished: post.createdAt.toISOString(),
    author: {
      '@type': 'Person',
      name: post.author.name?.split(' ')[0] || 'Anonym',
    },
    url: `${baseUrl}/community/${roomSlug}/${post.slug}`,
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/CommentAction',
      userInteractionCount: post._count.replies,
    },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
