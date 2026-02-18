import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { getContentUnitById } from '@/lib/services/content.service'
import { prisma } from '@/lib/prisma'
import { ContentForm } from '../../_components/content-form'

export default async function EditContentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const [contentUnit, tags] = await Promise.all([
    getContentUnitById(id),
    prisma.contentTag.findMany({ orderBy: { name: 'asc' } }),
  ])

  if (!contentUnit) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rediger indhold</h1>
        <p className="text-muted-foreground">
          Rediger "{contentUnit.title}"
        </p>
      </div>
      <ContentForm
        mode="edit"
        availableTags={tags}
        initialData={contentUnit}
      />
    </div>
  )
}
