import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { getJourneyById } from '@/lib/services/journey.service'
import { listContentUnits } from '@/lib/services/content.service'
import { JourneyEditor } from './_components/journey-editor'

export default async function EditJourneyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const [journey, contentUnits] = await Promise.all([
    getJourneyById(id),
    listContentUnits({ published: true }),
  ])

  if (!journey) {
    notFound()
  }

  // Map content units to the shape needed by the editor
  const allContentUnits = contentUnits.map((unit) => ({
    id: unit.id,
    title: unit.title,
    slug: unit.slug,
    mediaType: unit.mediaType,
  }))

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rediger rejse</h1>
        <p className="text-muted-foreground">
          Rediger "{journey.title}"
        </p>
      </div>
      <JourneyEditor journey={journey} allContentUnits={allContentUnits} />
    </div>
  )
}
