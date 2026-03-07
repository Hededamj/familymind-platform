'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { updateCommunitySettingsAction } from '../actions'

type Props = {
  settings: {
    community_notify_reply_inapp: string
    community_notify_reply_email: string
    community_digest_includes_rooms: string
    community_digest_frequency: string
    community_index_min_chars: string
    community_index_min_replies: string
    community_prompt_time: string
    community_prompt_author_id: string
  }
}

export function CommunitySettingsForm({ settings }: Props) {
  const [formData, setFormData] = useState(settings)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      try {
        await updateCommunitySettingsAction(formData)
        toast.success('Fællesskabsindstillinger gemt')
      } catch {
        toast.error('Kunne ikke gemme indstillinger')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Notifikationer */}
      <Card>
        <CardHeader>
          <CardTitle>Notifikationer</CardTitle>
          <CardDescription>
            Standardindstillinger for brugernotifikationer i fællesskabet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify_inapp">In-app ved svar</Label>
              <p className="text-sm text-muted-foreground">
                Send in-app notifikation når nogen svarer på et opslag
              </p>
            </div>
            <Switch
              id="notify_inapp"
              checked={formData.community_notify_reply_inapp === 'true'}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  community_notify_reply_inapp: checked ? 'true' : 'false',
                }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify_email">Email ved svar</Label>
              <p className="text-sm text-muted-foreground">
                Send email notifikation når nogen svarer på et opslag
              </p>
            </div>
            <Switch
              id="notify_email"
              checked={formData.community_notify_reply_email === 'true'}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  community_notify_reply_email: checked ? 'true' : 'false',
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Digest */}
      <Card>
        <CardHeader>
          <CardTitle>Digest</CardTitle>
          <CardDescription>
            Indstillinger for fællesskabets digest-emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="digest_rooms">Inkludér åbne rum</Label>
              <p className="text-sm text-muted-foreground">
                Medtag indhold fra åbne rum i digest-emails
              </p>
            </div>
            <Switch
              id="digest_rooms"
              checked={formData.community_digest_includes_rooms === 'true'}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  community_digest_includes_rooms: checked ? 'true' : 'false',
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="digest_frequency">Frekvens</Label>
            <Select
              value={formData.community_digest_frequency || 'weekly'}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  community_digest_frequency: value,
                }))
              }
            >
              <SelectTrigger id="digest_frequency" className="w-full">
                <SelectValue placeholder="Vælg frekvens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daglig</SelectItem>
                <SelectItem value="weekly">Ugentlig</SelectItem>
                <SelectItem value="monthly">Månedlig</SelectItem>
                <SelectItem value="off">Fra</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Indeksering */}
      <Card>
        <CardHeader>
          <CardTitle>Indeksering</CardTitle>
          <CardDescription>
            Minimumskrav for at opslag indekseres af søgemaskiner
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="min_chars">Minimum tegn</Label>
              <Input
                id="min_chars"
                type="number"
                min={0}
                max={10000}
                value={formData.community_index_min_chars || '50'}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    community_index_min_chars: e.target.value,
                  }))
                }
              />
              <p className="text-sm text-muted-foreground">
                Minimum antal tegn i opslaget for indeksering
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_replies">Minimum svar</Label>
              <Input
                id="min_replies"
                type="number"
                min={0}
                max={100}
                value={formData.community_index_min_replies || '1'}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    community_index_min_replies: e.target.value,
                  }))
                }
              />
              <p className="text-sm text-muted-foreground">
                Minimum antal svar for indeksering
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prompt-kø */}
      <Card>
        <CardHeader>
          <CardTitle>Prompt-kø</CardTitle>
          <CardDescription>
            Indstillinger for automatisk publicering af diskussionsprompts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prompt_time">Tidspunkt</Label>
              <Input
                id="prompt_time"
                type="time"
                value={formData.community_prompt_time || '08:00'}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    community_prompt_time: e.target.value,
                  }))
                }
              />
              <p className="text-sm text-muted-foreground">
                Hvornår prompts publiceres (HH:mm)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt_author">Forfatter-ID</Label>
              <Input
                id="prompt_author"
                value={formData.community_prompt_author_id || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    community_prompt_author_id: e.target.value,
                  }))
                }
                placeholder="Tom = første admin"
              />
              <p className="text-sm text-muted-foreground">
                Bruger-ID der står som forfatter (tom for første admin)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? 'Gemmer...' : 'Gem indstillinger'}
      </Button>
    </div>
  )
}
