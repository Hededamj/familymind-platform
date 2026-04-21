import { createElement } from 'react'
import Link from 'next/link'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { MessageCircle } from 'lucide-react'

type RoomCardProps = {
  room: {
    id: string
    slug: string
    name: string
    description: string | null
    icon: string | null
    _count: { posts: number }
  }
}

function getRoomIcon(iconName: string | null): LucideIcon {
  if (!iconName) return MessageCircle
  return (LucideIcons as unknown as Record<string, LucideIcon>)[iconName] ?? MessageCircle
}

export function RoomCard({ room }: RoomCardProps) {
  // createElement (not JSX) avoids react-hooks/static-components false-positive —
  // getRoomIcon returns a reference to a stable pre-existing component, not a new one.
  const iconElement = createElement(getRoomIcon(room.icon), { className: 'size-5' })
  const postCount = room._count.posts

  return (
    <Link
      href={`/community/${room.slug}`}
      className="group flex min-h-[44px] flex-col gap-3 rounded-2xl border border-border bg-background p-5 transition-colors active:scale-[0.98] hover:bg-accent"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          {iconElement}
        </div>
        <h2 className="font-serif text-lg text-foreground group-hover:text-accent-foreground">
          {room.name}
        </h2>
      </div>

      {room.description && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {room.description}
        </p>
      )}

      <div className="mt-auto pt-2 text-xs text-muted-foreground">
        {postCount === 1 ? '1 indlæg' : `${postCount} indlæg`}
      </div>
    </Link>
  )
}
