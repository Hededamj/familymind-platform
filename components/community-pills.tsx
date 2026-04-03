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
      <div className="mt-2 flex gap-2 overflow-x-auto pb-2 scrollbar-none md:flex-wrap md:overflow-visible">
        {rooms.map((room) => {
          const Icon = getRoomIcon(room.icon)
          return (
            <Link
              key={room.id}
              href={`/community/${room.slug}`}
              className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2.5 hover:bg-[var(--color-sand)] hover:text-[var(--foreground)]"
            >
              <Icon className="size-4 text-[var(--color-muted)]" />
              <span className="text-sm font-medium">{room.name}</span>
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
