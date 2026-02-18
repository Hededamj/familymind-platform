import { requireAdmin } from '@/lib/auth'
import { listReports, countPendingReports } from '@/lib/services/community.service'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReportList } from './_components/report-list'

export default async function ModerationPage() {
  await requireAdmin()

  const [pendingReports, allReports, pendingCount] = await Promise.all([
    listReports('PENDING'),
    listReports(),
    countPendingReports(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Moderering</h1>
        <p className="text-muted-foreground">
          Håndter rapporteret indhold og brugerklager
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Afventende
            {pendingCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">Alle</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <ReportList reports={pendingReports} />
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <ReportList reports={allReports} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
