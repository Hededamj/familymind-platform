import { prisma } from '@/lib/prisma'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export async function CourseStudentsTab({ courseId }: { courseId: string }) {
  const entitlements = await prisma.entitlement.findMany({
    where: { courseId },
    include: { user: true, priceVariant: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        I alt {entitlements.length} {entitlements.length === 1 ? 'studerende' : 'studerende'}
      </p>

      {entitlements.length === 0 ? (
        <div className="rounded-md border p-12 text-center text-muted-foreground">
          Ingen studerende endnu
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Navn</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Kilde</TableHead>
                <TableHead>Tilmeldt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entitlements.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.user.name ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{e.user.email}</TableCell>
                  <TableCell>{e.priceVariant?.label ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{e.source}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(e.createdAt)}
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
