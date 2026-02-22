import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Heart, Trash2 } from 'lucide-react'
import { requireAuth } from '@/lib/auth'
import { getJourney, getUserActiveJourney } from '@/lib/services/journey.service'
import { getUserCohort, getPostWithReplies } from '@/lib/services/community.service'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PostCard } from '../_components/post-card'
import { ReplyForm } from '../_components/reply-form'
import { ReplyCard } from './_components/reply-card'

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>
}) {
  const { slug, postId } = await params
  const user = await requireAuth()
  const journey = await getJourney(slug)

  if (!journey || !journey.isActive) {
    notFound()
  }

  // Verify user has active journey and cohort membership
  const activeJourney = await getUserActiveJourney(user.id)
  if (!activeJourney || activeJourney.journeyId !== journey.id) {
    redirect(`/journeys/${slug}`)
  }

  const membership = await getUserCohort(user.id, journey.id)
  if (!membership) {
    redirect(`/journeys/${slug}`)
  }

  const post = await getPostWithReplies(postId, user.id)
  if (!post || post.cohortId !== membership.cohort.id) {
    notFound()
  }

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-2xl">
        {/* Back link */}
        <Link
          href={`/journeys/${slug}/community`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Tilbage til fællesskab
        </Link>

        {/* Post */}
        <PostCard
          post={{
            ...post,
            createdAt: post.createdAt.toISOString(),
            _count: {
              replies: post.replies.length,
              reactions: post.reactions.length,
            },
            reactions: post.reactions
              .filter((r) => r.user.id === user.id)
              .map((r) => ({ id: r.id, emoji: r.emoji })),
          }}
          currentUserId={user.id}
          isAdmin={user.role === 'ADMIN'}
          journeySlug={slug}
          cohortId={membership.cohort.id}
          showFullThread
        />

        {/* Replies */}
        {post.replies.length > 0 && (
          <div className="ml-6 mt-2 space-y-2 border-l-2 border-muted pl-4">
            {post.replies.map((reply) => (
              <ReplyCard
                key={reply.id}
                reply={{
                  ...reply,
                  createdAt: reply.createdAt.toISOString(),
                }}
                postId={postId}
                currentUserId={user.id}
                isAdmin={user.role === 'ADMIN'}
                journeySlug={slug}
              />
            ))}
          </div>
        )}

        {/* Reply form */}
        <div className="mt-4">
          <ReplyForm postId={postId} journeySlug={slug} />
        </div>
      </div>
    </div>
  )
}
