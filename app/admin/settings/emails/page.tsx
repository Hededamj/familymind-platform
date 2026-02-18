import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EmailTemplateManager } from './_components/email-template-manager'

export default async function EmailTemplatesSettingsPage() {
  await requireAdmin()

  const templates = await prisma.emailTemplate.findMany({
    orderBy: { templateKey: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/settings"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            E-mail Skabeloner
          </h1>
          <p className="text-muted-foreground">
            Rediger emnelinjer, indhold og status for e-mail skabeloner
          </p>
        </div>
      </div>

      <Separator />

      <EmailTemplateManager templates={templates} />
    </div>
  )
}
