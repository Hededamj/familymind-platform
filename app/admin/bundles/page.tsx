import Link from 'next/link'
import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import { listBundles } from '@/lib/services/bundle.service'
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
import { Layers, Plus } from 'lucide-react'
import { AdminSearch } from '@/components/admin/admin-search'
import { BundleActions } from './_components/bundle-actions'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export default async function BundlesListPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  await requireAdmin()
  const { search } = await searchParams
  const all = await listBundles()
  const q = (search ?? '').trim().toLowerCase()
  const bundles = q
    ? all.filter(
        (b) =>
          b.title.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q),
      )
    : all

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bundler</h1>
          <p className="text-muted-foreground">
            Administrer bundler, kurser og priser
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/bundles/new">
            <Plus className="mr-2 size-4" />
            Opret bundel
          </Link>
        </Button>
      </div>

      <Suspense fallback={null}>
        <AdminSearch placeholder="Søg efter bundler..." />
      </Suspense>

      {bundles.length === 0 ? (
        <div className="rounded-md border p-12 text-center">
          <p className="text-muted-foreground">
            {search
              ? `Ingen resultater for '${search}'`
              : 'Ingen bundler endnu. Opret din første bundel for at komme i gang.'}
          </p>
          {!search && (
            <Button asChild className="mt-4">
              <Link href="/admin/bundles/new">
                <Plus className="mr-2 size-4" />
                Opret bundel
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Cover</TableHead>
                <TableHead>Titel</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Antal kurser</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Oprettet</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {bundles.map((bundle) => (
                <TableRow key={bundle.id}>
                  <TableCell>
                    {bundle.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={bundle.coverImageUrl}
                        alt=""
                        className="size-12 rounded object-cover"
                      />
                    ) : (
                      <div className="flex size-12 items-center justify-center rounded bg-muted text-muted-foreground">
                        <Layers className="size-5" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{bundle.title}</TableCell>
                  <TableCell className="text-muted-foreground">{bundle.slug}</TableCell>
                  <TableCell>{bundle.courses.length}</TableCell>
                  <TableCell>
                    {bundle.isActive ? (
                      <Badge variant="default">Aktiv</Badge>
                    ) : (
                      <Badge variant="secondary">Inaktiv</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(bundle.createdAt)}
                  </TableCell>
                  <TableCell>
                    <BundleActions bundleId={bundle.id} title={bundle.title} />
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
