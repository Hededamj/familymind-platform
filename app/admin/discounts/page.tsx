import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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
import { ClickableRow } from '@/components/admin/clickable-row'
import { DiscountActions } from './_components/discount-actions'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatValue(type: string, value: number): string {
  if (type === 'PERCENTAGE') {
    return `${value}%`
  }
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 0,
  }).format(value / 100)
}

export default async function DiscountListPage() {
  await requireAdmin()

  const discounts = await prisma.discountCode.findMany({
    include: {
      applicableCourse: { select: { id: true, title: true } },
      applicableBundle: { select: { id: true, title: true } },
    },
    orderBy: { validFrom: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rabatkoder</h1>
          <p className="text-muted-foreground">
            Administrer rabatkoder og tilbud
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/discounts/new">
            <Plus className="mr-2 size-4" />
            Opret rabatkode
          </Link>
        </Button>
      </div>

      {discounts.length === 0 ? (
        <div className="rounded-md border p-12 text-center">
          <p className="text-muted-foreground">
            Ingen rabatkoder oprettet endnu.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Værdi</TableHead>
                <TableHead>Brug</TableHead>
                <TableHead>Gyldig fra</TableHead>
                <TableHead>Gyldig til</TableHead>
                <TableHead>Gælder for</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stripe</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {discounts.map((discount) => (
                <ClickableRow key={discount.id} href={`/admin/discounts/${discount.id}/edit`}>
                  <TableCell className="font-mono font-medium">
                    {discount.code}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {discount.type === 'PERCENTAGE' ? 'Procent' : 'Fast beløb'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatValue(discount.type, discount.value)}</TableCell>
                  <TableCell>
                    {discount.currentUses}
                    {discount.maxUses !== null ? ` / ${discount.maxUses}` : ''}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(discount.validFrom)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {discount.validUntil ? formatDate(discount.validUntil) : 'Ingen udløbsdato'}
                  </TableCell>
                  <TableCell>
                    {discount.applicableCourse ? (
                      <Badge variant="secondary">
                        Kursus: {discount.applicableCourse.title}
                      </Badge>
                    ) : discount.applicableBundle ? (
                      <Badge variant="secondary">
                        Bundel: {discount.applicableBundle.title}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Alle</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {discount.isActive ? (
                      <Badge variant="default">Aktiv</Badge>
                    ) : (
                      <Badge variant="secondary">Inaktiv</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {discount.stripeCouponId ? (
                      <Badge variant="default" className="bg-green-600">Synket</Badge>
                    ) : (
                      <Badge variant="destructive">Ikke synket</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DiscountActions
                      discountId={discount.id}
                      code={discount.code}
                      isActive={discount.isActive}
                    />
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
