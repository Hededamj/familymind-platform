import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { listCohorts } from '@/lib/services/community.service'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ClickableRow } from '@/components/admin/clickable-row'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export default async function CohortsListPage() {
  await requireAdmin()
  const cohorts = await listCohorts()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kohorter</h1>
        <p className="text-muted-foreground">
          Administrer kohorter og se medlemstal for hver rejse
        </p>
      </div>

      {cohorts.length === 0 ? (
        <div className="rounded-md border p-12 text-center">
          <p className="text-muted-foreground">
            Ingen kohorter endnu. Kohorter oprettes automatisk, når brugere starter en rejse.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kohorte navn</TableHead>
                <TableHead>Rejse</TableHead>
                <TableHead>Medlemmer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Oprettet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cohorts.map((cohort) => (
                <ClickableRow key={cohort.id} href={"/admin/cohorts/" + cohort.id}>
                  <TableCell className="font-medium">
                    {cohort.name || 'Unavngivet kohorte'}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={"/admin/journeys/" + cohort.journey.id + "/edit"}
                      className="text-muted-foreground hover:underline"
                    >
                      {cohort.journey.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {cohort._count.members}/{cohort.maxMembers}
                  </TableCell>
                  <TableCell>
                    {cohort.isOpen ? (
                      <Badge variant="default">Åben</Badge>
                    ) : (
                      <Badge variant="secondary">Lukket</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(cohort.createdAt)}
                  </TableCell>
                </ClickableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
