import Link from 'next/link'
import { MessageCircle, Heart, Pin } from 'lucide-react'

type RoomPostCardProps = {
  post: {
    id: string
    slug: string
    body: string
    isPinned: boolean
    isFeatured: boolean
    createdAt: Date
    author: { name: string | null }
    _count: { replies: number; reactions: number }
  }
  roomSlug: string
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Lige nu'
  if (minutes < 60) return `${minutes} min siden`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'time' : 'timer'} siden`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} ${days === 1 ? 'dag' : 'dage'} siden`
  return date.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
}

export function RoomPostCard({ post, roomSlug }: RoomPostCardProps) {
  const firstName = post.author.name?.split(' ')[0] ?? 'Anonym'
  const replyCount = post._count.replies
  const reactionCount = post._count.reactions
  const bodyPreview =
    post.body.length > 200 ? post.body.slice(0, 200) + '...' : post.body

  return (
    <Link
      href={`/community/${roomSlug}/${post.slug}`}
      className="group flex min-h-[44px] flex-col gap-2 rounded-xl border border-border bg-background p-4 transition-colors active:scale-[0.98] hover:bg-accent sm:p-5"
    >
      {/* Post meta */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{firstName}</span>
        <span aria-hidden="true">&middot;</span>
        <time dateTime={post.createdAt.toISOString()}>
          {formatRelativeTime(post.createdAt)}
        </time>
        {post.isPinned && (
          <>
            <span aria-hidden="true">&middot;</span>
            <span className="inline-flex items-center gap-1 text-accent-foreground">
              <Pin className="size-3" aria-hidden="true" />
              Fastgjort
            </span>
          </>
        )}
        {post.isFeatured && !post.isPinned && (
          <>
            <span aria-hidden="true">&middot;</span>
            <span className="text-accent-foreground">Fremhævet</span>
          </>
        )}
      </div>

      {/* Body preview */}
      <p className="text-sm leading-relaxed text-foreground/90">
        {bodyPreview}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MessageCircle className="size-3.5" />
          {replyCount === 1 ? '1 svar' : `${replyCount} svar`}
        </span>
        {reactionCount > 0 && (
          <span className="flex items-center gap-1.5">
            <Heart className="size-3.5" />
            {reactionCount}
          </span>
        )}
      </div>
    </Link>
  )
}
