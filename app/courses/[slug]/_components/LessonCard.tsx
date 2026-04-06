'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Bookmark,
  PlayCircle,
  FileText,
  Headphones,
  Type,
  Check,
} from 'lucide-react'
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
  index?: number
}

const typeConfig: Record<string, { label: string; icon: typeof PlayCircle; gradient: string }> = {
  VIDEO: {
    label: 'Video',
    icon: PlayCircle,
    gradient: 'from-blue-100 to-blue-50',
  },
  PDF: {
    label: 'PDF',
    icon: FileText,
    gradient: 'from-rose-100 to-rose-50',
  },
  AUDIO: {
    label: 'Lyd',
    icon: Headphones,
    gradient: 'from-violet-100 to-violet-50',
  },
  TEXT: {
    label: 'Tekst',
    icon: Type,
    gradient: 'from-amber-100/80 to-amber-50',
  },
}

export function LessonCard({
  lesson,
  initialSaved,
  completed,
  courseSlug,
  index = 0,
}: LessonCardProps) {
  const [isSaved, setIsSaved] = useState(initialSaved)

  const config = typeConfig[lesson.mediaType] ?? typeConfig.TEXT
  const Icon = config.icon

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

  const hasThumb = lesson.thumbnailUrl && !lesson.thumbnailUrl.includes('\n')

  return (
    <Link
      href={`/content/${lesson.slug}?course=${courseSlug}`}
      className="group relative flex overflow-hidden rounded-2xl border border-border/40 bg-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Visual area — thumbnail or gradient with icon */}
      <div className="relative flex w-20 shrink-0 items-center justify-center sm:w-24">
        {hasThumb ? (
          <Image
            src={lesson.thumbnailUrl!.trim()}
            alt=""
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${config.gradient}`}
          >
            <Icon className="size-7 text-muted-foreground/40 transition-transform duration-200 group-hover:scale-110" />
          </div>
        )}

        {/* Completion overlay */}
        {completed && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-success)]/20">
            <div className="flex size-7 items-center justify-center rounded-full bg-[var(--color-success)] text-white shadow-sm">
              <Check className="size-4" strokeWidth={3} />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3.5 py-3 sm:px-4">
        <p className="line-clamp-2 text-[13px] font-medium leading-snug sm:text-sm">
          {lesson.title}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{config.label}</span>
          {lesson.durationMinutes != null && lesson.durationMinutes > 0 && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-xs text-muted-foreground">
                {lesson.durationMinutes} min
              </span>
            </>
          )}
          {completed && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-xs font-medium text-[var(--color-success)]">
                Gennemført
              </span>
            </>
          )}
        </div>
      </div>

      {/* Bookmark */}
      <button
        onClick={handleBookmark}
        aria-label={isSaved ? 'Fjern bogmærke' : 'Gem lektion'}
        className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center self-center"
      >
        <Bookmark
          className={`size-[18px] transition-all duration-200 ${
            isSaved
              ? 'fill-current text-[var(--color-coral)] scale-110'
              : 'text-muted-foreground/30 group-hover:text-muted-foreground/50'
          }`}
        />
      </button>
    </Link>
  )
}
