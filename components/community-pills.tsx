import Link from "next/link"
import { MessageCircle } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import * as LucideIcons from "lucide-react"

type Room = {
  id: string
  slug: string
  name: string
  icon: string | null
  _count: { posts: number }
}

function getRoomIcon(iconName: string | null): LucideIcon {
  if (!iconName) return MessageCircle
  const icons = LucideIcons as unknown as Record<string, LucideIcon>
  return icons[iconName] ?? MessageCircle
}

export function CommunityPills({ rooms }: { rooms: Room[] }) {
  if (rooms.length === 0) return null

  return (
    <section>
      <p className="text-sm font-medium text-muted-foreground">
        Fællesskab
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {rooms.map((room) => {
          const Icon = getRoomIcon(room.icon)
          return (
            <Link
              key={room.id}
              href={`/community/${room.slug}`}
              className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 hover:bg-[var(--color-sand)] hover:text-[var(--foreground)]"
            >
              <Icon className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-medium sm:text-sm">{room.name}</span>
              {room._count.posts > 0 && (
                <span className="rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                  {room._count.posts}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
