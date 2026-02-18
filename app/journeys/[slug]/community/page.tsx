import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import { requireAuth } from '@/lib/auth'
import { getJourney, getUserActiveJourney } from '@/lib/services/journey.service'
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
  const journey = await getJourney(slug)

  if (!journey || !journey.isActive) {
    notFound()
  }

  // User must have this journey active
  const activeJourney = await getUserActiveJourney(user.id)
  if (!activeJourney || activeJourney.journeyId !== journey.id) {
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
    <div className="flex min-h-screen flex-col px-4 py-6 sm:px-8 sm:py-8">
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
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Fællesskab
          </h1>
          <p className="mt-1 text-muted-foreground">
            {journey.title} — {cohort.name ?? 'Din gruppe'}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
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
