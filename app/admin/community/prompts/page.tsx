import { requireAdmin } from '@/lib/auth'
import { listRooms, listRoomPrompts } from '@/lib/services/community.service'
import { PromptQueueManager } from './_components/prompt-queue-manager'

export default async function PromptQueuePage() {
  await requireAdmin()

  const rooms = await listRooms()
  const roomsWithPrompts = await Promise.all(
    rooms.map(async (room) => {
      const prompts = await listRoomPrompts(room.id)
      return { ...room, prompts }
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Prompt-kø</h1>
        <p className="text-muted-foreground">
          Administrer diskussionsprompts til community-rum
        </p>
      </div>

      <PromptQueueManager rooms={roomsWithPrompts} />
    </div>
  )
}
