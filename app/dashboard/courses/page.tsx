import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, BookOpen, Compass } from 'lucide-react'

import { requireAuth } from '@/lib/auth'
import { getUserAccessibleCourses } from '@/lib/services/entitlement.service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function MyCoursesPage() {
  const user = await requireAuth()
  const courses = await getUserAccessibleCourses(user.id)

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-8">
          <h1 className="font-serif text-2xl sm:text-3xl">Mine forløb</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {courses.length === 0
              ? 'Du har ikke aktive kurser endnu.'
              : `${courses.length} ${courses.length === 1 ? 'kursus' : 'kurser'}`}
          </p>
        </header>

        {courses.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {courses.map((row) => (
              <CourseCard
                key={row.course.id}
                slug={row.course.slug}
                title={row.course.title}
                description={row.course.description}
                coverImageUrl={row.course.coverImageUrl}
                completed={row.progress.completedLessons}
                total={row.progress.totalLessons}
                percent={row.progress.percentComplete}
                bundleTitle={
                  row.grantedVia.kind === 'bundle'
                    ? row.grantedVia.bundle.title
                    : null
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border bg-card p-10 text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <BookOpen className="size-6 text-muted-foreground" />
      </div>
      <h2 className="font-serif text-xl">Endnu ingen forløb</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Når du køber et kursus eller en bundel, finder du det her.
      </p>
      <Button asChild size="lg" className="mt-6 rounded-xl">
        <Link href="/browse">
          <Compass className="mr-2 size-4" />
          Udforsk kurser
        </Link>
      </Button>
    </div>
  )
}

function CourseCard({
  slug,
  title,
  description,
  coverImageUrl,
  completed,
  total,
  percent,
  bundleTitle,
}: {
  slug: string
  title: string
  description: string | null
  coverImageUrl: string | null
  completed: number
  total: number
  percent: number
  bundleTitle: string | null
}) {
  const started = completed > 0
  const finished = total > 0 && completed === total

  return (
    <Link
      href={`/courses/${slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Intet billede
          </div>
        )}
        {bundleTitle && (
          <Badge variant="secondary" className="absolute left-3 top-3">
            Bundel · {bundleTitle}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="mb-1 line-clamp-2 font-serif text-lg">{title}</h2>
        {description && (
          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
        )}

        <div className="mt-auto">
          {total > 0 ? (
            <>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {completed} af {total} lektioner
                </span>
                <span className="font-medium">{percent}%</span>
              </div>
              <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </>
          ) : (
            <p className="mb-4 text-xs text-muted-foreground">
              Indhold er på vej
            </p>
          )}

          <div className="flex items-center justify-between text-sm font-medium text-primary">
            <span>
              {finished ? 'Gennemse igen' : started ? 'Fortsæt' : 'Start kursus'}
            </span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  )
}
