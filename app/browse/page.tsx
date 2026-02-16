import { Suspense } from 'react'
import Link from 'next/link'
import { listProducts } from '@/lib/services/product.service'
import { ProductCard } from './_components/product-card'
import { BrowseFilters } from './_components/browse-filters'

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
    <div className="flex min-h-screen flex-col px-4 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        {/* Back link */}
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Tilbage
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Udforsk
          </h1>
          <p className="mt-2 text-muted-foreground">
            Find kurser, indhold og pakker til hele familien.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <Suspense fallback={null}>
            <BrowseFilters />
          </Suspense>
        </div>

        {/* Product grid */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-md border p-12 text-center">
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
