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
  courseSlug: string
}

export function ChapterSection({ title, lessons, savedLessonIds, courseSlug }: ChapterSectionProps) {
  if (lessons.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="font-medium text-base">{title}</h2>
      <div className="flex gap-3 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {lessons.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            initialSaved={savedLessonIds.has(lesson.id)}
            courseSlug={courseSlug}
          />
        ))}
      </div>
    </section>
  )
}
