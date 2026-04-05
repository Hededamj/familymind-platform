import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface WeeklyFocusCardProps {
  weeklyFocus: {
    days: Array<{
      id: string
      title: string | null
      position: number
      phaseTitle: string
      completed: boolean
      isCurrent: boolean
    }>
    completedCount: number
    totalCount: number
    currentDay: {
      id: string
      title: string | null
      position: number
      phaseTitle: string
    } | null
  }
  journeyTitle: string
  journeySlug: string
}

export function WeeklyFocusCard({
  weeklyFocus,
  journeyTitle,
  journeySlug,
}: WeeklyFocusCardProps) {
  const { currentDay, days, completedCount, totalCount } = weeklyFocus

  if (!currentDay) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      {/* Header with warm background */}
      <div className="bg-sand/50 px-5 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-primary">
          {journeyTitle}
        </p>
        <h3 className="mt-1 font-serif text-xl leading-snug">
          {currentDay.title || `Dag ${currentDay.position}`}
        </h3>
        <Badge variant="secondary" className="mt-2 rounded-full text-xs">
          {currentDay.phaseTitle}
        </Badge>
      </div>

      {/* Progress dots row */}
      <div className="flex items-center gap-1.5 border-t border-border px-5 py-3 sm:px-6">
        {days.map((day) => (
          <div
            key={day.id}
            className={`size-2.5 rounded-full ${
              day.completed
                ? 'bg-[var(--color-success)]'
                : day.isCurrent
                  ? 'bg-primary'
                  : 'bg-border'
            }`}
          />
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {completedCount} af {totalCount}
        </span>
      </div>

      {/* CTA section */}
      <div className="px-5 pb-5 pt-3 sm:px-6 sm:pb-6">
        <Button asChild size="lg" className="w-full rounded-xl min-h-[44px]">
          <Link href={`/journeys/${journeySlug}/day/${currentDay.id}`}>
            Fortsæt med dagens fokus
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
