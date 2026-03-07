'use server'

import { requireAdmin } from '@/lib/auth'
import { upsertSiteSetting } from '@/lib/services/settings.service'
import { revalidatePath } from 'next/cache'
import { communitySettingsSchema } from '@/lib/validators/settings'

export async function updateCommunitySettingsAction(data: {
  community_notify_reply_inapp: string
  community_notify_reply_email: string
  community_digest_includes_rooms: string
  community_digest_frequency: string
  community_index_min_chars: string
  community_index_min_replies: string
  community_prompt_time: string
  community_prompt_author_id: string
}) {
  await requireAdmin()
  const valid = communitySettingsSchema.parse(data)

  await Promise.all([
    upsertSiteSetting('community_notify_reply_inapp', valid.community_notify_reply_inapp, 'In-app notifikation ved svar'),
    upsertSiteSetting('community_notify_reply_email', valid.community_notify_reply_email, 'Email notifikation ved svar'),
    upsertSiteSetting('community_digest_includes_rooms', valid.community_digest_includes_rooms, 'Inkludér åbne rum i digest'),
    upsertSiteSetting('community_digest_frequency', valid.community_digest_frequency, 'Digest-frekvens'),
    upsertSiteSetting('community_index_min_chars', valid.community_index_min_chars, 'Minimum tegn for indeksering'),
    upsertSiteSetting('community_index_min_replies', valid.community_index_min_replies, 'Minimum svar for indeksering'),
    upsertSiteSetting('community_prompt_time', valid.community_prompt_time, 'Tidspunkt for prompt-kø'),
    upsertSiteSetting('community_prompt_author_id', valid.community_prompt_author_id, 'Forfatter-ID til prompts'),
  ])

  revalidatePath('/admin/settings/community')
}
