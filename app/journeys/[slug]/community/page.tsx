import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import { requireAuth } from '@/lib/auth'
import { trackActivity } from '@/lib/track-activity'
import { prisma } from '@/lib/prisma'
import { getJourney } from '@/lib/services/journey.service'
import { getUserCohort, getCohortFeed } from '@/lib/services/community.service'
import { Badge } from '@/components/ui/badge'
import { NewPostForm } from './_components/new-post-form'
import { FeedList } from './_components/feed-list'

export default async function CommunityFeedPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const user = await requireAuth()
  trackActivity() // fire-and-forget, no await
  const journey = await getJourney(slug)

  if (!journey || !journey.isActive) {
    notFound()
  }

  // Allow both active AND completed journeys to access cohort community
  const userJourney = await prisma.userJourney.findFirst({
    where: {
      userId: user.id,
      journeyId: journey.id,
      status: { in: ['ACTIVE', 'COMPLETED'] },
    },
  })
  if (!userJourney) {
    redirect(`/journeys/${slug}`)
  }

  // Get user's cohort
  const membership = await getUserCohort(user.id, journey.id)
  if (!membership) {
    redirect(`/journeys/${slug}`)
  }

  const cohort = membership.cohort

  // Get initial feed
  const feed = await getCohortFeed(cohort.id, undefined, user.id)

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-2xl">
        {/* Back link */}
        <Link
          href={`/journeys/${slug}`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Tilbage til forløb
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-serif text-2xl sm:text-3xl">
            Fællesskab
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {journey.title} — {cohort.name ?? 'Din gruppe'}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 rounded-full text-xs">
              <Users className="size-3" />
              {cohort._count.members} medlemmer
            </Badge>
          </div>
        </div>

        {/* New post form */}
        <div className="mb-6">
          <NewPostForm cohortId={cohort.id} journeySlug={slug} />
        </div>

        {/* Feed */}
        <FeedList
          initialPosts={feed.items.map((p) => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
          }))}
          initialHasMore={feed.hasMore}
          initialNextCursor={feed.nextCursor}
          cohortId={cohort.id}
          currentUserId={user.id}
          isAdmin={user.role === 'ADMIN'}
          journeySlug={slug}
        />
      </div>
    </div>
  )
}
