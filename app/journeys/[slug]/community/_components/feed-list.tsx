'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { PostCard } from './post-card'
import { getCohortFeedAction } from '../actions'

type FeedPost = {
  id: string
  body: string
  isPrompt: boolean
  isPinned: boolean
  createdAt: string | Date
  author: { id: string; name: string | null }
  day?: { id: string; title: string | null; position: number } | null
  _count: { replies: number; reactions: number }
  reactions?: { id: string; emoji: string }[]
}

type FeedListProps = {
  initialPosts: FeedPost[]
  initialHasMore: boolean
  initialNextCursor?: string
  cohortId: string
  currentUserId: string
  isAdmin: boolean
  journeySlug: string
}

export function FeedList({
  initialPosts,
  initialHasMore,
  initialNextCursor,
  cohortId,
  currentUserId,
  isAdmin,
  journeySlug,
}: FeedListProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [cursor, setCursor] = useState(initialNextCursor)
  const [isPending, startTransition] = useTransition()

  function loadMore() {
    if (!cursor || !hasMore) return

    startTransition(async () => {
      const result = await getCohortFeedAction(cohortId, cursor)
      setPosts((prev) => [...prev, ...result.items as FeedPost[]])
      setHasMore(result.hasMore)
      setCursor(result.nextCursor)
    })
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Ingen indlæg endnu. Vær den første til at dele noget med gruppen!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          journeySlug={journeySlug}
          cohortId={cohortId}
        />
      ))}

      {hasMore && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isPending}
          >
            {isPending ? 'Henter...' : 'Vis flere indlæg'}
          </Button>
        </div>
      )}
    </div>
  )
}
