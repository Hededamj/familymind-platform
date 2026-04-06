import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { listContentUnits } from '@/lib/services/content.service'
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
import { Plus, Video, Headphones, FileText, Type } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const BUNNY_CDN = process.env.BUNNY_CDN_HOSTNAME ?? ''

const mediaTypeIcons: Record<string, LucideIcon> = {
  VIDEO: Video,
  AUDIO: Headphones,
  PDF: FileText,
  TEXT: Type,
}
import { ContentActions } from './_components/content-actions'

const mediaTypeLabels: Record<string, string> = {
  VIDEO: 'Video',
  AUDIO: 'Lyd',
  PDF: 'PDF',
  TEXT: 'Tekst',
}

const accessLevelLabels: Record<string, string> = {
  FREE: 'Gratis',
  SUBSCRIPTION: 'Abonnement',
  PURCHASE: 'Køb',
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export default async function ContentListPage() {
  await requireAdmin()
  const contentUnits = await listContentUnits()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Indhold</h1>
          <p className="text-muted-foreground">
            Administrer alt indhold på platformen
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/content/new">
            <Plus className="mr-2 size-4" />
            Opret indhold
          </Link>
        </Button>
      </div>

      {contentUnits.length === 0 ? (
        <div className="rounded-md border p-12 text-center">
          <p className="text-muted-foreground">
            Intet indhold endnu. Opret dit første indhold for at komme i gang.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/content/new">
              <Plus className="mr-2 size-4" />
              Opret indhold
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]" />
                <TableHead>Titel</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Adgang</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Oprettet</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {contentUnits.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell>
                    {(() => {
                      // Video thumbnail: altid fra Bunny CDN via bunnyVideoId
                      const thumb = unit.bunnyVideoId && BUNNY_CDN
                        ? `https://${BUNNY_CDN}/${unit.bunnyVideoId}/thumbnail.jpg`
                        : unit.thumbnailUrl
                      if (thumb) {
                        return (
                          <img
                            src={thumb}
                            alt={unit.title}
                            className="h-10 w-16 rounded object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        )
                      }
                      const Icon = mediaTypeIcons[unit.mediaType] ?? FileText
                      return (
                        <div className="flex h-10 w-16 items-center justify-center rounded bg-muted">
                          <Icon className="size-4 text-muted-foreground" />
                        </div>
                      )
                    })()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {unit.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {mediaTypeLabels[unit.mediaType] ?? unit.mediaType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {accessLevelLabels[unit.accessLevel] ?? unit.accessLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {unit.publishedAt ? (
                      <Badge variant="default">Publiceret</Badge>
                    ) : (
                      <Badge variant="secondary">Kladde</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(unit.createdAt)}
                  </TableCell>
                  <TableCell>
                    <ContentActions
                      contentId={unit.id}
                      title={unit.title}
                      isPublished={!!unit.publishedAt}
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
