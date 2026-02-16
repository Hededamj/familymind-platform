import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getContentUnit } from '@/lib/services/content.service'
import { getCurrentUser } from '@/lib/auth'
import { canAccessContent } from '@/lib/services/entitlement.service'
import { getSignedPlaybackUrl, getThumbnailUrl } from '@/lib/bunny'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { VideoPlayer } from './_components/video-player'

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

function difficultyVariant(
  difficulty: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (difficulty) {
    case 'INTRODUCTORY':
      return 'secondary'
    case 'INTERMEDIATE':
      return 'default'
    case 'ADVANCED':
      return 'destructive'
    default:
      return 'outline'
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
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const content = await getContentUnit(slug)

  if (!content || !content.publishedAt) {
    notFound()
  }

  const user = await getCurrentUser()
  const hasAccess = user
    ? await canAccessContent(user.id, content.id)
    : content.accessLevel === 'FREE'

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

    return (
      <div className="flex min-h-screen flex-col px-4 py-8 sm:px-8">
        <div className="mx-auto w-full max-w-3xl">
          {/* Back link */}
          <Link
            href="/dashboard"
            className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Tilbage
          </Link>

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
                <div className="rounded-lg border bg-muted p-6">
                  <audio
                    src={content.mediaUrl}
                    controls
                    className="w-full"
                  >
                    Din browser underst&oslash;tter ikke lydafspilning.
                  </audio>
                </div>
              )}
              {content.mediaType === 'PDF' && (
                <div className="rounded-lg border bg-muted p-6 text-center">
                  <Button asChild>
                    <a
                      href={content.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      &Aring;bn PDF
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Content header */}
          <div className="mb-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{mediaTypeLabel(content.mediaType)}</Badge>
              <Badge variant={difficultyVariant(content.difficulty)}>
                {difficultyLabel(content.difficulty)}
              </Badge>
              {content.durationMinutes && (
                <span className="text-sm text-muted-foreground">
                  {content.durationMinutes} min.
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {content.title}
            </h1>
          </div>

          {/* Tags */}
          {content.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {content.tags.map((ct) => (
                <Badge key={ct.tagId} variant="secondary">
                  {ct.tag.name}
                </Badge>
              ))}
            </div>
          )}

          <Separator className="mb-4" />

          {/* Description */}
          {content.description && (
            <div className="prose prose-sm max-w-none text-muted-foreground sm:prose-base">
              <p>{content.description}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Gated View ───────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col px-4 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-3xl">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Tilbage
        </Link>

        {/* Thumbnail with lock overlay */}
        <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-lg bg-muted">
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
                className="h-16 w-16 text-muted-foreground/30"
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
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
              <svg
                className="h-10 w-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Content header */}
        <div className="mb-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{mediaTypeLabel(content.mediaType)}</Badge>
            <Badge variant={difficultyVariant(content.difficulty)}>
              {difficultyLabel(content.difficulty)}
            </Badge>
            {content.durationMinutes && (
              <span className="text-sm text-muted-foreground">
                {content.durationMinutes} min.
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {content.title}
          </h1>
        </div>

        {/* Tags */}
        {content.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {content.tags.map((ct) => (
              <Badge key={ct.tagId} variant="secondary">
                {ct.tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Brief description */}
        {content.description && (
          <p className="mb-6 text-muted-foreground line-clamp-3">
            {content.description}
          </p>
        )}

        <Separator className="mb-6" />

        {/* Access gating card */}
        <Card>
          <CardContent className="pt-6">
            {/* Access level badge */}
            <div className="mb-4 text-center">
              {content.accessLevel === 'SUBSCRIPTION' && (
                <Badge variant="default" className="text-sm">
                  Kr&aelig;ver abonnement
                </Badge>
              )}
              {content.accessLevel === 'PURCHASE' && (
                <Badge variant="default" className="text-sm">
                  Kr&aelig;ver k&oslash;b
                </Badge>
              )}
            </div>

            <p className="mb-6 text-center text-muted-foreground">
              {user
                ? 'Du har ikke adgang til dette indhold endnu.'
                : 'Log ind for at se dette indhold.'}
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col gap-3">
              {!user && (
                <Button asChild size="lg" className="w-full">
                  <Link href={`/login?redirect=/content/${content.slug}`}>
                    Log ind for at se indhold
                  </Link>
                </Button>
              )}

              {user && content.accessLevel === 'SUBSCRIPTION' && (
                <Button asChild size="lg" className="w-full">
                  <Link href="/subscribe">
                    Start abonnement &mdash; 149 kr/md
                  </Link>
                </Button>
              )}

              {user && content.accessLevel === 'PURCHASE' && (
                <Button asChild size="lg" className="w-full">
                  <Link href="/">Se produkter</Link>
                </Button>
              )}

              {!user && (
                <Button asChild variant="outline" size="lg" className="w-full">
                  <Link href={`/login?redirect=/content/${content.slug}`}>
                    Opret konto
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
