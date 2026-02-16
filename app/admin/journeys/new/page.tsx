import { requireAdmin } from '@/lib/auth'
import { JourneyForm } from '../_components/journey-form'

export default async function NewJourneyPage() {
  await requireAdmin()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Opret rejse</h1>
        <p className="text-muted-foreground">
          Tilfoej en ny rejse til platformen
        </p>
      </div>
      <JourneyForm mode="create" />
    </div>
  )
}
