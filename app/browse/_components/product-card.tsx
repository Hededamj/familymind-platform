import Link from 'next/link'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type Product = {
  id: string
  title: string
  description: string | null
  slug: string
  type: string
  priceAmountCents: number
  priceCurrency: string
  courseLessons?: { id: string }[]
  bundleItems?: { id: string }[]
}

const typeLabels: Record<string, string> = {
  COURSE: 'Kursus',
  SINGLE: 'Enkeltstående',
  BUNDLE: 'Pakke',
  SUBSCRIPTION: 'Abonnement',
}

const typeVariants: Record<
  string,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  SUBSCRIPTION: 'default',
  COURSE: 'secondary',
  SINGLE: 'outline',
  BUNDLE: 'default',
}

export function ProductCard({ product }: { product: Product }) {
  const price = new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: product.priceCurrency,
    minimumFractionDigits: 0,
  }).format(product.priceAmountCents / 100)

  const subtitle =
    product.type === 'COURSE'
      ? `${product.courseLessons?.length || 0} lektioner`
      : product.type === 'BUNDLE'
        ? `${product.bundleItems?.length || 0} produkter`
        : null

  const href =
    product.type === 'SUBSCRIPTION'
      ? '/subscribe'
      : `/products/${product.slug}`

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <Badge
          variant={typeVariants[product.type] ?? 'secondary'}
          className="w-fit"
        >
          {typeLabels[product.type] ?? product.type}
        </Badge>
        <h3 className="text-lg font-semibold">{product.title}</h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {product.description}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <span className="text-lg font-bold">
          {price}
          {product.type === 'SUBSCRIPTION' && (
            <span className="text-sm font-normal">/md</span>
          )}
        </span>
        <Button asChild size="sm">
          <Link href={href}>Se mere</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
