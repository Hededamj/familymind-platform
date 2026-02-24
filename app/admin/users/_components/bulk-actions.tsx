'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  addTagToUsersAction,
  removeTagFromUsersAction,
  bulkEmailAction,
} from '../actions'

type Tag = { id: string; name: string; color: string }

export function BulkActions({
  selectedUserIds,
  tags,
  onClearSelection,
}: {
  selectedUserIds: string[]
  tags: Tag[]
  onClearSelection: () => void
}) {
  const [addTagOpen, setAddTagOpen] = useState(false)
  const [removeTagOpen, setRemoveTagOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)

  const [selectedTagId, setSelectedTagId] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')

  const [isPending, startTransition] = useTransition()

  const handleAddTag = () => {
    if (!selectedTagId) return
    startTransition(async () => {
      try {
        await addTagToUsersAction(selectedTagId, selectedUserIds)
        toast.success('Tag tilføjet')
        setAddTagOpen(false)
        setSelectedTagId('')
        onClearSelection()
      } catch {
        toast.error('Kunne ikke tilføje tag')
      }
    })
  }

  const handleRemoveTag = () => {
    if (!selectedTagId) return
    startTransition(async () => {
      try {
        await removeTagFromUsersAction(selectedTagId, selectedUserIds)
        toast.success('Tag fjernet')
        setRemoveTagOpen(false)
        setSelectedTagId('')
        onClearSelection()
      } catch {
        toast.error('Kunne ikke fjerne tag')
      }
    })
  }

  const handleSendEmail = () => {
    if (!emailSubject.trim() || !emailBody.trim()) return
    startTransition(async () => {
      try {
        const result = await bulkEmailAction({
          userIds: selectedUserIds,
          subject: emailSubject,
          body: emailBody,
        })
        toast.success(`Email sendt til ${result.sent} brugere`)
        setEmailOpen(false)
        setEmailSubject('')
        setEmailBody('')
        onClearSelection()
      } catch {
        toast.error('Kunne ikke sende email')
      }
    })
  }

  return (
    <>
      {/* Sticky toolbar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background p-4 shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-sm font-medium">
            {selectedUserIds.length} brugere valgt
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTagId('')
                setAddTagOpen(true)
              }}
            >
              Tilføj tag
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTagId('')
                setRemoveTagOpen(true)
              }}
            >
              Fjern tag
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEmailSubject('')
                setEmailBody('')
                setEmailOpen(true)
              }}
            >
              Send e-mail
            </Button>
          </div>
        </div>
      </div>

      {/* Add Tag Dialog */}
      <Dialog open={addTagOpen} onOpenChange={setAddTagOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tilføj tag</DialogTitle>
            <DialogDescription>
              Tilføj et tag til {selectedUserIds.length} valgte brugere
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="add-tag-select">Vælg tag</Label>
            <select
              id="add-tag-select"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
              value={selectedTagId}
              onChange={(e) => setSelectedTagId(e.target.value)}
            >
              <option value="">Vælg et tag...</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddTagOpen(false)}
              disabled={isPending}
            >
              Annuller
            </Button>
            <Button
              onClick={handleAddTag}
              disabled={!selectedTagId || isPending}
            >
              {isPending ? 'Tilføjer...' : 'Tilføj'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Tag Dialog */}
      <Dialog open={removeTagOpen} onOpenChange={setRemoveTagOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fjern tag</DialogTitle>
            <DialogDescription>
              Fjern et tag fra {selectedUserIds.length} valgte brugere
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="remove-tag-select">Vælg tag</Label>
            <select
              id="remove-tag-select"
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring"
              value={selectedTagId}
              onChange={(e) => setSelectedTagId(e.target.value)}
            >
              <option value="">Vælg et tag...</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveTagOpen(false)}
              disabled={isPending}
            >
              Annuller
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveTag}
              disabled={!selectedTagId || isPending}
            >
              {isPending ? 'Fjerner...' : 'Fjern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send e-mail</DialogTitle>
            <DialogDescription>
              Send til {selectedUserIds.length} brugere
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-subject">Emne</Label>
              <Input
                id="email-subject"
                placeholder="Emne..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-body">Besked</Label>
              <Textarea
                id="email-body"
                placeholder="Skriv din besked..."
                rows={6}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEmailOpen(false)}
              disabled={isPending}
            >
              Annuller
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={
                !emailSubject.trim() || !emailBody.trim() || isPending
              }
            >
              {isPending
                ? 'Sender...'
                : `Send til ${selectedUserIds.length} brugere`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
