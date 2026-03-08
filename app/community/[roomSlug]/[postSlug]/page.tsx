import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, MessageCircle, Users } from 'lucide-react'
import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth'
import { getPostBySlug, getUserCompletedJourneys } from '@/lib/services/community.service'
import { AlumniBadge } from '@/app/community/_components/alumni-badge'
import { RoomReplyForm } from '@/app/community/_components/room-reply-form'
import { PostJsonLd } from '@/app/community/_components/json-ld'
import { Breadcrumbs } from '@/app/community/_components/breadcrumbs'
import { getSiteSetting } from '@/lib/services/settings.service'
import { Button } from '@/components/ui/button'

type Props = {
  params: Promise<{ roomSlug: string; postSlug: string }>
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
  const { postSlug } = await params
  const post = await getPostBySlug(postSlug)
  if (!post || post.isHidden || !post.isPublic) return { title: 'Indlæg ikke fundet' }

  const title = post.body.slice(0, 60) + (post.body.length > 60 ? '…' : '')
  const description = post.body.slice(0, 160) + (post.body.length > 160 ? '…' : '')

  const minChars = parseInt(await getSiteSetting('community_index_min_chars') || '50')
  const minReplies = parseInt(await getSiteSetting('community_index_min_replies') || '1')
  const shouldIndex = post.body.length >= minChars && post._count.replies >= minReplies

  return {
    title,
    description,
    robots: shouldIndex ? undefined : { index: false },
  }
}

export default async function SinglePostPage({ params }: Props) {
  const { roomSlug, postSlug } = await params
  const post = await getPostBySlug(postSlug)

  if (!post || post.isHidden || !post.isPublic) {
    notFound()
  }

  const user = await getCurrentUser()
  const completedJourneys = user ? await getUserCompletedJourneys(user.id) : []
  const authorName = post.author.name?.split(' ')[0] ?? 'Anonym'
  const replyCount = post._count.replies

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-6 sm:px-8 sm:py-10">
      <PostJsonLd post={post} roomSlug={roomSlug} />
      <div className="mx-auto w-full max-w-3xl">
        <Breadcrumbs items={[
          { label: 'Fællesskab', href: '/community' },
          { label: post.room!.name, href: `/community/${post.room!.slug}` },
          { label: post.body.slice(0, 40) + (post.body.length > 40 ? '…' : '') },
        ]} />

        {/* Back link */}
        <Link
          href={`/community/${roomSlug}`}
          className="mb-6 inline-flex min-h-[44px] items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Tilbage til {post.room?.name ?? 'rum'}</span>
          <span className="sm:hidden">Tilbage</span>
        </Link>

        {/* Post */}
        <article className="mb-8">
          <header className="mb-4">
            <h1 className="font-serif text-2xl sm:text-3xl text-foreground">
              Indlæg
            </h1>
          </header>

          {/* Post body */}
          <div className="rounded-xl border border-border bg-background p-4 sm:p-6">
            {/* Author + timestamp */}
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{authorName}</span>
              {user && post.author.id === user.id && completedJourneys.map((uj) => (
                <AlumniBadge key={uj.journey.id} journeyTitle={uj.journey.title} size="sm" />
              ))}
              <span aria-hidden="true">&middot;</span>
              <time dateTime={post.createdAt.toISOString()}>
                {formatRelativeTime(post.createdAt)}
              </time>
            </div>

            {/* Body */}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 sm:text-base">
              {post.body}
            </p>

            {/* Reply count */}
            <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MessageCircle className="size-3.5" />
              {replyCount === 1 ? '1 svar' : `${replyCount} svar`}
            </div>
          </div>
        </article>

        {/* Replies */}
        {post.replies.length > 0 && (
          <section className="mb-8">
            <h2 className="font-serif mb-4 text-lg text-foreground">
              Svar
            </h2>
            <div className="flex flex-col gap-3">
              {post.replies.map((reply) => {
                const replyAuthor = reply.author.name?.split(' ')[0] ?? 'Anonym'
                return (
                  <div
                    key={reply.id}
                    className="rounded-xl border border-border bg-background p-4 sm:p-5"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {replyAuthor}
                      </span>
                      {user && reply.author.id === user.id && completedJourneys.map((uj) => (
                        <AlumniBadge key={uj.journey.id} journeyTitle={uj.journey.title} size="sm" />
                      ))}
                      <span aria-hidden="true">&middot;</span>
                      <time dateTime={reply.createdAt.toISOString()}>
                        {formatRelativeTime(reply.createdAt)}
                      </time>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                      {reply.body}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Reply form for logged-in users */}
        {user && post.slug && (
          <div className="mb-8">
            <RoomReplyForm postId={post.id} roomSlug={roomSlug} postSlug={post.slug} />
          </div>
        )}

        {/* CTA for anonymous users */}
        {!user && (
          <section className="mt-4 rounded-2xl border border-border bg-[var(--color-sand)] p-6 text-center sm:p-10">
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
