import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ContentForm } from '../_components/content-form'

export default async function NewContentPage() {
  await requireAdmin()
  const tags = await prisma.contentTag.findMany({
    orderBy: { name: 'asc' },
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Opret indhold</h1>
        <p className="text-muted-foreground">
          Tilføj nyt indhold til platformen
        </p>
      </div>
      <ContentForm mode="create" availableTags={tags} />
    </div>
  )
}
