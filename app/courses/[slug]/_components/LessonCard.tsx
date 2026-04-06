'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Bookmark, PlayCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
      className="relative flex w-[160px] shrink-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm"
    >
      {/* Thumbnail area */}
      <div className="relative aspect-video w-full bg-[var(--color-sand)]">
        {lesson.thumbnailUrl ? (
          <Image
            src={lesson.thumbnailUrl}
            alt={lesson.title}
            fill
            className="object-cover"
            sizes="160px"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[var(--color-sand)]">
            <PlayCircle className="size-8 text-muted-foreground/40" />
          </div>
        )}

        {/* Bookmark button */}
        <button
          onClick={handleBookmark}
          aria-label={isSaved ? 'Fjern bogmaerke' : 'Gem lektion'}
          className="absolute right-1 top-1 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/80 backdrop-blur-sm"
        >
          <Bookmark
            className={`size-5 ${isSaved ? 'fill-current text-[var(--color-coral)]' : 'text-muted-foreground'}`}
          />
        </button>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{lesson.title}</p>

        <div className="mt-auto flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {typeLabel}
          </Badge>
          {lesson.durationMinutes && (
            <span className="text-xs text-muted-foreground">{lesson.durationMinutes} min</span>
          )}
        </div>
      </div>
    </Link>
  )
}
