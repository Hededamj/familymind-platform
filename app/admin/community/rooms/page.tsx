import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { listRooms } from '@/lib/services/community.service'
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
import { RoomActions } from './_components/room-actions'

export default async function RoomListPage() {
  await requireAdmin()
  const rooms = await listRooms(true)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Community-rum</h1>
          <p className="text-muted-foreground">
            Administrer rum i community-sektionen
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/community/rooms/new">
            <Plus className="mr-2 size-4" />
            Opret nyt rum
          </Link>
        </Button>
      </div>

      {rooms.length === 0 ? (
        <div className="rounded-md border p-12 text-center">
          <p className="text-muted-foreground">
            Ingen rum oprettet endnu.
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Navn</TableHead>
                <TableHead className="hidden sm:table-cell">Slug</TableHead>
                <TableHead>Indlæg</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rækkefølge</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <ClickableRow
                  key={room.id}
                  href={`/admin/community/rooms/${room.id}/edit`}
                  className={room.isArchived ? 'opacity-50' : undefined}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {room.icon && (
                        <span className="text-muted-foreground">
                          {room.icon}
                        </span>
                      )}
                      {room.name}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {room.slug}
                  </TableCell>
                  <TableCell>{room._count.posts}</TableCell>
                  <TableCell>
                    {room.isArchived ? (
                      <Badge variant="secondary">Arkiveret</Badge>
                    ) : room.isPublic ? (
                      <Badge variant="default">Aktiv</Badge>
                    ) : (
                      <Badge variant="outline">Privat</Badge>
                    )}
                  </TableCell>
                  <TableCell>{room.sortOrder}</TableCell>
                  <TableCell>
                    <RoomActions
                      roomId={room.id}
                      name={room.name}
                      isArchived={room.isArchived}
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
