import Link from 'next/link'
import { ArrowRight, PlayCircle, ClipboardList, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProgressRing } from './progress-ring'

interface JourneyDayCardProps {
  journey: {
    slug: string
    title: string
  }
  currentDay: {
    id: string
    title: string | null
    phase: {
      title: string
    }
    contents: Array<{
      contentUnit: {
        title: string
        mediaType: string
      }
    }>
    actions: Array<{
      actionText: string
    }>
  }
  progress: {
    totalDays: number
    completedDays: number
    currentDayNumber: number
    percentComplete: number
  }
}

export function JourneyDayCard({
  journey,
  currentDay,
  progress,
}: JourneyDayCardProps) {
  const dayUrl = `/journeys/${journey.slug}/day/${currentDay.id}`

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      {/* Header */}
      <div className="border-b border-border bg-sand/50 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-primary">
              {journey.title}
            </p>
            <Badge variant="secondary" className="mt-1.5 rounded-full text-xs">
              {currentDay.phase.title}
            </Badge>
          </div>
          <div className="relative ml-4 flex-shrink-0">
            <ProgressRing percent={progress.percentComplete} size={64} strokeWidth={5} />
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {/* Day info */}
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Dag {progress.currentDayNumber} af {progress.totalDays}
        </p>
        <h3 className="mt-1 font-serif text-xl">
          {currentDay.title || `Dag ${progress.currentDayNumber}`}
        </h3>

        {/* Content items */}
        <div className="mt-4 space-y-2">
          {currentDay.contents.map((content, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl bg-sand/50 px-4 py-2.5 text-sm"
            >
              <PlayCircle className="size-4 shrink-0 text-primary" />
              <span className="line-clamp-1">{content.contentUnit.title}</span>
            </div>
          ))}

          {currentDay.actions.map((action, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl bg-coral-light px-4 py-2.5 text-sm"
            >
              <ClipboardList className="size-4 shrink-0 text-coral" />
              <span className="line-clamp-1">{action.actionText}</span>
            </div>
          ))}

          {currentDay.contents.length === 0 && currentDay.actions.length === 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-sand/50 px-4 py-2.5 text-sm text-muted-foreground">
              <Sun className="size-4 shrink-0" />
              <span>Dagens program er klar</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <Button asChild size="lg" className="mt-5 w-full rounded-xl">
          <Link href={dayUrl}>
            Fortsæt med dag {progress.currentDayNumber}
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
