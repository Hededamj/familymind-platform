import { CommunityPills } from '@/components/community-pills'
import { listRooms } from '@/lib/services/community.service'

export async function CommunityPillsSection() {
  const rooms = await listRooms()
  return <CommunityPills rooms={rooms} />
}
