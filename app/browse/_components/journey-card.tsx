import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'

type Journey = {
  id: string
  title: string
  description: string | null
  slug: string
  estimatedDays: number | null
  targetAgeMin: number | null
  targetAgeMax: number | null
  phases: Array<{ id: string; days: Array<{ id: string }> }>
}

function ageLabel(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null
  const minYears = min != null ? Math.floor(min / 12) : 0
  const maxYears = max != null ? Math.floor(max / 12) : null
  if (maxYears != null) return `${minYears}–${maxYears} år`
  return `${minYears}+ år`
}

export function JourneyCard({ journey }: { journey: Journey }) {
  const totalDays = journey.phases.reduce((sum, p) => sum + p.days.length, 0)
  const age = ageLabel(journey.targetAgeMin, journey.targetAgeMax)

  return (
    <Link
      href={`/journeys/${journey.slug}`}
      className="card-hover group flex flex-col rounded-2xl border border-border bg-white"
    >
      {/* Icon area */}
      <div className="flex aspect-[16/9] items-center justify-center rounded-t-2xl bg-primary/5">
        <Calendar className="size-10 text-primary/40" />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <Badge variant="secondary" className="mb-2 w-fit rounded-full text-xs">
          Guidet forløb
        </Badge>

        <h3 className="font-serif text-lg group-hover:text-primary">
          {journey.title}
        </h3>

        <p className="mt-0.5 text-xs text-muted-foreground">
          {totalDays} {totalDays === 1 ? 'dag' : 'dage'}
          {journey.estimatedDays && totalDays !== journey.estimatedDays
            ? ` · ca. ${journey.estimatedDays} dage`
            : ''}
          {age ? ` · ${age}` : ''}
        </p>

        {journey.description && (
          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {journey.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-end border-t border-border pt-4">
          <span className="text-sm font-medium text-primary">Se forløb &rarr;</span>
        </div>
      </div>
    </Link>
  )
}
