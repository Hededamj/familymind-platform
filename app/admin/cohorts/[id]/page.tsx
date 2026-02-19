import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { getCohortById, listCohortBans } from '@/lib/services/community.service'
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
import { MemberActions } from './_components/member-actions'
import { BanActions } from './_components/ban-actions'

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

  const [cohort, bans] = await Promise.all([
    getCohortById(id),
    listCohortBans(id),
  ])

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
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cohort.members.map((member: { id: string; joinedAt: Date; user: { id: string; name: string | null; email: string } }) => (
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
                    <TableCell>
                      <MemberActions
                        cohortId={cohort.id}
                        userId={member.user.id}
                        userName={member.user.name ?? member.user.email}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Banned users */}
      {bans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Udelukkede brugere</CardTitle>
            <CardDescription>
              Brugere der er udelukket fra denne kohorte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Navn</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Årsag</TableHead>
                  <TableHead>Udelukket</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bans.map((ban: { id: string; reason: string | null; bannedAt: Date; user: { id: string; name: string | null; email: string } }) => (
                  <TableRow key={ban.id}>
                    <TableCell className="font-medium">
                      {ban.user.name || 'Anonym'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ban.user.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ban.reason ?? '–'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(ban.bannedAt)}
                    </TableCell>
                    <TableCell>
                      <BanActions
                        cohortId={cohort.id}
                        userId={ban.user.id}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
