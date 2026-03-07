import Link from 'next/link'
import { ArrowRight, Compass, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

type CommunityCTAProps = {
  variant: 'anonymous' | 'start-journey'
}

export function CommunityCTA({ variant }: CommunityCTAProps) {
  if (variant === 'anonymous') {
    return (
      <section className="rounded-2xl border border-border bg-[var(--color-sand)] p-6 text-center sm:p-10">
        <Users className="mx-auto mb-4 size-10 text-muted-foreground" />
        <h2 className="font-serif text-xl text-foreground sm:text-2xl">
          Bliv en del af fællesskabet
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
          Opret en gratis konto og deltag i samtalerne. Del dine erfaringer og
          lær af andre forældre.
        </p>
        <Button asChild className="mt-6 min-h-[44px] active:scale-[0.98]">
          <Link href="/signup">
            Opret gratis konto for at deltage
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-border bg-[var(--color-sand)] p-6 text-center sm:p-10">
      <Compass className="mx-auto mb-4 size-10 text-muted-foreground" />
      <h2 className="font-serif text-xl text-foreground sm:text-2xl">
        Klar til næste skridt?
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
        Start et forløb og få daglig vejledning, der passer til din families
        behov.
      </p>
      <Button asChild className="mt-6 min-h-[44px] active:scale-[0.98]">
        <Link href="/browse">
          Udforsk vores forløb
          <ArrowRight className="ml-2 size-4" />
        </Link>
      </Button>
    </section>
  )
}
