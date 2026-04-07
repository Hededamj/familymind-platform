'use client'

import { useMemo, useState } from 'react'
import { ChapterSection } from './ChapterSection'

type MediaFilter = 'ALL' | 'VIDEO' | 'ARTIKLER' | 'LYD'

type LessonItem = {
  id: string
  slug: string
  title: string
  mediaType: string
  durationMinutes: number | null
  thumbnailUrl: string | null
}

type ChapterData = {
  id: string
  title: string
  lessons: LessonItem[]
}

interface CourseFilteredViewProps {
  chapters: ChapterData[]
  unassignedLessons: LessonItem[]
  unassignedTitle: string
  courseSlug: string
  savedLessonIds: string[]
  completedLessonIds: string[]
}

const FILTERS: { id: MediaFilter; label: string }[] = [
  { id: 'ALL', label: 'Alle' },
  { id: 'VIDEO', label: 'Video' },
  { id: 'ARTIKLER', label: 'Artikler' },
  { id: 'LYD', label: 'Lyd' },
]

function matchesFilter(lesson: LessonItem, filter: MediaFilter): boolean {
  if (filter === 'ALL') return true
  if (filter === 'VIDEO') return lesson.mediaType === 'VIDEO'
  if (filter === 'ARTIKLER') return lesson.mediaType === 'TEXT' || lesson.mediaType === 'PDF'
  if (filter === 'LYD') return lesson.mediaType === 'AUDIO'
  return true
}

function emptyLabel(filter: MediaFilter): string {
  if (filter === 'VIDEO') return 'videoer'
  if (filter === 'ARTIKLER') return 'artikler'
  if (filter === 'LYD') return 'lydlektioner'
  return 'lektioner'
}

export function CourseFilteredView({
  chapters,
  unassignedLessons,
  unassignedTitle,
  courseSlug,
  savedLessonIds,
  completedLessonIds,
}: CourseFilteredViewProps) {
  const [activeFilter, setActiveFilter] = useState<MediaFilter>('ALL')

  const savedSet = useMemo(() => new Set(savedLessonIds), [savedLessonIds])
  const completedSet = useMemo(() => new Set(completedLessonIds), [completedLessonIds])

  const filteredChapters = chapters
    .map((ch) => ({ ...ch, lessons: ch.lessons.filter((l) => matchesFilter(l, activeFilter)) }))
    .filter((ch) => ch.lessons.length > 0)

  const filteredUnassigned = unassignedLessons.filter((l) => matchesFilter(l, activeFilter))

  const hasResults = filteredChapters.length > 0 || filteredUnassigned.length > 0

  return (
    <>
      {/* Filter tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFilter(f.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors min-h-[44px] ${
              activeFilter === f.id
                ? 'bg-[var(--color-coral)] text-white'
                : 'bg-[var(--color-sand)] text-muted-foreground hover:bg-[var(--color-sand-dark)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {filteredChapters.map((ch) => (
          <ChapterSection
            key={ch.id}
            title={ch.title}
            lessons={ch.lessons}
            savedLessonIds={savedSet}
            completedLessonIds={completedSet}
            courseSlug={courseSlug}
          />
        ))}

        {filteredUnassigned.length > 0 && (
          <ChapterSection
            title={unassignedTitle}
            lessons={filteredUnassigned}
            savedLessonIds={savedSet}
            completedLessonIds={completedSet}
            courseSlug={courseSlug}
          />
        )}

        {!hasResults && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Ingen {emptyLabel(activeFilter)} i dette forløb
          </div>
        )}
      </div>
    </>
  )
}
