import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { listBundles } from '@/lib/services/bundle.service'
import { formatDKK } from '@/lib/format-currency'
import { Badge } from '@/components/ui/badge'

export default async function SubscribePage() {
  const bundles = await listBundles({ isActive: true })

  if (bundles.length === 0) {
    return (
      <div className="px-4 py-20 text-center">
        <h1 className="font-serif text-3xl">Ingen abonnementer tilgængelige</h1>
        <p className="mt-3 text-muted-foreground">
          Kig forbi senere — vi arbejder på det.
        </p>
        <Link
          href="/browse"
          className="mt-6 inline-block text-sm underline"
        >
          Udforsk kurser
        </Link>
      </div>
    )
  }

  if (bundles.length === 1) {
    redirect(`/bundles/${bundles[0].slug}`)
  }

  return (
    <div className="px-4 py-10 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 text-center">
          <h1 className="font-serif text-3xl sm:text-5xl">Vælg dit abonnement</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Få adgang til kurser og indhold med en bundel der passer din familie.
          </p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {bundles.map((bundle) => {
            const cheapest =
              bundle.priceVariants.length > 0
                ? Math.min(...bundle.priceVariants.map((v) => v.amountCents))
                : null
            return (
              <Link
                key={bundle.id}
                href={`/bundles/${bundle.slug}`}
                className="group overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  {bundle.coverImageUrl ? (
                    <Image
                      src={bundle.coverImageUrl}
                      alt={bundle.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      Intet billede
                    </div>
                  )}
                  <Badge className="absolute left-3 top-3">Bundel</Badge>
                </div>
                <div className="p-5">
                  <h3 className="mb-2 line-clamp-2 font-serif text-lg">
                    {bundle.title}
                  </h3>
                  {bundle.description && (
                    <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                      {bundle.description}
                    </p>
                  )}
                  <div className="text-sm font-medium">
                    {cheapest !== null ? `Fra ${formatDKK(cheapest)}` : 'Bliv medlem'}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
