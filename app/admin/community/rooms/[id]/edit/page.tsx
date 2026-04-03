import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { RoomForm } from '../../_components/room-form'

export default async function EditRoomPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const validId = z.string().uuid().safeParse(id)
  if (!validId.success) {
    notFound()
  }

  const [room, allTags] = await Promise.all([
    prisma.communityRoom.findUnique({
      where: { id: validId.data },
      include: { tags: { select: { tagId: true } } },
    }),
    prisma.contentTag.findMany({ orderBy: { name: 'asc' } }),
  ])

  if (!room) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rediger rum</h1>
        <p className="text-muted-foreground">
          Rediger &quot;{room.name}&quot;
        </p>
      </div>
      <RoomForm
        mode="edit"
        initialData={{ ...room, tagIds: room.tags.map(t => t.tagId) }}
        allTags={allTags}
      />
    </div>
  )
}
