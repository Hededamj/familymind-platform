'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Bookmark, PlayCircle } from 'lucide-react'
import { toggleBookmarkAction } from '@/app/actions/savedContent'

interface LessonCardProps {
  lesson: {
    id: string
    slug: string
    title: string
    mediaType: string
    durationMinutes: number | null
    thumbnailUrl: string | null
  }
  initialSaved: boolean
  courseSlug: string
}

const typeLabels: Record<string, string> = {
  VIDEO: 'Video',
  PDF: 'PDF',
  AUDIO: 'Lyd',
  TEXT: 'Tekst',
}

export function LessonCard({ lesson, initialSaved, courseSlug }: LessonCardProps) {
  const [isSaved, setIsSaved] = useState(initialSaved)

  const typeLabel = typeLabels[lesson.mediaType] ?? lesson.mediaType

  async function handleBookmark(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsSaved(!isSaved)
    await toggleBookmarkAction(lesson.id, isSaved)
  }

  return (
    <Link
      href={`/content/${lesson.slug}?course=${courseSlug}`}
      className="group relative flex w-[140px] shrink-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Thumbnail area — compact */}
      <div className="relative h-20 w-full bg-[var(--color-sand)]">
        {lesson.thumbnailUrl ? (
          <Image
            src={lesson.thumbnailUrl}
            alt={lesson.title}
            fill
            className="object-cover"
            sizes="140px"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <PlayCircle className="size-6 text-muted-foreground/30" />
          </div>
        )}

        {/* Bookmark button — subtle */}
        <button
          onClick={handleBookmark}
          aria-label={isSaved ? 'Fjern bogmærke' : 'Gem lektion'}
          className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-white/70 backdrop-blur-sm transition-colors hover:bg-white"
        >
          <Bookmark
            className={`size-3.5 ${isSaved ? 'fill-current text-[var(--color-coral)]' : 'text-muted-foreground/60'}`}
          />
        </button>
      </div>

      {/* Card body — tight */}
      <div className="flex flex-1 flex-col gap-1 px-2.5 py-2">
        <p className="line-clamp-2 text-xs font-medium leading-snug">{lesson.title}</p>

        <div className="mt-auto flex items-center gap-1.5 pt-1">
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {typeLabel}
          </span>
          {lesson.durationMinutes != null && lesson.durationMinutes > 0 && (
            <span className="text-[10px] text-muted-foreground">{lesson.durationMinutes} min</span>
          )}
        </div>
      </div>
    </Link>
  )
}
