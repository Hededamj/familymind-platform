'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Bookmark, PlayCircle, FileText, Headphones, Type, CheckCircle2 } from 'lucide-react'
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
  completed: boolean
  courseSlug: string
}

const typeLabels: Record<string, string> = {
  VIDEO: 'Video',
  PDF: 'PDF',
  AUDIO: 'Lyd',
  TEXT: 'Tekst',
}

const fallbackIcons: Record<string, typeof PlayCircle> = {
  VIDEO: PlayCircle,
  PDF: FileText,
  AUDIO: Headphones,
  TEXT: Type,
}

export function LessonCard({ lesson, initialSaved, completed, courseSlug }: LessonCardProps) {
  const [isSaved, setIsSaved] = useState(initialSaved)

  const typeLabel = typeLabels[lesson.mediaType] ?? lesson.mediaType
  const FallbackIcon = fallbackIcons[lesson.mediaType] ?? PlayCircle

  async function handleBookmark(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const prev = isSaved
    setIsSaved(!prev)
    try {
      await toggleBookmarkAction(lesson.id, prev)
    } catch {
      setIsSaved(prev) // revert on error
    }
  }

  return (
    <Link
      href={`/content/${lesson.slug}?course=${courseSlug}`}
      className="group relative flex w-[140px] shrink-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Thumbnail area */}
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
            <FallbackIcon className="size-6 text-muted-foreground/30" />
          </div>
        )}

        {/* Completion indicator */}
        {completed && (
          <div className="absolute left-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white">
            <CheckCircle2 className="size-3.5" />
          </div>
        )}

        {/* Bookmark button — 44px tap area, small visual */}
        <button
          onClick={handleBookmark}
          aria-label={isSaved ? 'Fjern bogmærke' : 'Gem lektion'}
          className="absolute -right-1 -top-1 flex min-h-[44px] min-w-[44px] items-center justify-center"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-white/70 backdrop-blur-sm transition-all hover:bg-white">
            <Bookmark
              className={`size-3.5 transition-colors ${isSaved ? 'fill-current text-[var(--color-coral)]' : 'text-muted-foreground/60'}`}
            />
          </span>
        </button>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-1 px-2.5 py-2">
        <p className="line-clamp-2 text-xs font-medium leading-snug">{lesson.title}</p>

        <div className="mt-auto flex items-center gap-1.5 pt-1">
          <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {typeLabel}
          </span>
          {lesson.durationMinutes != null && lesson.durationMinutes > 0 && (
            <span className="text-[11px] text-muted-foreground">{lesson.durationMinutes} min</span>
          )}
        </div>
      </div>
    </Link>
  )
}
