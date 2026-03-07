'use client'

import { useTransition, useState } from 'react'
import { getRoomFeedAction } from '@/app/community/actions'
import { RoomPostCard } from './room-post-card'
import { Button } from '@/components/ui/button'

type FeedPost = {
  id: string
  slug: string
  body: string
  isPinned: boolean
  isFeatured: boolean
  createdAt: Date
  author: { name: string | null }
  _count: { replies: number; reactions: number }
}

type RoomFeedListProps = {
  initialItems: FeedPost[]
  hasMore: boolean
  nextCursor: string | undefined
  roomId: string
  roomSlug: string
}

export function RoomFeedList({
  initialItems,
  hasMore: initialHasMore,
  nextCursor: initialCursor,
  roomId,
  roomSlug,
}: RoomFeedListProps) {
  const [items, setItems] = useState<FeedPost[]>(initialItems)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [cursor, setCursor] = useState(initialCursor)
  const [isPending, startTransition] = useTransition()

  function handleLoadMore() {
    if (!hasMore || !cursor || isPending) return

    startTransition(async () => {
      const result = await getRoomFeedAction(roomId, cursor)
      // Server returns Date as ISO string over the wire — ensure Date objects
      const newItems: FeedPost[] = result.items.map((item) => ({
        id: item.id,
        slug: item.slug ?? '',
        body: item.body,
        isPinned: item.isPinned,
        isFeatured: item.isFeatured,
        createdAt: new Date(item.createdAt),
        author: { name: item.author.name },
        _count: { replies: item._count.replies, reactions: item._count.reactions },
      }))
      setItems((prev) => [...prev, ...newItems])
      setHasMore(result.hasMore)
      setCursor(result.nextCursor)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((post) => (
        <RoomPostCard key={post.id} post={post} roomSlug={roomSlug} />
      ))}

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isPending}
            className="min-h-[44px] active:scale-[0.98]"
          >
            {isPending ? 'Indlæser...' : 'Indlæs flere'}
          </Button>
        </div>
      )}
    </div>
  )
}
