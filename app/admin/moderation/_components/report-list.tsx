'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Eye, EyeOff, Ban, X } from 'lucide-react'
import { resolveReportAction, hidePostAction, hideReplyAction, banUserAction } from '../../cohorts/actions'

type Report = {
  id: string
  reason: string
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED'
  createdAt: Date | string
  reporter: { id: string; name: string | null; email: string }
  post?: {
    id: string
    body: string
    isHidden: boolean
    author: { id: string; name: string | null }
    cohort: {
      id: string
      journey: { id: string; title: string; slug: string }
    } | null
  } | null
  reply?: {
    id: string
    body: string
    isHidden: boolean
    author: { id: string; name: string | null }
    post: {
      id: string
      cohort: {
        id: string
        journey: { id: string; title: string; slug: string }
      } | null
    }
  } | null
}

type ReportListProps = {
  reports: Report[]
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Afventende',
  REVIEWED: 'Behandlet',
  DISMISSED: 'Afvist',
}

const STATUS_VARIANTS: Record<string, 'destructive' | 'default' | 'secondary'> = {
  PENDING: 'destructive',
  REVIEWED: 'default',
  DISMISSED: 'secondary',
}

export function ReportList({ reports }: ReportListProps) {
  const [isPending, startTransition] = useTransition()

  if (reports.length === 0) {
    return (
      <div className="rounded-md border p-12 text-center">
        <p className="text-muted-foreground">Ingen rapporter at vise</p>
      </div>
    )
  }

  function handleDismiss(reportId: string) {
    startTransition(async () => {
      try {
        await resolveReportAction(reportId, 'dismiss')
        toast.success('Rapport afvist')
      } catch {
        toast.error('Kunne ikke afvise rapport')
      }
    })
  }

  function handleHide(reportId: string) {
    startTransition(async () => {
      try {
        await resolveReportAction(reportId, 'hide')
        toast.success('Indhold skjult og rapport behandlet')
      } catch {
        toast.error('Kunne ikke behandle rapport')
      }
    })
  }

  function handleBan(report: Report) {
    const content = report.post ?? report.reply
    if (!content) return

    const authorId = content.author.id
    const cohortId = report.post?.cohort?.id ?? report.reply?.post.cohort?.id
    if (!cohortId) return

    if (!confirm(`Er du sikker på, at du vil udelukke ${content.author.name ?? 'denne bruger'} fra kohorten?`)) return

    startTransition(async () => {
      try {
        await banUserAction(cohortId, authorId, `Rapporteret: ${report.reason}`)
        await resolveReportAction(report.id, 'hide')
        toast.success('Bruger udelukket og indhold skjult')
      } catch {
        toast.error('Kunne ikke udelukke bruger')
      }
    })
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => {
        const content = report.post ?? report.reply
        const journeyTitle =
          report.post?.cohort?.journey.title ??
          report.reply?.post.cohort?.journey.title ??
          'Åbent rum'
        const isPost = !!report.post

        return (
          <Card key={report.id}>
            <CardContent className="pt-5">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_VARIANTS[report.status]}>
                    {STATUS_LABELS[report.status]}
                  </Badge>
                  <Badge variant="outline">
                    {isPost ? 'Indlæg' : 'Svar'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {journeyTitle}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(report.createdAt).toLocaleDateString('da-DK')}
                </span>
              </div>

              {/* Reported content */}
              {content && (
                <div className="mb-3 rounded-md border bg-muted/30 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-medium">
                      {content.author.name ?? 'Anonym'}
                    </span>
                    {content.isHidden && (
                      <Badge variant="secondary" className="text-xs">
                        <EyeOff className="mr-1 size-3" />
                        Skjult
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {content.body.length > 300
                      ? content.body.slice(0, 300) + '…'
                      : content.body}
                  </p>
                </div>
              )}

              {/* Report reason */}
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Årsag (rapporteret af {report.reporter.name ?? report.reporter.email}):
                </p>
                <p className="text-sm">{report.reason}</p>
              </div>

              {/* Actions */}
              {report.status === 'PENDING' && (
                <div className="flex items-center gap-2 border-t pt-3">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1.5"
                    onClick={() => handleHide(report.id)}
                    disabled={isPending}
                  >
                    <EyeOff className="size-3.5" />
                    {isPending ? 'Skjuler...' : 'Skjul indhold'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => handleBan(report)}
                    disabled={isPending}
                  >
                    <Ban className="size-3.5" />
                    {isPending ? 'Udelukker...' : 'Udeluk bruger'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto gap-1.5"
                    onClick={() => handleDismiss(report.id)}
                    disabled={isPending}
                  >
                    <X className="size-3.5" />
                    {isPending ? 'Afviser...' : 'Afvis'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
