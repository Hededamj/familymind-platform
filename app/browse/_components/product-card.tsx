import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Package, Video, CreditCard } from 'lucide-react'

type Product = {
  id: string
  title: string
  description: string | null
  slug: string
  type: string
  priceAmountCents: number
  priceCurrency: string
  thumbnailUrl?: string | null
  coverImageUrl?: string | null
  courseLessons?: { id: string }[]
  bundleItems?: { id: string }[]
  modules?: { id: string }[]
}

const typeLabels: Record<string, string> = {
  COURSE: 'Kursus',
  SINGLE: 'Enkeltstående',
  BUNDLE: 'Pakke',
  SUBSCRIPTION: 'Abonnement',
}

const typeIcons: Record<string, typeof BookOpen> = {
  COURSE: Video,
  SINGLE: BookOpen,
  BUNDLE: Package,
  SUBSCRIPTION: CreditCard,
}

export function ProductCard({ product }: { product: Product }) {
  const price = new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: product.priceCurrency,
    minimumFractionDigits: 0,
  }).format(product.priceAmountCents / 100)

  const subtitle =
    product.type === 'COURSE'
      ? `${product.modules?.length || 0} moduler · ${product.courseLessons?.length || 0} lektioner`
      : product.type === 'BUNDLE'
        ? `${product.bundleItems?.length || 0} produkter`
        : null

  const href =
    product.type === 'SUBSCRIPTION'
      ? '/subscribe'
      : product.type === 'COURSE'
        ? `/courses/${product.slug}`
        : `/products/${product.slug}`

  const Icon = typeIcons[product.type] ?? BookOpen

  return (
    <Link
      href={href}
      className="card-hover group flex flex-col rounded-2xl border border-border bg-white"
    >
      {/* Thumbnail area */}
      {product.thumbnailUrl || product.coverImageUrl ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-t-2xl">
          <Image
            src={(product.thumbnailUrl || product.coverImageUrl)!}
            alt={product.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center rounded-t-2xl bg-sand">
          <Icon className="size-10 text-primary/30" />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <Badge
          variant="secondary"
          className="mb-2 w-fit rounded-full text-xs"
        >
          {typeLabels[product.type] ?? product.type}
        </Badge>

        <h3 className="font-serif text-lg group-hover:text-primary">
          {product.title}
        </h3>

        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        )}

        {product.description && (
          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className="text-lg font-semibold">
            {price}
            {product.type === 'SUBSCRIPTION' && (
              <span className="text-sm font-normal text-muted-foreground">/md</span>
            )}
          </span>
          <span className="text-sm font-medium text-primary">
            Se mere &rarr;
          </span>
        </div>
      </div>
    </Link>
  )
}
