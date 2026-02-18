import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DiscountForm } from '../../_components/discount-form'

export default async function EditDiscountPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const [discount, products] = await Promise.all([
    prisma.discountCode.findUnique({ where: { id } }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    }),
  ])

  if (!discount) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rediger rabatkode</h1>
        <p className="text-muted-foreground">
          Rediger "{discount.code}"
        </p>
      </div>
      <DiscountForm mode="edit" initialData={discount} products={products} />
    </div>
  )
}
