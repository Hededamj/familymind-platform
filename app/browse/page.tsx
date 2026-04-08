import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatDKK } from '@/lib/format-currency'

type SearchParams = Promise<{ search?: string; type?: string }>

function cheapestPrice(
  variants: { amountCents: number }[]
): number | null {
  if (variants.length === 0) return null
  return Math.min(...variants.map((v) => v.amountCents))
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { search = '', type = 'all' } = await searchParams
  const searchTrimmed = search.trim()

  const courseWhere = {
    isActive: true,
    ...(searchTrimmed
      ? {
          OR: [
            { title: { contains: searchTrimmed, mode: 'insensitive' as const } },
            {
              description: {
                contains: searchTrimmed,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}),
  }

  const bundleWhere = {
    isActive: true,
    ...(searchTrimmed
      ? {
          OR: [
            { title: { contains: searchTrimmed, mode: 'insensitive' as const } },
            {
              description: {
                contains: searchTrimmed,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}),
  }

  const [courses, bundles] = await Promise.all([
    type === 'bundles'
      ? Promise.resolve([])
      : prisma.course.findMany({
          where: courseWhere,
          include: { priceVariants: { where: { isActive: true } } },
          orderBy: { createdAt: 'desc' },
        }),
    type === 'courses'
      ? Promise.resolve([])
      : prisma.bundle.findMany({
          where: bundleWhere,
          include: { priceVariants: { where: { isActive: true } } },
          orderBy: { createdAt: 'desc' },
        }),
  ])

  type CardItem = {
    kind: 'course' | 'bundle'
    id: string
    slug: string
    title: string
    description: string | null
    coverImageUrl: string | null
    cheapestCents: number | null
    createdAt: Date
  }

  const items: CardItem[] = [
    ...courses.map((c) => ({
      kind: 'course' as const,
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      coverImageUrl: c.coverImageUrl,
      cheapestCents: cheapestPrice(c.priceVariants),
      createdAt: c.createdAt,
    })),
    ...bundles.map((b) => ({
      kind: 'bundle' as const,
      id: b.id,
      slug: b.slug,
      title: b.title,
      description: b.description,
      coverImageUrl: b.coverImageUrl,
      cheapestCents: cheapestPrice(b.priceVariants),
      createdAt: b.createdAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return (
    <div className="px-4 py-10 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center">
          <h1 className="font-serif text-3xl sm:text-5xl">Udforsk</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Find kurser og bundler til familier — vælg det der passer jer bedst.
          </p>
        </header>

        <form
          method="GET"
          className="mx-auto mb-6 flex max-w-xl gap-2"
        >
          <Input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Søg efter kurser og bundler..."
            className="rounded-xl"
          />
          {type !== 'all' && <input type="hidden" name="type" value={type} />}
        </form>

        <div className="mb-8 flex justify-center gap-2">
          {(
            [
              { key: 'all', label: 'Alle' },
              { key: 'courses', label: 'Kurser' },
              { key: 'bundles', label: 'Bundler' },
            ] as const
          ).map((t) => {
            const params = new URLSearchParams()
            if (searchTrimmed) params.set('search', searchTrimmed)
            if (t.key !== 'all') params.set('type', t.key)
            const href = `/browse${params.toString() ? `?${params}` : ''}`
            const active = type === t.key
            return (
              <Link
                key={t.key}
                href={href}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card hover:bg-muted/30'
                }`}
              >
                {t.label}
              </Link>
            )
          })}
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
            Ingen indhold endnu
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const href =
                item.kind === 'course'
                  ? `/courses/${item.slug}`
                  : `/bundles/${item.slug}`
              return (
                <Link
                  key={`${item.kind}-${item.id}`}
                  href={href}
                  className="group overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {item.coverImageUrl ? (
                      <Image
                        src={item.coverImageUrl}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        Intet billede
                      </div>
                    )}
                    <Badge
                      className="absolute left-3 top-3"
                      variant={item.kind === 'bundle' ? 'default' : 'secondary'}
                    >
                      {item.kind === 'bundle' ? 'Bundel' : 'Kursus'}
                    </Badge>
                  </div>
                  <div className="p-5">
                    <h3 className="mb-2 line-clamp-2 font-serif text-lg">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                    <div className="text-sm font-medium">
                      {item.cheapestCents !== null
                        ? `Fra ${formatDKK(item.cheapestCents)}`
                        : 'Bliv medlem'}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
