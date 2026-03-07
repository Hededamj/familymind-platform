import { requireAdmin } from '@/lib/auth'
import { getSiteSettings } from '@/lib/services/settings.service'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CommunitySettingsForm } from './_components/community-settings-form'

const COMMUNITY_KEYS = [
  'community_notify_reply_inapp',
  'community_notify_reply_email',
  'community_digest_includes_rooms',
  'community_digest_frequency',
  'community_index_min_chars',
  'community_index_min_replies',
  'community_prompt_time',
  'community_prompt_author_id',
] as const

export default async function CommunitySettingsPage() {
  await requireAdmin()

  const settings = await getSiteSettings([...COMMUNITY_KEYS])

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
            Fællesskabsindstillinger
          </h1>
          <p className="text-muted-foreground">
            Konfigurer notifikationer, digest, indeksering og prompt-kø
          </p>
        </div>
      </div>

      <Separator />

      <CommunitySettingsForm settings={settings} />
    </div>
  )
}
