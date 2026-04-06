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
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">
          {lessons.filter(l => completedLessonIds.has(l.id)).length}/{lessons.length}
        </span>
      </div>
      <div className="grid gap-2">
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
    </section>
  )
}
