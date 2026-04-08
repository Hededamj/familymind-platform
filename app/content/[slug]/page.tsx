import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, Lock, Download } from 'lucide-react'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { hasAccessToCourse } from '@/lib/services/entitlement.service'
import { getContentProgress } from '@/lib/services/progress.service'
import { getSignedPlaybackUrl, getThumbnailUrl } from '@/lib/bunny'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VideoPlayer } from './_components/video-player'
import { MarkCompleteButton } from './_components/mark-complete-button'
import { TrackStarted } from './_components/track-started'

type SearchParams = Promise<{ course?: string }>

export default async function ContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: SearchParams
}) {
  const { slug } = await params
  const { course: courseSlugParam } = await searchParams

  const contentUnit = await prisma.contentUnit.findUnique({
    where: { slug },
    include: {
      courseLessons: {
        include: {
          course: {
            include: {
              lessons: {
                orderBy: { position: 'asc' },
                include: { contentUnit: true },
              },
            },
          },
        },
      },
    },
  })

  if (!contentUnit) notFound()

  // Find the relevant lesson — prefer one matching ?course= slug, otherwise first
  const lesson =
    contentUnit.courseLessons.find(
      (l) => l.course.slug === courseSlugParam
    ) ?? contentUnit.courseLessons[0]

  if (!lesson) notFound()

  const course = lesson.course
  const user = await getCurrentUser()

  const hasAccess =
    lesson.isFreePreview ||
    contentUnit.isFree ||
    (user ? await hasAccessToCourse(user.id, course.id) : false)

  // ────────────────────────────────────────────────────────────────────
  // Locked state
  // ────────────────────────────────────────────────────────────────────
  if (!hasAccess) {
    return (
      <div className="px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <Link
            href={`/courses/${course.slug}`}
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Tilbage til kursus
          </Link>

          <div className="rounded-2xl border bg-card p-8 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
              <Lock className="size-6 text-muted-foreground" />
            </div>
            <h1 className="mb-2 font-serif text-2xl">{contentUnit.title}</h1>
            <p className="mb-6 text-muted-foreground">
              Denne lektion er en del af kurset {course.title}.
            </p>
            <Button asChild size="lg" className="rounded-xl">
              <Link href={`/courses/${course.slug}`}>
                Få adgang via {course.title}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────────────
  // Has access — render the lesson
  // ────────────────────────────────────────────────────────────────────
  const progress = user
    ? await getContentProgress(user.id, contentUnit.id)
    : null
  const isCompleted = !!progress?.completedAt

  // Previous / next within course
  const lessonsInCourse = course.lessons
  const currentIdx = lessonsInCourse.findIndex((l) => l.id === lesson.id)
  const prev = currentIdx > 0 ? lessonsInCourse[currentIdx - 1] : null
  const next =
    currentIdx >= 0 && currentIdx < lessonsInCourse.length - 1
      ? lessonsInCourse[currentIdx + 1]
      : null

  // Build media
  let videoSrc: string | null = null
  let posterUrl: string | null = null
  if (contentUnit.mediaType === 'VIDEO' && contentUnit.bunnyVideoId) {
    try {
      videoSrc = await getSignedPlaybackUrl(contentUnit.bunnyVideoId)
      posterUrl = getThumbnailUrl(contentUnit.bunnyVideoId)
    } catch {
      videoSrc = null
    }
  }

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-12">
      {user && <TrackStarted contentUnitId={contentUnit.id} />}

      <div className="mx-auto max-w-3xl">
        <Link
          href={`/courses/${course.slug}`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {course.title}
        </Link>

        {/* Media */}
        <div className="mb-6">
          {contentUnit.mediaType === 'VIDEO' && videoSrc && (
            <VideoPlayer src={videoSrc} poster={posterUrl ?? undefined} />
          )}

          {contentUnit.mediaType === 'AUDIO' && contentUnit.mediaUrl && (
            <div className="rounded-2xl border bg-card p-6">
              <audio
                controls
                src={contentUnit.mediaUrl}
                className="w-full"
              >
                Din browser understøtter ikke lydafspilning.
              </audio>
            </div>
          )}

          {contentUnit.mediaType === 'PDF' && contentUnit.mediaUrl && (
            <div className="rounded-2xl border bg-card p-6 text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                PDF-dokument
              </p>
              <Button asChild className="rounded-xl">
                <a
                  href={contentUnit.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="mr-2 size-4" />
                  Hent PDF
                </a>
              </Button>
            </div>
          )}
        </div>

        {/* Title + meta */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {contentUnit.mediaType === 'VIDEO'
                ? 'Video'
                : contentUnit.mediaType === 'AUDIO'
                  ? 'Lyd'
                  : contentUnit.mediaType === 'PDF'
                    ? 'PDF'
                    : 'Artikel'}
            </Badge>
            {contentUnit.durationMinutes ? (
              <span className="text-xs text-muted-foreground">
                {contentUnit.durationMinutes} min
              </span>
            ) : null}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl">
            {contentUnit.title}
          </h1>
          {contentUnit.description && (
            <p className="mt-2 text-muted-foreground">
              {contentUnit.description}
            </p>
          )}
        </div>

        {/* TEXT body */}
        {contentUnit.mediaType === 'TEXT' && contentUnit.bodyHtml && (
          <article
            className="prose prose-neutral mb-8 max-w-none"
            dangerouslySetInnerHTML={{ __html: contentUnit.bodyHtml }}
          />
        )}

        {/* Mark complete */}
        {user && (
          <div className="mb-8">
            <MarkCompleteButton
              contentUnitId={contentUnit.id}
              isCompleted={isCompleted}
            />
          </div>
        )}

        {/* Prev / next nav */}
        <div className="flex items-center justify-between gap-4 border-t pt-6">
          {prev ? (
            <Button
              asChild
              variant="ghost"
              className="rounded-xl"
            >
              <Link
                href={`/content/${prev.contentUnit.slug}?course=${course.slug}`}
              >
                <ChevronLeft className="mr-1 size-4" />
                Forrige
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {next ? (
            <Button
              asChild
              variant="ghost"
              className="rounded-xl"
            >
              <Link
                href={`/content/${next.contentUnit.slug}?course=${course.slug}`}
              >
                Næste
                <ChevronRight className="ml-1 size-4" />
              </Link>
            </Button>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  )
}
