import Link from 'next/link'
import { Compass } from 'lucide-react'
import { requireAuth } from '@/lib/auth'
import { getDashboardState } from '@/lib/services/dashboard.service'
import { Button } from '@/components/ui/button'
import { CourseTile } from '@/components/course-tile'

export default async function MyCoursesPage() {
  const user = await requireAuth()

  const { activeJourney, journeyProgress, inProgressCourses } =
    await getDashboardState(user.id)

  const hasActiveJourney = !!(activeJourney?.currentDay && journeyProgress)
  const hasActiveCourses = inProgressCourses.length > 0
  const isEmpty = !hasActiveJourney && !hasActiveCourses

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="mb-8 font-serif text-2xl">Mine forløb</h1>

        {/* Active journey */}
        {hasActiveJourney && (
          <section className="mb-8">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Aktiv rejse
            </p>
            <CourseTile
              title={activeJourney!.journey.title}
              description={activeJourney!.journey.description}
              imageUrl={activeJourney!.journey.coverImageUrl}
              href={`/journeys/${activeJourney!.journey.slug}`}
              progress={journeyProgress!.percentComplete}
              phaseName={`Dag ${journeyProgress!.currentDayNumber} af ${journeyProgress!.totalDays}`}
              variant="active"
            />
          </section>
        )}

        {/* Active courses */}
        {hasActiveCourses && (
          <section className="mb-8">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Aktive kurser
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {inProgressCourses.map((course) => (
                <CourseTile
                  key={course.product.id}
                  title={course.product.title}
                  description={course.product.description}
                  imageUrl={
                    course.product.thumbnailUrl ?? course.product.coverImageUrl
                  }
                  href={`/courses/${course.product.slug}`}
                  lessonCount={course.totalLessons}
                  progress={course.percentComplete}
                  variant="active"
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center py-16 text-center">
            <Compass className="mb-4 size-12 text-muted-foreground/40" />
            <h2 className="mb-2 font-serif text-lg">Ingen aktive forløb</h2>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Udforsk vores katalog og find det forløb eller kursus, der passer
              til din familie.
            </p>
            <Button asChild className="min-h-[44px]">
              <Link href="/browse">Udforsk katalog</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
