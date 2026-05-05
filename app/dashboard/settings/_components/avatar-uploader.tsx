'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type Props = {
  initialUrl: string | null
  initials: string
}

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
const MAX_BYTES = 5 * 1024 * 1024

export function AvatarUploader({ initialUrl, initials }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState<string | null>(initialUrl)
  const [busy, setBusy] = useState<'upload' | 'remove' | null>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Vælg et billede')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('Billedet er for stort (max 5 MB)')
      return
    }
    setBusy('upload')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/avatar', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Upload fejlede')
      }
      const data = (await res.json()) as { url: string }
      setUrl(data.url)
      toast.success('Profilbillede opdateret')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload fejlede')
    } finally {
      setBusy(null)
    }
  }

  async function handleRemove() {
    setBusy('remove')
    try {
      const res = await fetch('/api/avatar', { method: 'DELETE' })
      if (!res.ok) throw new Error('Kunne ikke fjerne')
      setUrl(null)
      toast.success('Profilbillede fjernet')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Kunne ikke fjerne')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-primary text-xl font-semibold text-primary-foreground">
          {url ? (
            <Image
              src={url}
              alt="Profilbillede"
              width={80}
              height={80}
              className="size-full object-cover"
              unoptimized
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy !== null}
          aria-label="Skift profilbillede"
          className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm transition hover:bg-muted disabled:opacity-50"
        >
          {busy === 'upload' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Camera className="size-4" />
          )}
        </button>
      </div>

      <div className="flex-1">
        <p className="text-sm font-medium">Profilbillede</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          JPG, PNG, WebP eller GIF — max 5 MB
        </p>
        {url && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={busy !== null}
            className="mt-2 h-auto px-2 py-1 text-xs text-muted-foreground"
          >
            {busy === 'remove' ? (
              <Loader2 className="mr-1.5 size-3 animate-spin" />
            ) : (
              <X className="mr-1.5 size-3" />
            )}
            Fjern billede
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
