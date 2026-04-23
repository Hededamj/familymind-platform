import { requireAdmin } from '@/lib/auth'
import { listUsers, getUserStats } from '@/lib/services/admin-user.service'
import { listTags } from '@/lib/services/tag.service'
import { prisma } from '@/lib/prisma'
import { UserStats } from './_components/user-stats'
import { UserFilters } from './_components/user-filters'
import { UserTable } from './_components/user-table'
import { Suspense } from 'react'

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  await requireAdmin()
  const params = await searchParams

  const page = params.page ? parseInt(params.page) : 1
  const pageSize = 25

  const [result, stats, tags, journeys] = await Promise.all([
    listUsers({
      search: params.search,
      role: params.role as 'USER' | 'ADMIN' | undefined,
      status: params.status as
        | 'TRIAL'
        | 'ACTIVE'
        | 'INACTIVE'
        | 'CHURNED'
        | undefined,
      tagId: params.tagId,
      journeyId: params.journeyId,
      page,
      pageSize,
    }),
    getUserStats(),
    listTags(),
    prisma.journey.findMany({
      where: { isActive: true },
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Brugere</h1>
        <p className="text-muted-foreground">
          Administrer brugere, tags og adgang
        </p>
      </div>
      <UserStats stats={stats} />
      <Suspense>
        <UserFilters tags={tags} journeys={journeys} />
      </Suspense>
      <Suspense>
        <UserTable
          users={result.users}
          total={result.total}
          page={result.page}
          totalPages={result.totalPages}
          tags={tags}
        />
      </Suspense>
    </div>
  )
}
