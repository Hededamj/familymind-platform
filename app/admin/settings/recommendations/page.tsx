import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { RecommendationsManager } from './_components/recommendations-manager'

export default async function RecommendationsSettingsPage() {
  await requireAdmin()

  const rules = await prisma.recommendationRule.findMany({
    orderBy: { priority: 'desc' },
  })

  const tags = await prisma.contentTag.findMany({
    orderBy: { name: 'asc' },
  })

  const journeys = await prisma.journey.findMany({
    where: { isActive: true },
    orderBy: { title: 'asc' },
    select: { id: true, title: true },
  })

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { title: 'asc' },
    select: { id: true, title: true },
  })

  const rooms = await prisma.communityRoom.findMany({
    where: { isArchived: false },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/settings"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Anbefalingsregler
          </h1>
          <p className="text-muted-foreground">
            Opsæt regler for automatiske anbefalinger baseret på tags og alder
          </p>
        </div>
      </div>

      <Separator />

      <RecommendationsManager
        rules={rules}
        tags={tags}
        journeys={journeys}
        products={products}
        rooms={rooms}
      />
    </div>
  )
}
