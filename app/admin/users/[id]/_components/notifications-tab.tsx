import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

const notificationTypeLabels: Record<string, string> = {
  WEEKLY_PLAN: 'Ugeplan',
  MIDWEEK_NUDGE: 'Midtvejs-nudge',
  REFLECTION: 'Refleksion',
  MILESTONE: 'Milepæl',
  REENGAGEMENT: 'Genaktivering',
  COMMUNITY_REPLY: 'Community-svar',
  SYSTEM: 'System',
}

export async function NotificationsTab({ userId }: { userId: string }) {
  const [notifications, notificationLogs] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.userNotificationLog.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: 50,
    }),
  ])

  return (
    <div className="space-y-6 pt-4">
      {/* In-app notifications */}
      <Card>
        <CardHeader>
          <CardTitle>In-app notifikationer</CardTitle>
          <CardDescription>
            De seneste 50 in-app notifikationer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ingen in-app notifikationer.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Titel</TableHead>
                  <TableHead>Dato</TableHead>
                  <TableHead>Læst</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {notificationTypeLabels[notification.type] ??
                          notification.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {notification.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(notification.createdAt)}
                    </TableCell>
                    <TableCell>
                      {notification.readAt ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          Ja
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-gray-100 text-gray-600"
                        >
                          Nej
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Email log */}
      <Card>
        <CardHeader>
          <CardTitle>E-mail log</CardTitle>
          <CardDescription>
            De seneste 50 sendte e-mails
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notificationLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ingen e-mails sendt.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Nøgle</TableHead>
                  <TableHead>Sendt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notificationLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline">{log.type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{log.key}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(log.sentAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
