import { z } from 'zod'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import {
  getUserDetail,
  getUserActivity,
  getUserNotifications,
} from '@/lib/services/admin-user.service'
import { listTags } from '@/lib/services/tag.service'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft } from 'lucide-react'
import { UserHeader } from './_components/user-header'
import { OverviewTab } from './_components/overview-tab'
import { PurchasesTab } from './_components/purchases-tab'
import { JourneysTab } from './_components/journeys-tab'
import { CommunityTab } from './_components/community-tab'
import { NotificationsTab } from './_components/notifications-tab'

export default async function UserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const userId = z.string().uuid().parse(id)
  const { tab } = await searchParams

  const [user, activity, allTags, notificationsData] = await Promise.all([
    getUserDetail(userId),
    getUserActivity(userId),
    listTags(),
    getUserNotifications(userId),
  ])

  if (!user) notFound()

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/users">
          <ArrowLeft className="mr-2 size-4" />
          Tilbage til brugere
        </Link>
      </Button>

      <UserHeader user={user} allTags={allTags} />

      <Tabs defaultValue={tab ?? 'overview'}>
        <TabsList>
          <TabsTrigger value="overview">Oversigt</TabsTrigger>
          <TabsTrigger value="purchases">Køb</TabsTrigger>
          <TabsTrigger value="journeys">Forløb</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="notifications">Notifikationer</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab user={user} activity={activity} />
        </TabsContent>
        <TabsContent value="purchases">
          <PurchasesTab user={user} />
        </TabsContent>
        <TabsContent value="journeys">
          <JourneysTab user={user} />
        </TabsContent>
        <TabsContent value="community">
          <CommunityTab user={user} />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab
            notifications={notificationsData.notifications}
            notificationLogs={notificationsData.notificationLogs}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
