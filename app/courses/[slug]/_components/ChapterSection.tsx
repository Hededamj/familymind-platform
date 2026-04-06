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
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="font-serif text-lg">{title}</h2>
        <span
          className={`text-xs font-medium ${
            allDone ? 'text-[var(--color-success)]' : 'text-muted-foreground'
          }`}
        >
          {completedCount}/{lessons.length}
        </span>
      </div>

      {/* Lesson list */}
      <div className="grid gap-2.5">
        {lessons.map((lesson, i) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            initialSaved={savedLessonIds.has(lesson.id)}
            completed={completedLessonIds.has(lesson.id)}
            courseSlug={courseSlug}
            index={i}
          />
        ))}
      </div>
    </section>
  )
}
