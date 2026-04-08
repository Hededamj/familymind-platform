'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  grantAccessAction,
  revokeEntitlementAction,
  listCoursesAndBundlesAction,
} from '../../actions'
import type { getUserDetail } from '@/lib/services/admin-user.service'

type User = NonNullable<Awaited<ReturnType<typeof getUserDetail>>>

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

const sourceBadges: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  SUBSCRIPTION: { label: 'Abonnement', variant: 'default' },
  PURCHASE: { label: 'Køb', variant: 'secondary' },
  GIFT: { label: 'Gave', variant: 'outline' },
  B2B_LICENSE: { label: 'B2B', variant: 'secondary' },
}

const statusBadges: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Aktiv', className: 'bg-green-100 text-green-800' },
  EXPIRED: { label: 'Udløbet', className: 'bg-gray-100 text-gray-800' },
  CANCELLED: { label: 'Annulleret', className: 'bg-red-100 text-red-800' },
}

export function PurchasesTab({ user }: { user: User }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [grantDialogOpen, setGrantDialogOpen] = useState(false)
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; title: string } | null>(null)
  const [targetType, setTargetType] = useState<'course' | 'bundle'>('course')
  const [selectedId, setSelectedId] = useState('')
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([])
  const [bundles, setBundles] = useState<Array<{ id: string; title: string }>>([])

  useEffect(() => {
    if (grantDialogOpen && courses.length === 0 && bundles.length === 0) {
      listCoursesAndBundlesAction()
        .then(({ courses, bundles }) => {
          setCourses(courses)
          setBundles(bundles)
        })
        .catch(() => {
          toast.error('Kunne ikke hente kurser og bundler')
        })
    }
  }, [grantDialogOpen, courses.length, bundles.length])

  function handleGrant() {
    if (!selectedId) return
    startTransition(async () => {
      try {
        await grantAccessAction({
          userId: user.id,
          courseId: targetType === 'course' ? selectedId : undefined,
          bundleId: targetType === 'bundle' ? selectedId : undefined,
        })
        toast.success('Adgang givet')
        setGrantDialogOpen(false)
        setSelectedId('')
        router.refresh()
      } catch {
        toast.error('Kunne ikke give adgang')
      }
    })
  }

  function handleRevoke() {
    if (!revokeTarget) return
    startTransition(async () => {
      try {
        await revokeEntitlementAction(revokeTarget.id, user.id)
        toast.success('Adgang fjernet')
        setRevokeDialogOpen(false)
        setRevokeTarget(null)
        router.refresh()
      } catch {
        toast.error('Kunne ikke fjerne adgang')
      }
    })
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex justify-end">
        <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Giv adgang</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Giv adgang</DialogTitle>
              <DialogDescription>
                Tildel brugeren adgang til et kursus eller en bundel som gave.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Select value={targetType} onValueChange={(v) => { setTargetType(v as 'course' | 'bundle'); setSelectedId('') }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="course">Kursus</SelectItem>
                  <SelectItem value="bundle">Bundel</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder={targetType === 'course' ? 'Vælg kursus' : 'Vælg bundel'} />
                </SelectTrigger>
                <SelectContent>
                  {(targetType === 'course' ? courses : bundles).map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button onClick={handleGrant} disabled={!selectedId || isPending}>
                {isPending ? 'Giver adgang...' : 'Giv adgang'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adgange og abonnementer</CardTitle>
        </CardHeader>
        <CardContent>
          {user.entitlements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ingen køb eller abonnementer.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Indhold</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Kilde</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Startdato</TableHead>
                  <TableHead>Udløb</TableHead>
                  <TableHead className="w-24">Handling</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.entitlements.map((entitlement) => {
                  const source = sourceBadges[entitlement.source] ?? {
                    label: entitlement.source,
                    variant: 'outline' as const,
                  }
                  const statusCfg = statusBadges[entitlement.status] ?? {
                    label: entitlement.status,
                    className: '',
                  }
                  const title =
                    entitlement.course?.title ??
                    entitlement.bundle?.title ??
                    'Ukendt'
                  const itemType = entitlement.course ? 'Kursus' : entitlement.bundle ? 'Bundel' : '–'
                  return (
                    <TableRow key={entitlement.id}>
                      <TableCell className="font-medium">{title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{itemType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={source.variant}>{source.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusCfg.className}>
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(entitlement.createdAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {entitlement.expiresAt ? formatDate(entitlement.expiresAt) : '–'}
                      </TableCell>
                      <TableCell>
                        {entitlement.status === 'ACTIVE' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setRevokeTarget({ id: entitlement.id, title })
                              setRevokeDialogOpen(true)
                            }}
                            disabled={isPending}
                          >
                            Fjern
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fjern adgang</DialogTitle>
            <DialogDescription>
              Er du sikker på, at du vil fjerne adgangen til{' '}
              &ldquo;{revokeTarget?.title}&rdquo;? Handlingen kan ikke fortrydes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeDialogOpen(false)}
              disabled={isPending}
            >
              Annullér
            </Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={isPending}>
              {isPending ? 'Fjerner...' : 'Fjern adgang'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
