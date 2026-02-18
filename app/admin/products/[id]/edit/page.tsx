import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { getProductById } from '@/lib/services/product.service'
import { prisma } from '@/lib/prisma'
import { ProductForm } from '../../_components/product-form'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const [product, contentUnits, allProducts] = await Promise.all([
    getProductById(id),
    prisma.contentUnit.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        mediaType: true,
      },
      orderBy: { title: 'asc' },
    }),
    prisma.product.findMany({
      where: {
        type: { not: 'BUNDLE' },
        id: { not: id },
      },
      select: {
        id: true,
        title: true,
        type: true,
      },
      orderBy: { title: 'asc' },
    }),
  ])

  if (!product) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rediger produkt</h1>
        <p className="text-muted-foreground">
          Rediger "{product.title}"
        </p>
      </div>
      <ProductForm
        mode="edit"
        initialData={product}
        availableContentUnits={contentUnits}
        availableProducts={allProducts}
      />
    </div>
  )
}
