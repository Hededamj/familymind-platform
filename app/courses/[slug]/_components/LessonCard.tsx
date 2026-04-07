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
}

const typeConfig: Record<
  string,
  {
    label: string
    icon: typeof PlayCircle
    bg: string
    badge: string
    illustration: string
  }
> = {
  VIDEO: {
    label: 'Video',
    icon: PlayCircle,
    bg: 'bg-gradient-to-br from-[#86A0A6] to-[#5D7B82]',
    badge: 'bg-white/90 text-[#5D7B82]',
    illustration: 'text-white/25',
  },
  PDF: {
    label: 'Artikel',
    icon: FileText,
    bg: 'bg-gradient-to-br from-[#E8715A] to-[#C44B3F]',
    badge: 'bg-white/90 text-[#C44B3F]',
    illustration: 'text-white/25',
  },
  AUDIO: {
    label: 'Lyd',
    icon: Headphones,
    bg: 'bg-gradient-to-br from-[#8B6EBF] to-[#6B4FA0]',
    badge: 'bg-white/90 text-[#6B4FA0]',
    illustration: 'text-white/25',
  },
  TEXT: {
    label: 'Læsning',
    icon: Type,
    bg: 'bg-gradient-to-br from-[#D4A853] to-[#A8842F]',
    badge: 'bg-white/90 text-[#A8842F]',
    illustration: 'text-white/25',
  },
}

export function LessonCard({
  lesson,
  initialSaved,
  completed,
  courseSlug,
}: LessonCardProps) {
  const [isSaved, setIsSaved] = useState(initialSaved)

  const config = typeConfig[lesson.mediaType] ?? typeConfig.TEXT
  const Icon = config.icon
  const hasThumb = lesson.thumbnailUrl && !lesson.thumbnailUrl.includes('\n')

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
      className="group relative flex aspect-[4/5] w-[160px] shrink-0 flex-col overflow-hidden rounded-2xl shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] sm:w-[180px]"
    >
      {/* Background — image or gradient */}
      {hasThumb ? (
        <>
          <Image
            src={lesson.thumbnailUrl!.trim()}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 160px, 180px"
          />
          {/* Dark overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />
        </>
      ) : (
        <div className={`absolute inset-0 ${config.bg}`}>
          {/* Decorative illustration */}
          <Icon
            className={`absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-[60%] ${config.illustration} transition-transform duration-500 group-hover:scale-110`}
            strokeWidth={1.25}
          />
        </div>
      )}

      {/* Top row: badge + bookmark */}
      <div className="relative z-10 flex items-start justify-between p-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.badge}`}
        >
          {config.label}
        </span>
        <button
          onClick={handleBookmark}
          aria-label={isSaved ? 'Fjern bogmærke' : 'Gem lektion'}
          className="-mr-1 -mt-1 flex size-9 items-center justify-center"
        >
          <Bookmark
            className={`size-[18px] transition-all duration-200 ${
              isSaved
                ? 'fill-current text-white drop-shadow-md'
                : 'text-white/80'
            }`}
          />
        </button>
      </div>

      {/* Spacer pushes title to bottom */}
      <div className="flex-1" />

      {/* Bottom: title + meta */}
      <div className="relative z-10 flex flex-col gap-1 p-3 pt-2">
        <p className="line-clamp-2 text-sm font-semibold leading-tight text-white drop-shadow-sm">
          {lesson.title}
        </p>
        <div className="flex items-center gap-1.5 text-[11px] text-white/85">
          {lesson.durationMinutes != null && lesson.durationMinutes > 0 && (
            <span>{lesson.durationMinutes} min</span>
          )}
          {completed && (
            <>
              {lesson.durationMinutes != null && lesson.durationMinutes > 0 && (
                <span className="text-white/40">·</span>
              )}
              <span className="inline-flex items-center gap-0.5 font-medium">
                <Check className="size-3" strokeWidth={3} />
                Set
              </span>
            </>
          )}
        </div>
      </div>

      {/* Completion indicator (top-left when no badge conflict) */}
      {completed && (
        <div className="absolute right-3 top-12 z-10 flex size-6 items-center justify-center rounded-full bg-[var(--color-success)] text-white shadow-md">
          <Check className="size-3.5" strokeWidth={3} />
        </div>
      )}
    </Link>
  )
}
