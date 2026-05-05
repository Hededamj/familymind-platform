'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type ImageUploaderProps = {
  value: string | null
  onChange: (url: string | null) => void
  label?: string
}

export function ImageUploader({ value, onChange, label = 'Cover-billede' }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Vælg et billede')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Billedet er for stort (max 10 MB)')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mediaType', 'IMAGE')

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Upload fejlede')
      }
      const { url } = await res.json()
      onChange(url)
      toast.success('Billede uploadet')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload fejlede')
    } finally {
      setUploading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function handleRemove() {
    onChange(null)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/x-icon,.ico"
        onChange={handleChange}
        className="hidden"
      />

      {value ? (
        <div className="relative inline-block">
          <div className="relative h-40 w-64 overflow-hidden rounded-lg border border-border bg-muted">
            <Image
              src={value}
              alt="Cover"
              fill
              className="object-cover"
              sizes="256px"
              unoptimized
            />
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Uploader...
                </>
              ) : (
                <>
                  <Upload className="mr-2 size-4" />
                  Skift billede
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="mr-2 size-4" />
              Fjern
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-40 w-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 transition hover:border-primary hover:bg-muted/50 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="mb-2 size-6 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Uploader...</span>
            </>
          ) : (
            <>
              <Upload className="mb-2 size-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Klik for at uploade</span>
              <span className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP — max 10 MB</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}
