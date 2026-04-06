import { LessonCard } from './LessonCard'

interface ChapterSectionProps {
  title: string
  lessons: Array<{
    id: string
    slug: string
    title: string
    mediaType: string
    durationMinutes: number | null
    thumbnailUrl: string | null
  }>
  savedLessonIds: Set<string>
  completedLessonIds: Set<string>
  courseSlug: string
}

export function ChapterSection({ title, lessons, savedLessonIds, completedLessonIds, courseSlug }: ChapterSectionProps) {
  if (lessons.length === 0) return null

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-foreground/80">{title}</h2>
      <div className="relative">
        <div className="-mx-4 flex gap-2.5 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              initialSaved={savedLessonIds.has(lesson.id)}
              completed={completedLessonIds.has(lesson.id)}
              courseSlug={courseSlug}
            />
          ))}
        </div>
        {/* Scroll affordance — gradient fade on right edge */}
        {lessons.length > 2 && (
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent" />
        )}
      </div>
    </section>
  )
}
