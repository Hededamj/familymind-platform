import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ArrowLeft } from 'lucide-react'
import { DiscountForm } from '../../_components/discount-form'

export default async function EditDiscountPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const [discount, courses, bundles] = await Promise.all([
    prisma.discountCode.findUnique({ where: { id } }),
    prisma.course.findMany({
      where: { isActive: true },
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    }),
    prisma.bundle.findMany({
      where: { isActive: true },
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    }),
  ])

  if (!discount) notFound()

  return (
    <div className="space-y-6">
      <Link
        href="/admin/discounts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Tilbage til rabatkoder
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rediger rabatkode</h1>
        <p className="text-muted-foreground">{discount.code}</p>
      </div>
      <DiscountForm
        mode="edit"
        initialData={{
          id: discount.id,
          code: discount.code,
          type: discount.type,
          value: discount.value,
          maxUses: discount.maxUses,
          validFrom: discount.validFrom,
          validUntil: discount.validUntil,
          applicableCourseId: discount.applicableCourseId,
          applicableBundleId: discount.applicableBundleId,
          isActive: discount.isActive,
          duration: discount.duration,
          durationInMonths: discount.durationInMonths,
        }}
        courses={courses}
        bundles={bundles}
      />
    </div>
  )
}
