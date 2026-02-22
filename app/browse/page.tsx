import { Suspense } from 'react'
import { listProducts } from '@/lib/services/product.service'
import { ProductCard } from './_components/product-card'
import { BrowseFilters } from './_components/browse-filters'
import { Compass } from 'lucide-react'

export const metadata = {
  title: 'Udforsk | FamilyMind',
  description: 'Gennemse kurser, enkeltindhold og pakker',
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const { type } = await searchParams
  const products = await listProducts({ isActive: true })

  const filteredProducts = type
    ? products.filter((p) => p.type === type)
    : products

  return (
    <div className="px-4 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl">
            Udforsk
          </h1>
          <p className="mt-2 text-muted-foreground">
            Find forløb, kurser og værktøjer der passer til din familie
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex justify-center">
          <Suspense fallback={null}>
            <BrowseFilters />
          </Suspense>
        </div>

        {/* Product grid */}
        {filteredProducts.length === 0 ? (
          <div className="mx-auto max-w-sm rounded-2xl border border-border p-12 text-center">
            <Compass className="mx-auto mb-4 size-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">Ingen produkter fundet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
