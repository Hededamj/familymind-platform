import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { getUserDetail } from '@/lib/services/admin-user.service'

type User = NonNullable<Awaited<ReturnType<typeof getUserDetail>>>

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function CommunityTab({ user }: { user: User }) {
  const hasCohorts = user.cohortMemberships.length > 0

  return (
    <div className="space-y-6 pt-4">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Indlæg</CardDescription>
            <CardTitle className="text-2xl">
              {user._count.discussionPosts}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Svar</CardDescription>
            <CardTitle className="text-2xl">
              {user._count.discussionReplies}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Cohort memberships */}
      <Card>
        <CardHeader>
          <CardTitle>Kohorter</CardTitle>
          <CardDescription>
            Kohorter brugeren er medlem af
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasCohorts ? (
            <p className="text-sm text-muted-foreground">
              Brugeren deltager ikke i nogen kohorter.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kohorte</TableHead>
                  <TableHead>Forløb</TableHead>
                  <TableHead>Tilmeldt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.cohortMemberships.map((membership) => (
                  <TableRow key={membership.id}>
                    <TableCell className="font-medium">
                      {membership.cohort.name ?? 'Unavngivet'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {membership.cohort.journey.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(membership.joinedAt)}
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
