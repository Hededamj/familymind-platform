import Link from 'next/link'
import { ArrowRight, PlayCircle, ClipboardList, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
    <Card className="overflow-hidden border-primary/20">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-primary/15 to-primary/5 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-primary sm:text-sm">
              {journey.title}
            </p>
            <Badge variant="secondary" className="mt-1">
              {currentDay.phase.title}
            </Badge>
          </div>
          <div className="relative ml-4 flex-shrink-0">
            <ProgressRing percent={progress.percentComplete} size={64} strokeWidth={5} />
          </div>
        </div>
      </div>

      <CardHeader className="pb-3 pt-4">
        <CardDescription className="text-xs uppercase tracking-wide">
          Dag {progress.currentDayNumber} af {progress.totalDays}
        </CardDescription>
        <CardTitle className="text-lg sm:text-xl">
          {currentDay.title || `Dag ${progress.currentDayNumber}`}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Content items */}
        {currentDay.contents.length > 0 && (
          <div className="space-y-2">
            {currentDay.contents.map((content, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2 text-sm"
              >
                <PlayCircle className="size-4 flex-shrink-0 text-primary" />
                <span className="line-clamp-1">
                  {content.contentUnit.title}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action items */}
        {currentDay.actions.length > 0 && (
          <div className="space-y-2">
            {currentDay.actions.map((action, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2 text-sm"
              >
                <ClipboardList className="size-4 flex-shrink-0 text-orange-500" />
                <span className="line-clamp-1">{action.actionText}</span>
              </div>
            ))}
          </div>
        )}

        {/* No content or actions placeholder */}
        {currentDay.contents.length === 0 &&
          currentDay.actions.length === 0 && (
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
              <Sun className="size-4 flex-shrink-0" />
              <span>Dagens program er klar</span>
            </div>
          )}

        {/* Primary CTA */}
        <Button asChild size="lg" className="w-full">
          <Link href={dayUrl}>
            Fortsæt med dag {progress.currentDayNumber}
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
