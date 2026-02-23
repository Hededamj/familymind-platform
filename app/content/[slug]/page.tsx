import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getContentUnit } from '@/lib/services/content.service'
import { getProduct } from '@/lib/services/product.service'
import { getCurrentUser } from '@/lib/auth'
import { canAccessContent } from '@/lib/services/entitlement.service'
import { getContentProgress } from '@/lib/services/progress.service'
import { getSignedPlaybackUrl, getThumbnailUrl } from '@/lib/bunny'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight, Clock, Lock } from 'lucide-react'
import { VideoPlayer } from './_components/video-player'
import { MarkCompleteButton } from './_components/mark-complete-button'
import { TrackStarted } from './_components/track-started'

function difficultyLabel(difficulty: string): string {
  switch (difficulty) {
    case 'INTRODUCTORY':
      return 'Introduktion'
    case 'INTERMEDIATE':
      return 'Mellemniveau'
    case 'ADVANCED':
      return 'Avanceret'
    default:
      return difficulty
  }
}

function mediaTypeLabel(mediaType: string): string {
  switch (mediaType) {
    case 'VIDEO':
      return 'Video'
    case 'AUDIO':
      return 'Lyd'
    case 'PDF':
      return 'PDF'
    case 'TEXT':
      return 'Tekst'
    default:
      return mediaType
  }
}

export default async function ContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ course?: string }>
}) {
  const { slug } = await params
  const { course: courseSlug } = await searchParams
  const content = await getContentUnit(slug)

  if (!content || !content.publishedAt) {
    notFound()
  }

  const user = await getCurrentUser()
  const hasAccess = user
    ? await canAccessContent(user.id, content.id)
    : content.isFree || content.accessLevel === 'FREE'

  // Resolve thumbnail
  const thumbnailUrl = content.bunnyVideoId
    ? getThumbnailUrl(content.bunnyVideoId)
    : content.thumbnailUrl

  if (hasAccess) {
    // Full content view
    let playbackUrl: string | undefined
    if (content.bunnyVideoId) {
      playbackUrl = await getSignedPlaybackUrl(content.bunnyVideoId)
    }

    // Check progress for authenticated users
    const progress = user
      ? await getContentProgress(user.id, content.id)
      : null
    const isCompleted = !!progress?.completedAt

    // Load course context if ?course= param is present
    let courseContext: {
      product: { title: string; slug: string }
      prevLesson: { slug: string; title: string } | null
      nextLesson: { slug: string; title: string } | null
      currentPosition: number
      totalLessons: number
    } | null = null

    if (courseSlug) {
      const course = await getProduct(courseSlug)
      if (course && course.type === 'COURSE') {
        const lessons = course.courseLessons.sort((a, b) => a.position - b.position)
        const currentIndex = lessons.findIndex(l => l.contentUnit.slug === slug)
        if (currentIndex >= 0) {
          courseContext = {
            product: { title: course.title, slug: course.slug },
            prevLesson: currentIndex > 0
              ? { slug: lessons[currentIndex - 1].contentUnit.slug, title: lessons[currentIndex - 1].contentUnit.title }
              : null,
            nextLesson: currentIndex < lessons.length - 1
              ? { slug: lessons[currentIndex + 1].contentUnit.slug, title: lessons[currentIndex + 1].contentUnit.title }
              : null,
            currentPosition: currentIndex + 1,
            totalLessons: lessons.length,
          }
        }
      }
    }

    return (
      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto w-full max-w-3xl">
          {/* Track content as started for authenticated users */}
          {user && <TrackStarted contentUnitId={content.id} />}

          {/* Course context bar or back link */}
          {courseContext ? (
            <div className="mb-6 rounded-xl border border-border bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <Link
                  href={`/products/${courseContext.product.slug}`}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-4" />
                  {courseContext.product.title}
                </Link>
                <span className="text-xs text-muted-foreground">
                  Lektion {courseContext.currentPosition} af {courseContext.totalLessons}
                </span>
              </div>
              <Progress
                value={(courseContext.currentPosition / courseContext.totalLessons) * 100}
                className="h-1.5"
              />
            </div>
          ) : (
            <Link
              href={user ? '/dashboard' : '/browse'}
              className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              {user ? 'Tilbage til min side' : 'Tilbage'}
            </Link>
          )}

          {/* Video player */}
          {content.mediaType === 'VIDEO' && playbackUrl && (
            <div className="mb-6">
              <VideoPlayer
                src={playbackUrl}
                poster={thumbnailUrl ?? undefined}
              />
            </div>
          )}

          {/* Non-video media */}
          {content.mediaType !== 'VIDEO' && content.mediaUrl && (
            <div className="mb-6">
              {content.mediaType === 'AUDIO' && (
                <div className="rounded-2xl border border-border bg-sand p-6">
                  <audio
                    src={content.mediaUrl}
                    controls
                    className="w-full"
                  >
                    Din browser understøtter ikke lydafspilning.
                  </audio>
                </div>
              )}
              {content.mediaType === 'PDF' && (
                <div className="rounded-2xl border border-border bg-sand p-6 text-center">
                  <Button asChild className="rounded-xl">
                    <a
                      href={content.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Åbn PDF
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Content header */}
          <div className="mb-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full text-xs">
                {mediaTypeLabel(content.mediaType)}
              </Badge>
              <Badge variant="outline" className="rounded-full text-xs">
                {difficultyLabel(content.difficulty)}
              </Badge>
              {content.durationMinutes && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {content.durationMinutes} min.
                </span>
              )}
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl">
              {content.title}
            </h1>
          </div>

          {/* Tags */}
          {content.tags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-1.5">
              {content.tags.map((ct) => (
                <Badge
                  key={ct.tagId}
                  variant="secondary"
                  className="rounded-full text-xs font-normal"
                >
                  {ct.tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          {content.description && (
            <div className="mb-8 text-sm leading-relaxed text-muted-foreground sm:text-base">
              <p>{content.description}</p>
            </div>
          )}

          {/* Mark as complete button */}
          {user && (
            <div className="border-t border-border pt-6">
              <MarkCompleteButton
                contentUnitId={content.id}
                isCompleted={isCompleted}
              />
            </div>
          )}

          {/* Next/previous navigation */}
          {courseContext && (
            <div className="mt-6 flex items-center justify-between border-t border-border pt-6">
              {courseContext.prevLesson ? (
                <Link
                  href={`/content/${courseContext.prevLesson.slug}?course=${courseContext.product.slug}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-4" />
                  <span className="line-clamp-1 max-w-[150px]">{courseContext.prevLesson.title}</span>
                </Link>
              ) : <div />}

              {courseContext.nextLesson ? (
                <Link
                  href={`/content/${courseContext.nextLesson.slug}?course=${courseContext.product.slug}`}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <span className="line-clamp-1 max-w-[150px]">{courseContext.nextLesson.title}</span>
                  <ArrowRight className="size-4" />
                </Link>
              ) : (
                <Link
                  href={`/products/${courseContext.product.slug}`}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  Tilbage til kurset
                  <ArrowRight className="size-4" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Gated View ───────────────────────────────────────────────

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-3xl">
        {/* Back link */}
        <Link
          href="/browse"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Tilbage
        </Link>

        {/* Thumbnail with lock overlay */}
        <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-2xl bg-sand">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={content.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg
                className="size-16 text-muted-foreground/20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
          {/* Lock overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
              <Lock className="size-8 text-white" />
            </div>
          </div>
        </div>

        {/* Content header */}
        <div className="mb-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full text-xs">
              {mediaTypeLabel(content.mediaType)}
            </Badge>
            <Badge variant="outline" className="rounded-full text-xs">
              {difficultyLabel(content.difficulty)}
            </Badge>
            {content.durationMinutes && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" />
                {content.durationMinutes} min.
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl">
            {content.title}
          </h1>
        </div>

        {/* Tags */}
        {content.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {content.tags.map((ct) => (
              <Badge
                key={ct.tagId}
                variant="secondary"
                className="rounded-full text-xs font-normal"
              >
                {ct.tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Brief description */}
        {content.description && (
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {content.description}
          </p>
        )}

        {/* Access gating card */}
        <div className="rounded-2xl border border-border bg-white p-8 text-center">
          {content.accessLevel === 'SUBSCRIPTION' && (
            <Badge className="mb-4 rounded-full bg-primary/10 text-primary hover:bg-primary/10">
              Kræver abonnement
            </Badge>
          )}
          {content.accessLevel === 'PURCHASE' && (
            <Badge className="mb-4 rounded-full bg-primary/10 text-primary hover:bg-primary/10">
              Kræver køb
            </Badge>
          )}

          <p className="mb-6 text-muted-foreground">
            {user
              ? 'Få adgang til dette og alt andet indhold med et abonnement.'
              : 'Log ind for at se dette indhold.'}
          </p>

          <div className="flex flex-col gap-3">
            {!user && (
              <>
                <Button asChild size="lg" className="w-full rounded-xl">
                  <Link href={`/login?redirect=/content/${content.slug}`}>
                    Log ind
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full rounded-xl"
                >
                  <Link href={`/signup?redirect=/content/${content.slug}`}>
                    Opret konto
                  </Link>
                </Button>
              </>
            )}

            {user && content.accessLevel === 'SUBSCRIPTION' && (
              <Button asChild size="lg" className="w-full rounded-xl">
                <Link href="/subscribe">
                  Start abonnement — 149 kr/md
                </Link>
              </Button>
            )}

            {user && content.accessLevel === 'PURCHASE' && (
              <Button asChild size="lg" className="w-full rounded-xl">
                <Link href="/browse">Se produkter</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
