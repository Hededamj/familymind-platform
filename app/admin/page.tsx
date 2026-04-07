import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Users,
  Package,
  Map,
  MessageSquare,
  UsersRound,
  FileText,
  Settings,
  ArrowRight,
} from 'lucide-react'

export default async function AdminPage() {
  await requireAdmin()

  const [
    userCount,
    productCount,
    journeyCount,
    cohortCount,
    roomCount,
    contentCount,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.course.count({ where: { isActive: true } }),
    prisma.journey.count({ where: { isActive: true } }),
    prisma.cohort.count(),
    prisma.communityRoom.count({ where: { isArchived: false } }),
    prisma.contentUnit.count(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
  ])

  const stats = [
    { label: 'Brugere', value: userCount, href: '/admin/users', icon: Users },
    { label: 'Kurser', value: productCount, href: '/admin/courses', icon: Package },
    { label: 'Forløb', value: journeyCount, href: '/admin/journeys', icon: Map },
    { label: 'Kohorter', value: cohortCount, href: '/admin/cohorts', icon: UsersRound },
    { label: 'Rum', value: roomCount, href: '/admin/community/rooms', icon: MessageSquare },
    { label: 'Lektioner', value: contentCount, href: '/admin/content', icon: FileText },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overblik</h1>
        <p className="text-muted-foreground">
          Velkommen til administrationspanelet
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.href} href={stat.href}>
            <Card className="transition-colors hover:border-primary/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Nyeste brugere</CardTitle>
            <Link
              href="/admin/users"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              Se alle <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen brugere endnu</p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <Link
                    key={user.id}
                    href={`/admin/users/${user.id}`}
                    className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {user.name ?? 'Unavngivet'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {user.createdAt.toLocaleDateString('da-DK')}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Genveje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { href: '/admin/courses/new', label: 'Nyt kursus' },
                { href: '/admin/journeys/new', label: 'Nyt forløb' },
                { href: '/admin/content/new', label: 'Ny lektion' },
                { href: '/admin/community/rooms/new', label: 'Nyt rum' },
                { href: '/admin/settings/branding', label: 'Branding' },
                { href: '/admin/settings', label: 'Indstillinger' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors hover:bg-muted/50"
                >
                  <Settings className="size-4 text-muted-foreground" />
                  {link.label}
                  <ArrowRight className="ml-auto size-3 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
