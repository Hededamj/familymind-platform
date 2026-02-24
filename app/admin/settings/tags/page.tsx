import { requireAdmin } from '@/lib/auth'
import { listTags } from '@/lib/services/admin-tag.service'
import { Separator } from '@/components/ui/separator'
import { AdminTagForm } from './_components/admin-tag-form'
import { AdminTagList } from './_components/admin-tag-list'

export default async function AdminTagsPage() {
  await requireAdmin()
  const tags = await listTags()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bruger-tags</h1>
        <p className="text-muted-foreground">
          Opret og administrer tags til segmentering af brugere
        </p>
      </div>
      <AdminTagForm />
      <Separator />
      <AdminTagList tags={tags} />
    </div>
  )
}
