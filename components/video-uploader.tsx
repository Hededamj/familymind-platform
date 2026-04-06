'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import * as tus from 'tus-js-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Upload, Loader2, CheckCircle, Film, X, Search, FolderOpen, Clock } from 'lucide-react'
import { toast } from 'sonner'

type VideoUploaderProps = {
  onUploadComplete: (videoId: string) => void
  currentVideoId?: string
}

type BunnyVideo = {
  id: string
  title: string
  duration: number
  status: number
  thumbnail: string
  createdAt: string
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function VideoUploader({ onUploadComplete, currentVideoId }: VideoUploaderProps) {
  const [state, setState] = useState<'idle' | 'creating' | 'uploading' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  const [showPicker, setShowPicker] = useState(false)
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

  function handlePickVideo(videoId: string) {
    setShowPicker(false)
    onUploadComplete(videoId)
    toast.success('Video valgt')
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
          <div className="flex gap-1.5">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowPicker(true)}>
              Skift
            </Button>
          </div>
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
        <VideoPicker
          open={showPicker}
          onOpenChange={setShowPicker}
          onSelect={handlePickVideo}
          onUploadNew={() => {
            setShowPicker(false)
            if (fileInputRef.current) fileInputRef.current.click()
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {state === 'idle' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary hover:bg-muted/30">
              <Film className="size-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Upload ny video</p>
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
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary hover:bg-muted/30"
            >
              <FolderOpen className="size-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Vælg eksisterende</p>
                <p className="text-xs text-muted-foreground">Fra mediebiblioteket</p>
              </div>
            </button>
          </div>
          <VideoPicker
            open={showPicker}
            onOpenChange={setShowPicker}
            onSelect={handlePickVideo}
            onUploadNew={() => {
              setShowPicker(false)
              if (fileInputRef.current) fileInputRef.current.click()
            }}
          />
        </>
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

// ─── Video Picker Dialog ─────────────────────────────

type VideoPickerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (videoId: string) => void
  onUploadNew: () => void
}

function VideoPicker({ open, onOpenChange, onSelect, onUploadNew }: VideoPickerProps) {
  const [videos, setVideos] = useState<BunnyVideo[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  const fetchVideos = useCallback(async (searchQuery: string, pageNum: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pageNum) })
      if (searchQuery) params.set('search', searchQuery)
      const res = await fetch(`/api/videos?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setVideos(data.videos)
      setTotalItems(data.totalItems)
    } catch {
      toast.error('Kunne ikke hente videoer')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchVideos('', 1)
      setSearch('')
      setPage(1)
    }
  }, [open, fetchVideos])

  function handleSearchChange(value: string) {
    setSearch(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setPage(1)
      fetchVideos(value, 1)
    }, 400)
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    fetchVideos(search, newPage)
  }

  const totalPages = Math.ceil(totalItems / 20)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vælg video fra mediebiblioteket</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Søg efter video..."
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : videos.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {search ? 'Ingen videoer matcher søgningen' : 'Ingen videoer i biblioteket endnu'}
              </p>
              <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onUploadNew}>
                <Upload className="mr-2 size-4" />
                Upload ny video
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {videos.map((video) => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => onSelect(video.id)}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted/50"
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="h-12 w-20 shrink-0 rounded object-cover bg-muted"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = ''
                      ;(e.target as HTMLImageElement).className = 'h-12 w-20 shrink-0 rounded bg-muted'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{video.title}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {video.duration > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatDuration(video.duration)}
                        </span>
                      )}
                      {video.status !== 4 && (
                        <span className="text-amber-600">Processerer...</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-3">
            <p className="text-xs text-muted-foreground">{totalItems} videoer</p>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                Forrige
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Næste
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
