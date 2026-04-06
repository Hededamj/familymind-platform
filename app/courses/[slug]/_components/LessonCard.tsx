'use client'

import { useState } from 'react'
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

const typeColors: Record<string, string> = {
  VIDEO: 'bg-blue-50 text-blue-600',
  PDF: 'bg-rose-50 text-rose-600',
  AUDIO: 'bg-violet-50 text-violet-600',
  TEXT: 'bg-amber-50 text-amber-700',
}

const typeIcons: Record<string, typeof PlayCircle> = {
  VIDEO: PlayCircle,
  PDF: FileText,
  AUDIO: Headphones,
  TEXT: Type,
}

export function LessonCard({ lesson, initialSaved, completed, courseSlug }: LessonCardProps) {
  const [isSaved, setIsSaved] = useState(initialSaved)

  const typeLabel = typeLabels[lesson.mediaType] ?? lesson.mediaType
  const colorClass = typeColors[lesson.mediaType] ?? 'bg-muted text-muted-foreground'
  const Icon = typeIcons[lesson.mediaType] ?? PlayCircle

  async function handleBookmark(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const prev = isSaved
    setIsSaved(!prev)
    try {
      await toggleBookmarkAction(lesson.id, prev)
    } catch {
      setIsSaved(prev)
    }
  }

  return (
    <Link
      href={`/content/${lesson.slug}?course=${courseSlug}`}
      className="group flex items-center gap-3 rounded-xl border border-border/50 bg-white p-3 transition-all hover:border-border hover:shadow-sm active:scale-[0.98]"
    >
      {/* Icon circle */}
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
        {completed ? (
          <CheckCircle2 className="size-5 text-emerald-500" />
        ) : (
          <Icon className="size-5" />
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm font-medium">{lesson.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{typeLabel}</span>
          {lesson.durationMinutes != null && lesson.durationMinutes > 0 && (
            <>
              <span>·</span>
              <span>{lesson.durationMinutes} min</span>
            </>
          )}
          {completed && (
            <>
              <span>·</span>
              <span className="text-emerald-600">Gennemført</span>
            </>
          )}
        </div>
      </div>

      {/* Bookmark */}
      <button
        onClick={handleBookmark}
        aria-label={isSaved ? 'Fjern bogmærke' : 'Gem lektion'}
        className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center"
      >
        <Bookmark
          className={`size-4 transition-colors ${isSaved ? 'fill-current text-[var(--color-coral)]' : 'text-muted-foreground/40 group-hover:text-muted-foreground'}`}
        />
      </button>
    </Link>
  )
}
