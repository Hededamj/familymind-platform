import { requireAuth } from '@/lib/auth'
import { getUserNotifications, markAllNotificationsAsRead } from '@/lib/services/engagement.service'
import { Bell } from 'lucide-react'

export default async function NotificationsPage() {
  const user = await requireAuth()
  const notifications = await getUserNotifications(user.id)

  // Mark all as read on page visit
  await markAllNotificationsAsRead(user.id)

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="mb-6 font-serif text-2xl">Notifikationer</h1>

        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-border p-10 text-center">
            <Bell className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">Ingen notifikationer endnu</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-xl border p-4 ${
                  n.readAt ? 'border-border bg-white' : 'border-primary/20 bg-primary/5'
                }`}
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleDateString('da-DK', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
