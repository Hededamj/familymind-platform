import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  PlayCircle,
  FileText,
  Headphones,
  Type,
  ClipboardList,
  MessageSquare,
  Lock,
} from 'lucide-react'
import { requireAuth } from '@/lib/auth'
import {
  getJourney,
  getUserActiveJourney,
  getJourneyProgress,
} from '@/lib/services/journey.service'
import { getCheckInOptions } from '@/lib/services/settings.service'
import { canAccessContent } from '@/lib/services/entitlement.service'
import { getSignedPlaybackUrl, getThumbnailUrl } from '@/lib/bunny'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { VideoPlayer } from '@/app/content/[slug]/_components/video-player'
import { CheckInForm } from '../../_components/check-in-form'

function mediaTypeIcon(mediaType: string) {
  switch (mediaType) {
    case 'VIDEO':
      return PlayCircle
    case 'AUDIO':
      return Headphones
    case 'PDF':
      return FileText
    case 'TEXT':
      return Type
    default:
      return FileText
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

export default async function DayViewPage({
  params,
}: {
  params: Promise<{ slug: string; dayId: string }>
}) {
  const { slug, dayId } = await params
  const user = await requireAuth()
  const journey = await getJourney(slug)

  if (!journey || !journey.isActive) {
    notFound()
  }

  // Find the specific day across all phases
  let targetDay = null
  let targetPhase = null
  let dayNumber = 0
  let dayCounter = 0

  for (const phase of journey.phases) {
    for (const day of phase.days) {
      dayCounter++
      if (day.id === dayId) {
        targetDay = day
        targetPhase = phase
        dayNumber = dayCounter
        break
      }
    }
    if (targetDay) break
  }

  if (!targetDay || !targetPhase) {
    notFound()
  }

  const totalDays = journey.phases.reduce((sum, p) => sum + p.days.length, 0)

  // Check if user has this journey active
  const activeJourney = await getUserActiveJourney(user.id)
  const isActiveForThisJourney =
    activeJourney && activeJourney.journeyId === journey.id
  const isCurrentDay = isActiveForThisJourney && activeJourney.currentDayId === dayId

  // Get progress if active
  const progress = isActiveForThisJourney
    ? await getJourneyProgress(activeJourney.id)
    : null

  // Check if this day was already completed
  const completedDayIds = new Set(
    progress?.phases.flatMap((p) =>
      p.days.filter((d) => d.completed).map((d) => d.id)
    ) ?? []
  )
  const isDayCompleted = completedDayIds.has(dayId)

  // Block access to future days the user hasn't reached yet
  if (isActiveForThisJourney && !isDayCompleted && !isCurrentDay) {
    return (
      <div className="flex min-h-screen flex-col px-4 py-6 pb-24 sm:px-8 sm:py-8">
        <div className="mx-auto w-full max-w-2xl">
          <Link
            href={`/journeys/${slug}`}
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Tilbage til oversigt
          </Link>
          <Card>
            <CardContent className="py-6 text-center">
              <Lock className="mx-auto mb-3 size-8 text-muted-foreground" />
              <p className="mb-2 font-medium">Denne dag er ikke tilgængelig endnu</p>
              <p className="mb-4 text-sm text-muted-foreground">
                Gennemfør de tidligere dage for at låse op for denne dag.
              </p>
              <Button asChild>
                <Link href={`/journeys/${slug}`}>
                  Gå til forløbsoversigt
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Resolve content access and video URLs
  const contentItems = await Promise.all(
    targetDay.contents.map(async (content) => {
      const cu = content.contentUnit
      const hasAccess = await canAccessContent(user.id, cu.id)

      let playbackUrl: string | undefined
      let thumbnailUrl: string | undefined

      if (cu.bunnyVideoId && hasAccess) {
        playbackUrl = await getSignedPlaybackUrl(cu.bunnyVideoId)
        thumbnailUrl = getThumbnailUrl(cu.bunnyVideoId)
      } else if (cu.bunnyVideoId) {
        thumbnailUrl = getThumbnailUrl(cu.bunnyVideoId)
      }

      return {
        id: cu.id,
        title: cu.title,
        description: cu.description,
        mediaType: cu.mediaType,
        mediaUrl: cu.mediaUrl,
        bunnyVideoId: cu.bunnyVideoId,
        hasAccess,
        playbackUrl,
        thumbnailUrl,
      }
    })
  )

  // Load check-in options from DB
  const checkInOptions = await getCheckInOptions()

  return (
    <div className="flex min-h-screen flex-col px-4 py-6 pb-24 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-2xl">
        {/* Back link */}
        <Link
          href={`/journeys/${slug}`}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Tilbage til oversigt
        </Link>

        {/* Day header */}
        <div className="mb-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{targetPhase.title}</Badge>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Dag {dayNumber} af {totalDays}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {targetDay.title || `Dag ${dayNumber}`}
          </h1>
          {isDayCompleted && (
            <Badge variant="outline" className="mt-2 text-green-600">
              Gennemført
            </Badge>
          )}
        </div>

        {/* Content section */}
        {contentItems.length > 0 && (
          <section className="mb-6 space-y-4">
            <h2 className="text-lg font-semibold">Dagens indhold</h2>
            {contentItems.map((content) => (
              <Card key={content.id} className="overflow-hidden">
                {/* Video player for accessible VIDEO content */}
                {content.mediaType === 'VIDEO' &&
                  content.hasAccess &&
                  content.playbackUrl && (
                    <VideoPlayer
                      src={content.playbackUrl}
                      poster={content.thumbnailUrl}
                    />
                  )}

                {/* Locked video */}
                {content.mediaType === 'VIDEO' &&
                  !content.hasAccess && (
                    <div className="relative aspect-video w-full bg-muted">
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                        <Lock className="mb-2 size-8 text-white/80" />
                        <p className="text-sm text-white/80">
                          Kræver abonnement
                        </p>
                      </div>
                    </div>
                  )}

                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    {(() => {
                      const Icon = mediaTypeIcon(content.mediaType)
                      return (
                        <Icon className="mt-0.5 size-5 flex-shrink-0 text-primary" />
                      )
                    })()}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{content.title}</p>
                      {content.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {content.description}
                        </p>
                      )}
                      <Badge variant="outline" className="mt-2 text-xs">
                        {mediaTypeLabel(content.mediaType)}
                      </Badge>
                    </div>
                  </div>

                  {/* Non-video media links */}
                  {content.mediaType !== 'VIDEO' &&
                    content.hasAccess &&
                    content.mediaUrl && (
                      <div className="mt-3">
                        {content.mediaType === 'AUDIO' && (
                          <audio
                            src={content.mediaUrl}
                            controls
                            className="w-full"
                          >
                            Din browser understøtter ikke lydafspilning.
                          </audio>
                        )}
                        {content.mediaType === 'PDF' && (
                          <Button asChild variant="outline" size="sm">
                            <a
                              href={content.mediaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FileText className="mr-2 size-4" />
                              Åbn PDF
                            </a>
                          </Button>
                        )}
                      </div>
                    )}

                  {/* Locked non-video content */}
                  {content.mediaType !== 'VIDEO' && !content.hasAccess && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Lock className="size-4" />
                      <span>Kræver abonnement for at se indholdet</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </section>
        )}

        {/* Action card */}
        {targetDay.actions.length > 0 && (
          <section className="mb-6 space-y-4">
            <h2 className="text-lg font-semibold">Dagens handling</h2>
            {targetDay.actions.map((action) => (
              <Card
                key={action.id}
                className="border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/20"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <ClipboardList className="mt-0.5 size-5 flex-shrink-0 text-orange-500" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{action.actionText}</p>
                      {action.reflectionPrompt && (
                        <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/60 p-3 dark:bg-black/10">
                          <MessageSquare className="mt-0.5 size-4 flex-shrink-0 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground italic">
                            {action.reflectionPrompt}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        )}

        <Separator className="mb-6" />

        {/* Check-in form (only for current day) */}
        {isCurrentDay && isActiveForThisJourney && (
          <CheckInForm
            userJourneyId={activeJourney.id}
            dayId={dayId}
            journeySlug={slug}
            checkInOptions={checkInOptions.map((o) => ({
              id: o.id,
              label: o.label,
              value: o.value,
              emoji: o.emoji,
            }))}
            isCurrentDay={true}
          />
        )}

        {/* Already completed day message */}
        {isDayCompleted && !isCurrentDay && (
          <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
            <CardContent className="py-6 text-center">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                Du har allerede gennemført denne dag.
              </p>
              <Button asChild variant="outline" className="mt-4" size="sm">
                <Link href={`/journeys/${slug}`}>
                  Tilbage til oversigt
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Not started yet */}
        {!isActiveForThisJourney && (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="mb-4 text-sm text-muted-foreground">
                Start forløbet for at gennemføre denne dag.
              </p>
              <Button asChild>
                <Link href={`/journeys/${slug}`}>
                  Gå til forløbsoversigt
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
