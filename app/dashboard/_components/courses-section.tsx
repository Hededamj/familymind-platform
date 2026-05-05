import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

import { getUserAccessibleCourses } from '@/lib/services/entitlement.service'
import { SectionHeading } from './section-heading'

const MAX_PREVIEW = 3

export async function CoursesSection({ userId }: { userId: string }) {
  const courses = await getUserAccessibleCourses(userId)
  if (courses.length === 0) return null

  const preview = courses.slice(0, MAX_PREVIEW)
  const hasMore = courses.length > MAX_PREVIEW

  return (
    <section>
      <SectionHeading
        title="Mine forløb"
        subtitle={hasMore ? `Viser ${MAX_PREVIEW} af ${courses.length}` : undefined}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {preview.map((row) => (
          <CompactCourseCard
            key={row.course.id}
            slug={row.course.slug}
            title={row.course.title}
            coverImageUrl={row.course.coverImageUrl}
            completed={row.progress.completedLessons}
            total={row.progress.totalLessons}
            percent={row.progress.percentComplete}
          />
        ))}
      </div>
      {hasMore && (
        <Link
          href="/dashboard/courses"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Se alle forløb
          <ArrowRight className="size-3.5" />
        </Link>
      )}
    </section>
  )
}

function CompactCourseCard({
  slug,
  title,
  coverImageUrl,
  completed,
  total,
  percent,
}: {
  slug: string
  title: string
  coverImageUrl: string | null
  completed: number
  total: number
  percent: number
}) {
  return (
    <Link
      href={`/courses/${slug}`}
      className="group flex items-center gap-3 overflow-hidden rounded-2xl border bg-white p-3 transition-shadow hover:shadow-md"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 text-sm font-medium">{title}</h3>
        {total > 0 ? (
          <>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                {completed} / {total}
              </span>
              <span>{percent}%</span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </>
        ) : (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Indhold er på vej
          </p>
        )}
      </div>
    </Link>
  )
}

export default CoursesSection
