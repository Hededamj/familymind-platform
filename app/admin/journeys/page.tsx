import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { listJourneys } from '@/lib/services/journey.service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus } from 'lucide-react'
import { JourneyActions } from './_components/journey-actions'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatAgeRange(min: number | null, max: number | null): string {
  if (min != null && max != null) return `${min}-${max} mdr.`
  if (min != null) return `${min}+ mdr.`
  if (max != null) return `0-${max} mdr.`
  return '-'
}

function countTotalDays(
  phases: { days: unknown[] }[]
): number {
  return phases.reduce((sum, phase) => sum + phase.days.length, 0)
}

export default async function JourneysListPage() {
  await requireAdmin()
  const journeys = await listJourneys()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rejser</h1>
          <p className="text-muted-foreground">
            Administrer rejser med faser, dage og indhold
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/journeys/new">
            <Plus className="mr-2 size-4" />
            Opret rejse
          </Link>
        </Button>
      </div>

      {journeys.length === 0 ? (
        <div className="rounded-md border p-12 text-center">
          <p className="text-muted-foreground">
            Ingen rejser endnu. Opret din foerste rejse for at komme i gang.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/journeys/new">
              <Plus className="mr-2 size-4" />
              Opret rejse
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titel</TableHead>
                <TableHead>Dage</TableHead>
                <TableHead>Aldersgruppe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Oprettet</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {journeys.map((journey) => (
                <TableRow key={journey.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{journey.title}</div>
                      <div className="text-sm text-muted-foreground">
                        /{journey.slug}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{countTotalDays(journey.phases)}</TableCell>
                  <TableCell>
                    {formatAgeRange(
                      journey.targetAgeMin,
                      journey.targetAgeMax
                    )}
                  </TableCell>
                  <TableCell>
                    {journey.isActive ? (
                      <Badge variant="default">Aktiv</Badge>
                    ) : (
                      <Badge variant="secondary">Inaktiv</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(journey.createdAt)}
                  </TableCell>
                  <TableCell>
                    <JourneyActions
                      journeyId={journey.id}
                      title={journey.title}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
