import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Separator } from '@/components/ui/separator'
import { TagCreateForm } from './_components/tag-create-form'
import { TagList } from './_components/tag-list'

export default async function TagsPage() {
  await requireAdmin()

  const tags = await prisma.contentTag.findMany({
    include: { _count: { select: { contentUnits: true } } },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
        <p className="text-muted-foreground">
          Administrer tags til indhold paa platformen
        </p>
      </div>

      <TagCreateForm />

      <Separator />

      <TagList tags={tags} />
    </div>
  )
}
