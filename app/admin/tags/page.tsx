import { requireAdmin } from '@/lib/auth'
import { listTags } from '@/lib/services/tag.service'
import { Separator } from '@/components/ui/separator'
import { TagCreateForm } from './_components/tag-create-form'
import { TagList } from './_components/tag-list'

export default async function TagsPage() {
  await requireAdmin()
  const tags = await listTags()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
        <p className="text-muted-foreground">
          Tags bruges på tværs af platformen — til at kategorisere indhold,
          community-rum, onboarding-spørgsmål og brugere.
        </p>
      </div>
      <TagCreateForm />
      <Separator />
      <TagList tags={tags} />
    </div>
  )
}
