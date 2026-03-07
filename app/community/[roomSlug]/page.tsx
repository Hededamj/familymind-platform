import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, MessageCircle, Users } from 'lucide-react'
import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth'
import { getRoomBySlug, getRoomFeed } from '@/lib/services/community.service'
import { Button } from '@/components/ui/button'

type Props = {
  params: Promise<{ roomSlug: string }>
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { roomSlug } = await params
  const room = await getRoomBySlug(roomSlug)
  if (!room) return { title: 'Rum ikke fundet' }
  return {
    title: `${room.name} — Fællesskab`,
    description: room.description || `Deltag i ${room.name} hos FamilyMind`,
  }
}

export default async function RoomFeedPage({ params }: Props) {
  const { roomSlug } = await params
  const room = await getRoomBySlug(roomSlug)

  if (!room || room.isArchived) {
    notFound()
  }

  const user = await getCurrentUser()
  const feed = await getRoomFeed(room.id, undefined, user?.id)

  const postCount = room._count.posts

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        {/* Back link */}
        <Link
          href="/community"
          className="mb-6 inline-flex min-h-[44px] items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Tilbage til fællesskab</span>
          <span className="sm:hidden">Tilbage</span>
        </Link>

        {/* Room header */}
        <header className="mb-8">
          <h1 className="font-serif text-2xl sm:text-3xl text-foreground">
            {room.name}
          </h1>
          {room.description && (
            <p className="mt-2 text-base text-muted-foreground">
              {room.description}
            </p>
          )}
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">
            <MessageCircle className="size-3" />
            {postCount === 1 ? '1 indlæg' : `${postCount} indlæg`}
          </div>
        </header>

        {/* Post form placeholder for logged-in users */}
        {user && (
          <div className="mb-6">
            <Link
              href={`/community/${roomSlug}/nyt`}
              className="flex min-h-[44px] w-full items-center rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-accent"
            >
              Skriv et indlæg...
            </Link>
          </div>
        )}

        {/* Feed */}
        {feed.items.length > 0 ? (
          <div className="flex flex-col gap-3">
            {feed.items.map((post) => {
              const firstName = post.author.name?.split(' ')[0] ?? 'Anonym'
              const replyCount = post._count.replies
              const bodyPreview =
                post.body.length > 200
                  ? post.body.slice(0, 200) + '...'
                  : post.body

              return (
                <Link
                  key={post.id}
                  href={`/community/${roomSlug}/${post.slug}`}
                  className="group flex min-h-[44px] flex-col gap-2 rounded-xl border border-border bg-background p-4 transition-colors hover:bg-accent sm:p-5"
                >
                  {/* Post meta */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {firstName}
                    </span>
                    <span aria-hidden="true">&middot;</span>
                    <time dateTime={post.createdAt.toISOString()}>
                      {formatRelativeTime(post.createdAt)}
                    </time>
                    {post.isPinned && (
                      <>
                        <span aria-hidden="true">&middot;</span>
                        <span className="text-accent-foreground">Fastgjort</span>
                      </>
                    )}
                  </div>

                  {/* Body preview */}
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {bodyPreview}
                  </p>

                  {/* Reply count */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MessageCircle className="size-3.5" />
                    {replyCount === 1 ? '1 svar' : `${replyCount} svar`}
                  </div>
                </Link>
              )
            })}

            {/* Load more */}
            {feed.hasMore && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  className="min-h-[44px]"
                  asChild
                >
                  <Link href={`/community/${roomSlug}?cursor=${feed.nextCursor}`}>
                    Indlæs flere
                  </Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-border py-16 text-center">
            <MessageCircle className="mb-4 size-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {user
                ? 'Ingen indlæg endnu. Vær den første til at skrive!'
                : 'Ingen indlæg endnu. Opret en konto for at deltage.'}
            </p>
          </div>
        )}

        {/* CTA for anonymous users */}
        {!user && (
          <section className="mt-12 rounded-2xl border border-border bg-[var(--color-sand)] p-6 text-center sm:p-10">
            <Users className="mx-auto mb-4 size-10 text-muted-foreground" />
            <h2 className="font-serif text-xl sm:text-2xl text-foreground">
              Bliv en del af samtalen
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
              Opret en gratis konto og deltag i fællesskabet. Del dine erfaringer
              og lær af andre forældre.
            </p>
            <Button asChild className="mt-6 min-h-[44px]">
              <Link href="/signup">
                Opret gratis konto for at deltage
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </section>
        )}
      </div>
    </div>
  )
}
