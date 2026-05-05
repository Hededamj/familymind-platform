import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  CheckCircle,
  Lock,
  PlayCircle,
  FileText,
  Headphones,
  Type,
} from 'lucide-react'

import { getCurrentUser } from '@/lib/auth'
import { getCourse } from '@/lib/services/course.service'
import { hasAccessToCourse } from '@/lib/services/entitlement.service'
import { getCourseProgress } from '@/lib/services/progress.service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDKK } from '@/lib/format-currency'
import { BuyButton } from './_components/BuyButton'

const mediaTypeIcon: Record<string, typeof PlayCircle> = {
  VIDEO: PlayCircle,
  PDF: FileText,
  AUDIO: Headphones,
  TEXT: Type,
}

const mediaTypeLabel: Record<string, string> = {
  VIDEO: 'Video',
  PDF: 'PDF',
  AUDIO: 'Lyd',
  TEXT: 'Artikel',
}

function intervalLabel(
  billingType: string,
  interval: string | null,
  intervalCount: number
): string {
  if (billingType === 'one_time') return 'Engangsbetaling'
  if (!interval) return ''
  const unit =
    interval === 'month'
      ? intervalCount === 1
        ? 'måned'
        : 'måneder'
      : interval === 'year'
        ? intervalCount === 1
          ? 'år'
          : 'år'
        : interval === 'week'
          ? 'uge'
          : 'dag'
  return intervalCount === 1 ? `pr. ${unit}` : `hver ${intervalCount} ${unit}`
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const course = await getCourse(slug)

  if (!course || !course.isActive) {
    notFound()
  }

  const user = await getCurrentUser()
  const hasAccess = user ? await hasAccessToCourse(user.id, course.id) : false

  // ────────────────────────────────────────────────────────────────────────
  // STATE A: Brugeren har adgang — vis pensum med fremgang
  // ────────────────────────────────────────────────────────────────────────
  if (hasAccess && user) {
    const progress = await getCourseProgress(user.id, course.id)
    const completedByLessonId = new Map(
      progress.lessons.map((l) => [l.id, l.completed])
    )

    const lessonsByModuleId = new Map<string | null, typeof course.lessons>()
    for (const lesson of course.lessons) {
      const key = lesson.moduleId ?? null
      const arr = lessonsByModuleId.get(key) ?? []
      arr.push(lesson)
      lessonsByModuleId.set(key, arr)
    }

    return (
      <div className="px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto w-full max-w-3xl">
          <Link
            href="/dashboard/courses"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Mine forløb
          </Link>

          <h1 className="mb-2 font-serif text-2xl sm:text-3xl">
            {course.title}
          </h1>
          {course.description && (
            <p className="mb-6 text-muted-foreground">{course.description}</p>
          )}

          {/* Fremgang */}
          <div className="mb-8 rounded-xl border bg-card p-5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Din fremgang</span>
              <span className="text-muted-foreground">
                {progress.completedLessons} af {progress.totalLessons} lektioner
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress.percentComplete}%` }}
              />
            </div>
          </div>

          {/* Pensum */}
          {course.modules.length > 0 ? (
            <div className="space-y-6">
              {course.modules.map((mod, i) => {
                const modLessons = lessonsByModuleId.get(mod.id) ?? []
                return (
                  <div key={mod.id} className="overflow-hidden rounded-xl border">
                    <div className="border-b bg-muted/20 px-5 py-4">
                      <h2 className="font-medium">
                        <span className="mr-2 text-muted-foreground">
                          {i + 1}.
                        </span>
                        {mod.title}
                      </h2>
                      {mod.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {mod.description}
                        </p>
                      )}
                    </div>
                    <div className="divide-y">
                      {modLessons.map((lesson) => (
                        <LessonRow
                          key={lesson.id}
                          lesson={lesson}
                          completed={!!completedByLessonId.get(lesson.id)}
                          courseSlug={course.slug}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Lektioner uden modul */}
              {(lessonsByModuleId.get(null)?.length ?? 0) > 0 && (
                <div className="overflow-hidden rounded-xl border">
                  <div className="border-b bg-muted/20 px-5 py-4">
                    <h2 className="font-medium">Øvrige lektioner</h2>
                  </div>
                  <div className="divide-y">
                    {(lessonsByModuleId.get(null) ?? []).map((lesson) => (
                      <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        completed={!!completedByLessonId.get(lesson.id)}
                        courseSlug={course.slug}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border divide-y">
              {course.lessons.map((lesson) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  completed={!!completedByLessonId.get(lesson.id)}
                  courseSlug={course.slug}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────────────────
  // STATE B: Ingen adgang — vis landingsside
  // ────────────────────────────────────────────────────────────────────────
  const moduleCount = course.modules.length
  const lessonCount = course.lessons.length
  const totalDuration = course.lessons.reduce(
    (sum, l) => sum + (l.contentUnit.durationMinutes ?? 0),
    0
  )

  const lessonsByModuleId = new Map<string | null, typeof course.lessons>()
  for (const lesson of course.lessons) {
    const key = lesson.moduleId ?? null
    const arr = lessonsByModuleId.get(key) ?? []
    arr.push(lesson)
    lessonsByModuleId.set(key, arr)
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-sand px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-primary">
            Kursus
            {moduleCount > 0 ? ` · ${moduleCount} moduler` : ''}
            {lessonCount > 0 ? ` · ${lessonCount} lektioner` : ''}
            {totalDuration > 0 ? ` · ${totalDuration} min` : ''}
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl">{course.title}</h1>
          {course.description && (
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              {course.description}
            </p>
          )}
        </div>
      </section>

      {/* Cover image */}
      {course.coverImageUrl && (
        <section className="px-4 sm:px-8">
          <div className="mx-auto -mt-8 max-w-4xl overflow-hidden rounded-2xl shadow-lg">
            <Image
              src={course.coverImageUrl}
              alt={course.title}
              width={1200}
              height={675}
              className="h-full w-full object-cover"
            />
          </div>
        </section>
      )}

      {/* Pris */}
      <section className="px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-center font-serif text-2xl">
            Vælg adgang
          </h2>

          {course.priceVariants.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Dette kursus er ikke tilgængeligt for køb i øjeblikket.
            </p>
          ) : !user ? (
            <div className="space-y-4">
              <div className="grid gap-3">
                {course.priceVariants.map((v) => (
                  <PriceCard key={v.id} variant={v} />
                ))}
              </div>
              <Button asChild size="lg" className="w-full rounded-xl">
                <Link href={`/login?next=/courses/${course.slug}`}>
                  Log ind for at købe
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {course.priceVariants.map((v) => (
                <div
                  key={v.id}
                  className={`rounded-2xl border bg-card p-5 ${
                    v.isHighlighted ? 'border-primary ring-1 ring-primary' : ''
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{v.label}</h3>
                        {v.isHighlighted && (
                          <Badge variant="default" className="text-xs">
                            Anbefalet
                          </Badge>
                        )}
                      </div>
                      {v.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {v.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-serif text-2xl">
                        {formatDKK(v.amountCents)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {intervalLabel(v.billingType, v.interval, v.intervalCount)}
                      </div>
                    </div>
                  </div>
                  <BuyButton priceVariantId={v.id} label="Køb adgang" />
                  {v.trialDays && v.trialDays > 0 ? (
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      {v.trialDays} dages gratis prøveperiode
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Pensum-preview */}
      {lessonCount > 0 && (
        <section className="bg-white px-4 py-16 sm:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-center font-serif text-2xl">
              Kursusindhold
            </h2>

            {course.modules.length > 0 ? (
              <div className="space-y-6">
                {course.modules.map((mod, i) => {
                  const modLessons = lessonsByModuleId.get(mod.id) ?? []
                  return (
                    <div
                      key={mod.id}
                      className="overflow-hidden rounded-xl border"
                    >
                      <div className="border-b bg-muted/20 px-5 py-4">
                        <h3 className="font-medium">
                          <span className="mr-2 text-muted-foreground">
                            {i + 1}.
                          </span>
                          {mod.title}
                        </h3>
                        {mod.description && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {mod.description}
                          </p>
                        )}
                      </div>
                      <ul className="divide-y">
                        {modLessons.map((lesson) => (
                          <PreviewLessonRow
                            key={lesson.id}
                            lesson={lesson}
                            courseSlug={course.slug}
                          />
                        ))}
                      </ul>
                    </div>
                  )
                })}
                {(lessonsByModuleId.get(null)?.length ?? 0) > 0 && (
                  <div className="overflow-hidden rounded-xl border">
                    <div className="border-b bg-muted/20 px-5 py-4">
                      <h3 className="font-medium">Øvrige lektioner</h3>
                    </div>
                    <ul className="divide-y">
                      {(lessonsByModuleId.get(null) ?? []).map((lesson) => (
                        <PreviewLessonRow
                          key={lesson.id}
                          lesson={lesson}
                          courseSlug={course.slug}
                        />
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <ul className="overflow-hidden rounded-xl border divide-y">
                {course.lessons.map((lesson) => (
                  <PreviewLessonRow
                    key={lesson.id}
                    lesson={lesson}
                    courseSlug={course.slug}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Hjælpekomponenter
// ──────────────────────────────────────────────────────────────────────────

type LessonWithContent = Awaited<
  ReturnType<typeof getCourse>
> extends infer T
  ? T extends { lessons: infer L }
    ? L extends Array<infer Item>
      ? Item
      : never
    : never
  : never

function LessonRow({
  lesson,
  completed,
  courseSlug,
}: {
  lesson: LessonWithContent
  completed: boolean
  courseSlug: string
}) {
  const Icon = mediaTypeIcon[lesson.contentUnit.mediaType] ?? PlayCircle
  const label = mediaTypeLabel[lesson.contentUnit.mediaType] ?? ''
  const duration = lesson.contentUnit.durationMinutes
  return (
    <Link
      href={`/content/${lesson.contentUnit.slug}?course=${courseSlug}`}
      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30"
    >
      {completed ? (
        <CheckCircle className="size-5 shrink-0 text-green-600" />
      ) : (
        <Icon className="size-5 shrink-0 text-muted-foreground" />
      )}
      <span
        className={`text-sm ${
          completed ? 'text-muted-foreground' : 'font-medium'
        }`}
      >
        {lesson.contentUnit.title}
      </span>
      <div className="ml-auto flex items-center gap-2">
        {duration ? (
          <span className="text-xs text-muted-foreground">{duration} min</span>
        ) : null}
        <Badge variant="secondary" className="text-xs">
          {label}
        </Badge>
      </div>
    </Link>
  )
}

function PreviewLessonRow({
  lesson,
  courseSlug,
}: {
  lesson: LessonWithContent
  courseSlug: string
}) {
  const Icon = mediaTypeIcon[lesson.contentUnit.mediaType] ?? PlayCircle
  const label = mediaTypeLabel[lesson.contentUnit.mediaType] ?? ''
  const duration = lesson.contentUnit.durationMinutes
  const isFree = lesson.isFreePreview

  const inner = (
    <>
      {isFree ? (
        <Icon className="size-5 shrink-0 text-primary" />
      ) : (
        <Lock className="size-5 shrink-0 text-muted-foreground" />
      )}
      <span
        className={`text-sm ${isFree ? 'font-medium' : 'text-muted-foreground'}`}
      >
        {lesson.contentUnit.title}
      </span>
      <div className="ml-auto flex items-center gap-2">
        {duration ? (
          <span className="text-xs text-muted-foreground">{duration} min</span>
        ) : null}
        {isFree ? (
          <Badge variant="default" className="text-xs">
            Gratis
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            {label}
          </Badge>
        )}
      </div>
    </>
  )

  if (isFree) {
    return (
      <li>
        <Link
          href={`/content/${lesson.contentUnit.slug}?course=${courseSlug}`}
          className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30"
        >
          {inner}
        </Link>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-3 px-5 py-3">{inner}</li>
  )
}

function PriceCard({
  variant,
}: {
  variant: {
    id: string
    label: string
    description: string | null
    amountCents: number
    billingType: string
    interval: string | null
    intervalCount: number
    isHighlighted: boolean
  }
}) {
  return (
    <div
      className={`rounded-2xl border bg-card p-5 ${
        variant.isHighlighted ? 'border-primary ring-1 ring-primary' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{variant.label}</h3>
            {variant.isHighlighted && (
              <Badge variant="default" className="text-xs">
                Anbefalet
              </Badge>
            )}
          </div>
          {variant.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {variant.description}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="font-serif text-2xl">
            {formatDKK(variant.amountCents)}
          </div>
          <div className="text-xs text-muted-foreground">
            {intervalLabel(
              variant.billingType,
              variant.interval,
              variant.intervalCount
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
