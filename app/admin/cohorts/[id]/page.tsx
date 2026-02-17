import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { getCohortById } from '@/lib/services/community.service'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { CohortToggle } from '../_components/cohort-toggle'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default async function CohortDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const cohort = await getCohortById(id)

  if (!cohort) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/cohorts">
            <ArrowLeft className="mr-2 size-4" />
            Tilbage
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {cohort.name || 'Unavngivet kohorte'}
          </h1>
          <p className="text-muted-foreground">
            Rejse: {cohort.journey.title}
          </p>
        </div>
        <CohortToggle cohortId={cohort.id} isOpen={cohort.isOpen} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Medlemmer</CardDescription>
            <CardTitle className="text-2xl">
              {cohort._count.members}/{cohort.maxMembers}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status</CardDescription>
            <CardTitle>
              {cohort.isOpen ? (
                <Badge variant="default">Åben</Badge>
              ) : (
                <Badge variant="secondary">Lukket</Badge>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Oprettet</CardDescription>
            <CardTitle className="text-lg">
              {formatDate(cohort.createdAt)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medlemmer</CardTitle>
          <CardDescription>
            Alle brugere i denne kohorte
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cohort.members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ingen medlemmer endnu.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Navn</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Tilmeldt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cohort.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.user.name || 'Anonym'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.user.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(member.joinedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
