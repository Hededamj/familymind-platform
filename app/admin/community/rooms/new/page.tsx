import { requireAdmin } from '@/lib/auth'
import { RoomForm } from '../_components/room-form'

export default async function NewRoomPage() {
  await requireAdmin()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Opret nyt rum</h1>
        <p className="text-muted-foreground">
          Tilføj et nyt rum til community-sektionen
        </p>
      </div>
      <RoomForm mode="create" />
    </div>
  )
}
