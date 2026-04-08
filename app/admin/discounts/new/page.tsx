import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ArrowLeft } from 'lucide-react'
import { DiscountForm } from '../_components/discount-form'

export default async function NewDiscountPage() {
  await requireAdmin()

  const [courses, bundles] = await Promise.all([
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
        <h1 className="text-3xl font-bold tracking-tight">Opret rabatkode</h1>
        <p className="text-muted-foreground">
          Opret en ny rabatkode der kan bruges ved checkout
        </p>
      </div>
      <DiscountForm mode="create" courses={courses} bundles={bundles} />
    </div>
  )
}
