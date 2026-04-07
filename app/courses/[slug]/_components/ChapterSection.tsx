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

export function ChapterSection({
  title,
  lessons,
  savedLessonIds,
  completedLessonIds,
  courseSlug,
}: ChapterSectionProps) {
  if (lessons.length === 0) return null

  const completedCount = lessons.filter((l) => completedLessonIds.has(l.id)).length
  const allDone = completedCount === lessons.length

  return (
    <section>
      {/* Chapter heading */}
      <div className="mb-3 flex items-baseline gap-2 px-1">
        <h2 className="font-serif text-lg">{title}</h2>
        <span
          className={`text-xs font-medium ${
            allDone ? 'text-[var(--color-success)]' : 'text-muted-foreground'
          }`}
        >
          {completedCount}/{lessons.length}
        </span>
      </div>

      {/* Horizontal scroll row — 2 cards visible on mobile with peek of next */}
      <div className="-mx-4 sm:-mx-6">
        <div className="flex gap-3 overflow-x-auto scroll-smooth px-4 pb-2 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
      </div>
    </section>
  )
}
