import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Package } from 'lucide-react'

type BundleProduct = {
  id: string
  title: string
  description: string | null
  slug: string
  type: string
  priceAmountCents: number
  priceCurrency: string
  coverImageUrl?: string | null
  thumbnailUrl?: string | null
  bundleItems?: Array<{
    id: string
    includedProduct: {
      id: string
      title: string
      type: string
    } | null
    includedContentUnit?: {
      id: string
      title: string
    } | null
  }>
}

export function BundleCard({ product }: { product: BundleProduct }) {
  const price = new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: product.priceCurrency,
    minimumFractionDigits: 0,
  }).format(product.priceAmountCents / 100)

  return (
    <Link
      href={`/products/${product.slug}`}
      className="card-hover group flex flex-col overflow-hidden rounded-2xl border border-border bg-white sm:flex-row"
    >
      {/* Image */}
      {product.coverImageUrl || product.thumbnailUrl ? (
        <div className="relative aspect-[16/9] w-full sm:aspect-auto sm:w-2/5">
          <Image
            src={(product.coverImageUrl || product.thumbnailUrl)!}
            alt={product.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 40vw"
          />
        </div>
      ) : (
        <div className="flex aspect-[16/9] w-full items-center justify-center bg-sand sm:aspect-auto sm:w-2/5">
          <Package className="size-12 text-primary/30" />
        </div>
      )}

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col p-6">
        <Badge variant="secondary" className="mb-2 w-fit rounded-full text-xs">
          Pakke
        </Badge>
        <h3 className="font-serif text-xl line-clamp-2 group-hover:text-primary">
          {product.title}
        </h3>
        {product.description && (
          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}
        {product.bundleItems && product.bundleItems.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.bundleItems.map(item => {
              const label = item.includedProduct?.title ?? item.includedContentUnit?.title
              if (!label) return null
              return (
                <Badge key={item.id} variant="outline" className="rounded-full text-xs">
                  {label}
                </Badge>
              )
            })}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className="text-lg font-semibold">{price}</span>
          <span className="text-sm font-medium text-primary">Se mere &rarr;</span>
        </div>
      </div>
    </Link>
  )
}
