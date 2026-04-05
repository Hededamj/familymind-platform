import Link from 'next/link'
import { ArrowRight, Compass, Users } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { listRooms, userHasActiveJourney } from '@/lib/services/community.service'
import { Button } from '@/components/ui/button'

function getRoomIcon(iconName: string | null): LucideIcon {
  if (!iconName) return LucideIcons.MessageCircle
  return (LucideIcons as unknown as Record<string, LucideIcon>)[iconName] ?? LucideIcons.MessageCircle
}

export default async function CommunityPage() {
  const [user, rooms] = await Promise.all([
    getCurrentUser(),
    listRooms(),
  ])

  // Filter to only public rooms for the overview
  const publicRooms = rooms.filter((room) => room.isPublic)

  // Check if logged-in user has an active journey
  const hasActiveJourney = user ? await userHasActiveJourney(user.id) : false

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <header className="mb-10">
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground">
            Fællesskab
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground sm:text-lg">
            Et trygt rum for forældre. Stil spørgsmål, del erfaringer og find
            støtte fra andre, der forstår hverdagens udfordringer.
          </p>
        </header>

        {/* Room grid */}
        {publicRooms.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publicRooms.map((room) => {
              const Icon = getRoomIcon(room.icon)
              const postCount = room._count.posts

              return (
                <Link
                  key={room.id}
                  href={`/community/${room.slug}`}
                  className="group flex min-h-[44px] flex-col gap-3 rounded-2xl border border-border bg-background p-5 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <Icon className="size-5" />
                    </div>
                    <h2 className="font-serif text-lg text-foreground group-hover:text-accent-foreground line-clamp-1">
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
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-border py-16 text-center">
            <Compass className="mb-4 size-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Der er ingen fællesskabsrum endnu. Kom snart tilbage!
            </p>
          </div>
        )}

        {/* CTA section */}
        {!user && (
          <section className="mt-12 rounded-2xl border border-border bg-[var(--color-sand)] p-6 text-center sm:p-10">
            <Users className="mx-auto mb-4 size-10 text-muted-foreground" />
            <h2 className="font-serif text-xl sm:text-2xl text-foreground">
              Bliv en del af fællesskabet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
              Opret en gratis konto og deltag i samtalerne. Del dine erfaringer
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

        {user && !hasActiveJourney && (
          <section className="mt-12 rounded-2xl border border-border bg-[var(--color-sand)] p-6 text-center sm:p-10">
            <Compass className="mx-auto mb-4 size-10 text-muted-foreground" />
            <h2 className="font-serif text-xl sm:text-2xl text-foreground">
              Klar til næste skridt?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
              Start et forløb og få daglig vejledning, der passer til din
              families behov.
            </p>
            <Button asChild className="mt-6 min-h-[44px]">
              <Link href="/browse">
                Udforsk vores forløb
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </section>
        )}
      </div>
    </div>
  )
}
