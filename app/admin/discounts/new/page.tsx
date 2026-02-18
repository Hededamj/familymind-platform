import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DiscountForm } from '../_components/discount-form'

export default async function NewDiscountPage() {
  await requireAdmin()

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, title: true },
    orderBy: { title: 'asc' },
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Opret rabatkode</h1>
        <p className="text-muted-foreground">
          Tilføj en ny rabatkode til platformen
        </p>
      </div>
      <DiscountForm mode="create" products={products} />
    </div>
  )
}
