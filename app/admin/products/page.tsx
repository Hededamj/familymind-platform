import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { listProducts } from '@/lib/services/product.service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus } from 'lucide-react'
import { ProductActions } from './_components/product-actions'

const productTypeLabels: Record<string, string> = {
  SUBSCRIPTION: 'Abonnement',
  COURSE: 'Kursus',
  SINGLE: 'Enkeltstaaende',
  BUNDLE: 'Pakke',
}

const productTypeVariants: Record<
  string,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  SUBSCRIPTION: 'default',
  COURSE: 'secondary',
  SINGLE: 'outline',
  BUNDLE: 'default',
}

function formatPrice(amountCents: number, currency: string): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amountCents / 100)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

type ProductType = 'SUBSCRIPTION' | 'COURSE' | 'SINGLE' | 'BUNDLE'

function ProductTable({
  products,
}: {
  products: Awaited<ReturnType<typeof listProducts>>
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-md border p-12 text-center">
        <p className="text-muted-foreground">
          Ingen produkter fundet i denne kategori.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titel</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Pris</TableHead>
            <TableHead>Stripe</TableHead>
            <TableHead>Aktiv</TableHead>
            <TableHead>Oprettet</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">
                <div>
                  <div>{product.title}</div>
                  <div className="text-sm text-muted-foreground">
                    /{product.slug}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={productTypeVariants[product.type] ?? 'secondary'}
                >
                  {productTypeLabels[product.type] ?? product.type}
                </Badge>
              </TableCell>
              <TableCell>
                {formatPrice(product.priceAmountCents, product.priceCurrency)}
              </TableCell>
              <TableCell>
                {product.stripeProductId ? (
                  <Badge variant="default">Synkroniseret</Badge>
                ) : (
                  <Badge variant="outline">Ikke synkroniseret</Badge>
                )}
              </TableCell>
              <TableCell>
                {product.isActive ? (
                  <Badge variant="default">Ja</Badge>
                ) : (
                  <Badge variant="secondary">Nej</Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(product.createdAt)}
              </TableCell>
              <TableCell>
                <ProductActions
                  productId={product.id}
                  title={product.title}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default async function ProductListPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  await requireAdmin()
  const { type } = await searchParams
  const products = await listProducts()

  const filteredProducts = type
    ? products.filter((p) => p.type === type)
    : products

  const productTypes: Array<{ value: string; label: string }> = [
    { value: '', label: 'Alle' },
    { value: 'SUBSCRIPTION', label: 'Abonnement' },
    { value: 'COURSE', label: 'Kursus' },
    { value: 'SINGLE', label: 'Enkeltstaaende' },
    { value: 'BUNDLE', label: 'Pakke' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produkter</h1>
          <p className="text-muted-foreground">
            Administrer produkter, kurser og pakker
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 size-4" />
            Opret produkt
          </Link>
        </Button>
      </div>

      <Tabs defaultValue={type ?? ''}>
        <TabsList>
          {productTypes.map((pt) => (
            <TabsTrigger key={pt.value} value={pt.value} asChild>
              <Link
                href={
                  pt.value
                    ? `/admin/products?type=${pt.value}`
                    : '/admin/products'
                }
              >
                {pt.label}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
        {/* All tab */}
        <TabsContent value="">
          <ProductTable products={products} />
        </TabsContent>
        {/* Filtered tabs */}
        {productTypes
          .filter((pt) => pt.value !== '')
          .map((pt) => (
            <TabsContent key={pt.value} value={pt.value}>
              <ProductTable
                products={products.filter((p) => p.type === pt.value)}
              />
            </TabsContent>
          ))}
      </Tabs>
    </div>
  )
}
