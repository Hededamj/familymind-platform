'use client'

import { useState, useRef } from 'react'
import * as tus from 'tus-js-client'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, Loader2, CheckCircle, Film, X } from 'lucide-react'
import { toast } from 'sonner'

type VideoUploaderProps = {
  onUploadComplete: (videoId: string) => void
  currentVideoId?: string
}

export function VideoUploader({ onUploadComplete, currentVideoId }: VideoUploaderProps) {
  const [state, setState] = useState<'idle' | 'creating' | 'uploading' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  const uploadRef = useRef<tus.Upload | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cdnHostname = process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME ?? ''

  async function handleFileSelect(file: File) {
    if (!file.type.startsWith('video/')) {
      toast.error('Vælg venligst en videofil')
      return
    }

    const maxSize = 2 * 1024 * 1024 * 1024 // 2 GB
    if (file.size > maxSize) {
      toast.error('Filen er for stor (max 2 GB)')
      return
    }

    setFileName(file.name)
    setState('creating')
    setProgress(0)

    try {
      // 1. Create video in Bunny and get auth
      const title = file.name.replace(/\.[^.]+$/, '')
      const res = await fetch('/api/upload-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Kunne ikke oprette video')
      }

      const { videoId, libraryId, expirationTime, signature } = await res.json()

      // 2. Upload via TUS
      setState('uploading')

      const upload = new tus.Upload(file, {
        endpoint: 'https://video.bunnycdn.com/tusupload',
        retryDelays: [0, 3000, 5000, 10000],
        headers: {
          AuthorizationSignature: signature,
          AuthorizationExpire: String(expirationTime),
          VideoId: videoId,
          LibraryId: libraryId,
        },
        metadata: {
          filetype: file.type,
          title: title,
        },
        onError: (error) => {
          console.error('Upload fejlede:', error)
          toast.error('Video-upload fejlede')
          setState('idle')
          setProgress(0)
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const pct = Math.round((bytesUploaded / bytesTotal) * 100)
          setProgress(pct)
        },
        onSuccess: () => {
          setState('done')
          setProgress(100)
          onUploadComplete(videoId)
          toast.success('Video uploadet!')
        },
      })

      uploadRef.current = upload
      upload.start()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload fejlede'
      toast.error(msg)
      setState('idle')
      setProgress(0)
    }
  }

  function handleCancel() {
    if (uploadRef.current) {
      uploadRef.current.abort()
      uploadRef.current = null
    }
    setState('idle')
    setProgress(0)
    setFileName('')
  }

  // Show thumbnail if video already set
  if (currentVideoId && state === 'idle') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 rounded-md border p-3">
          {cdnHostname && (
            <img
              src={`https://${cdnHostname}/${currentVideoId}/thumbnail.jpg`}
              alt="Video thumbnail"
              className="h-16 w-28 rounded object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <CheckCircle className="size-4 text-green-600" />
              Video tilknyttet
            </p>
            <p className="text-xs text-muted-foreground truncate">{currentVideoId}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (fileInputRef.current) fileInputRef.current.click()
            }}
          >
            Skift video
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="video/*"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileSelect(file)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {state === 'idle' && (
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary hover:bg-muted/30">
          <Film className="size-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Vælg videofil</p>
            <p className="text-xs text-muted-foreground">MP4, MOV, AVI — max 2 GB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="video/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
          />
        </label>
      )}

      {state === 'creating' && (
        <div className="flex items-center gap-3 rounded-lg border p-4">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span className="text-sm">Forbereder upload...</span>
        </div>
      )}

      {state === 'uploading' && (
        <div className="space-y-2 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Upload className="size-4 text-primary shrink-0" />
              <span className="text-sm truncate">{fileName}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-medium">{progress}%</span>
              <Button type="button" variant="ghost" size="sm" className="size-7 p-0" onClick={handleCancel}>
                <X className="size-4" />
              </Button>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {state === 'done' && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircle className="size-5 text-green-600" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800">Video uploadet</p>
            <p className="text-xs text-green-600 truncate">{fileName}</p>
          </div>
        </div>
      )}
    </div>
  )
}
