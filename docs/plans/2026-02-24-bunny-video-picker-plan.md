# Bunny.net Video Picker — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the manual Bunny Video ID text input with a modal picker that browses existing videos and uploads new ones via TUS.

**Architecture:** Two new API routes (list videos, create upload token) proxy Bunny.net's Stream API server-side. A `BunnyVideoPicker` Dialog component uses these routes for browse/search and TUS upload. The existing `content-form.tsx` swaps the text input for the picker.

**Tech Stack:** Next.js 16 API routes, Bunny.net Stream REST API, `tus-js-client` (browser), shadcn/ui Dialog + Tabs, SHA256 signature generation (Node crypto)

---

### Task 1: Add `listVideos` and `createUploadToken` to lib/bunny.ts

**Files:**
- Modify: `lib/bunny.ts`

**Context:** `lib/bunny.ts` already has `getBunnyConfig()` returning `{ apiKey, libraryId, cdnHostname, tokenAuthKey }` and `createVideoUpload(title)` which creates a video placeholder but returns empty TUS auth headers.

**Step 1: Add `listVideos` function**

Add this after the existing `createVideoUpload` function (line ~55):

```typescript
/**
 * List videos from the Bunny.net Stream library.
 * Supports search and pagination.
 */
export async function listVideos(options?: {
  search?: string
  page?: number
  itemsPerPage?: number
}) {
  const { apiKey, libraryId } = getBunnyConfig()

  const params = new URLSearchParams()
  if (options?.search) params.set('search', options.search)
  params.set('page', String(options?.page ?? 1))
  params.set('itemsPerPage', String(options?.itemsPerPage ?? 24))
  params.set('orderBy', 'date')

  const response = await fetch(
    `${BUNNY_API_BASE}/${libraryId}/videos?${params.toString()}`,
    {
      method: 'GET',
      headers: { AccessKey: apiKey },
    }
  )

  if (!response.ok) {
    throw new Error(`Bunny.net list videos failed: ${response.status}`)
  }

  const data = await response.json()

  return {
    items: (data.items as Array<{
      guid: string
      title: string
      length: number
      status: number
      dateUploaded: string
      storageSize: number
    }>).map((v) => ({
      videoId: v.guid,
      title: v.title,
      duration: v.length,
      status: v.status,
      dateUploaded: v.dateUploaded,
      storageSize: v.storageSize,
      thumbnailUrl: getThumbnailUrl(v.guid),
    })),
    totalItems: data.totalItems as number,
    currentPage: data.currentPage as number,
    itemsPerPage: data.itemsPerPage as number,
  }
}
```

**Step 2: Add `createUploadToken` function**

Replace the existing `createVideoUpload` function with an updated version that generates proper TUS auth headers:

```typescript
/**
 * Create a new video placeholder and generate TUS upload credentials.
 * The signature is SHA256(libraryId + apiKey + expirationTime + videoId).
 * Must be called server-side only — never expose apiKey to the client.
 */
export async function createUploadToken(title: string) {
  const { apiKey, libraryId } = getBunnyConfig()

  // Create video placeholder via Bunny API
  const response = await fetch(
    `${BUNNY_API_BASE}/${libraryId}/videos`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        AccessKey: apiKey,
      },
      body: JSON.stringify({ title }),
    }
  )

  if (!response.ok) {
    throw new Error(`Bunny.net create video failed: ${response.status}`)
  }

  const video = await response.json()
  const videoId = video.guid as string

  // Generate TUS auth signature (server-side only)
  const { createHash } = await import('crypto')
  const expirationTime = Math.floor(Date.now() / 1000) + 86400 // 24h
  const signature = createHash('sha256')
    .update(`${libraryId}${apiKey}${expirationTime}${videoId}`)
    .digest('hex')

  return {
    videoId,
    libraryId,
    signature,
    expirationTime,
  }
}
```

**Step 3: Remove old `createVideoUpload`**

Delete the old `createVideoUpload` function (lines 22-55). It is unused — no code imports it. The new `createUploadToken` replaces it.

**Step 4: Verify no imports break**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors referencing `createVideoUpload` (it's unused).

**Step 5: Commit**

```bash
git add lib/bunny.ts
git commit -m "feat: add listVideos and createUploadToken to Bunny service"
```

---

### Task 2: Create API routes for video list and upload token

**Files:**
- Create: `app/api/admin/bunny/videos/route.ts`
- Create: `app/api/admin/bunny/upload-token/route.ts`

**Context:** API routes use `getCurrentUser()` from `@/lib/auth` for auth. Admin check is `user.role !== 'ADMIN'`. Return `NextResponse.json()`. See `app/api/checkout/route.ts` for the pattern.

**Step 1: Create the list videos route**

Create `app/api/admin/bunny/videos/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { listVideos } from '@/lib/bunny'

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? undefined
  const page = parseInt(searchParams.get('page') ?? '1', 10)

  try {
    const result = await listVideos({ search, page })
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bunny API fejl'
    console.error('Bunny list videos error:', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
```

**Step 2: Create the upload token route**

Create `app/api/admin/bunny/upload-token/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createUploadToken } from '@/lib/bunny'

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const title = typeof body.title === 'string' ? body.title.trim() : ''

  if (!title) {
    return NextResponse.json({ error: 'Titel er påkrævet' }, { status: 400 })
  }

  try {
    const result = await createUploadToken(title)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bunny API fejl'
    console.error('Bunny upload token error:', message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

**Step 4: Commit**

```bash
git add app/api/admin/bunny/videos/route.ts app/api/admin/bunny/upload-token/route.ts
git commit -m "feat: admin API routes for Bunny video list and upload token"
```

---

### Task 3: Install tus-js-client

**Step 1: Install the package**

```bash
npm install tus-js-client
```

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add tus-js-client for Bunny.net browser uploads"
```

---

### Task 4: Create the BunnyVideoPicker component

**Files:**
- Create: `app/admin/content/_components/bunny-video-picker.tsx`

**Context:** This is a `'use client'` component. Uses shadcn/ui `Dialog`, `Tabs`, `Input`, `Button`, `Badge`, `ScrollArea`. The component receives the current `bunnyVideoId` (if any) and calls `onSelect({ videoId, thumbnailUrl, durationMinutes })` when a video is chosen.

**Dependencies:** The project already has shadcn/ui components: Dialog, Tabs, Input, Button, Badge. Check if ScrollArea is installed — if not, add it.

**Step 1: Check for ScrollArea**

Run: `ls components/ui/scroll-area.tsx 2>/dev/null || echo "MISSING"`
If missing, run: `npx shadcn@latest add scroll-area --yes`

**Step 2: Create the component**

Create `app/admin/content/_components/bunny-video-picker.tsx`:

```tsx
'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Film,
  Search,
  Upload,
  Loader2,
  Check,
  AlertCircle,
  X,
} from 'lucide-react'

type BunnyVideo = {
  videoId: string
  title: string
  duration: number
  status: number
  dateUploaded: string
  storageSize: number
  thumbnailUrl: string
}

type VideoListResponse = {
  items: BunnyVideo[]
  totalItems: number
  currentPage: number
  itemsPerPage: number
}

type SelectedVideo = {
  videoId: string
  thumbnailUrl: string
  durationMinutes: number
}

type BunnyVideoPickerProps = {
  value?: string // current bunnyVideoId
  onSelect: (video: SelectedVideo) => void
  onClear: () => void
  cdnHostname: string
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function BunnyVideoPicker({
  value,
  onSelect,
  onClear,
  cdnHostname,
}: BunnyVideoPickerProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<string>('browse')

  // Browse state
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [videos, setVideos] = useState<BunnyVideo[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const uploadRef = useRef<{ abort: () => void } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const itemsPerPage = 24
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch videos when dialog opens, search changes, or page changes
  const fetchVideos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      params.set('page', String(page))
      const res = await fetch(`/api/admin/bunny/videos?${params.toString()}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Fejl: ${res.status}`)
      }
      const data: VideoListResponse = await res.json()
      setVideos(data.items)
      setTotalItems(data.totalItems)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke hente videoer')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page])

  useEffect(() => {
    if (open) {
      fetchVideos()
    }
  }, [open, fetchVideos])

  function handleSelect(video: BunnyVideo) {
    onSelect({
      videoId: video.videoId,
      thumbnailUrl: video.thumbnailUrl,
      durationMinutes: Math.ceil(video.duration / 60),
    })
    setOpen(false)
  }

  async function handleUpload() {
    if (!uploadFile) return
    setUploading(true)
    setUploadError(null)
    setUploadProgress(0)

    try {
      // 1. Get upload token from server
      const tokenRes = await fetch('/api/admin/bunny/upload-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: uploadFile.name.replace(/\.[^.]+$/, '') }),
      })
      if (!tokenRes.ok) {
        const data = await tokenRes.json().catch(() => ({}))
        throw new Error(data.error ?? 'Kunne ikke oprette upload')
      }
      const { videoId, libraryId, signature, expirationTime } =
        await tokenRes.json()

      // 2. Upload via TUS
      const tus = await import('tus-js-client')
      const upload = new tus.Upload(uploadFile, {
        endpoint: 'https://video.bunnycdn.com/tusupload',
        retryDelays: [0, 1000, 3000, 5000],
        headers: {
          AuthorizationSignature: signature,
          AuthorizationExpire: String(expirationTime),
          VideoId: videoId,
          LibraryId: libraryId,
        },
        metadata: {
          filetype: uploadFile.type,
          title: uploadFile.name,
        },
        onError: (err) => {
          setUploadError(err.message ?? 'Upload fejlede')
          setUploading(false)
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          setUploadProgress(Math.round((bytesUploaded / bytesTotal) * 100))
        },
        onSuccess: () => {
          // Auto-select the uploaded video
          const thumbnailUrl = `https://${cdnHostname}/${videoId}/thumbnail.jpg`
          onSelect({
            videoId,
            thumbnailUrl,
            durationMinutes: 0, // Duration unknown until processing completes
          })
          setUploading(false)
          setUploadFile(null)
          setUploadProgress(0)
          setOpen(false)
        },
      })

      uploadRef.current = upload

      // Check for previous uploads to resume
      const previousUploads = await upload.findPreviousUploads()
      if (previousUploads.length > 0) {
        upload.resumeFromPreviousUpload(previousUploads[0])
      }
      upload.start()
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Upload fejlede'
      )
      setUploading(false)
    }
  }

  function cancelUpload() {
    if (uploadRef.current) {
      uploadRef.current.abort()
    }
    setUploading(false)
    setUploadFile(null)
    setUploadProgress(0)
    setUploadError(null)
  }

  // Selected video preview (shown in the form when a video is selected)
  if (value && !open) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border p-3">
        <img
          src={`https://${cdnHostname}/${value}/thumbnail.jpg`}
          alt="Video thumbnail"
          className="h-16 w-28 rounded object-cover"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{value}</p>
          <p className="text-xs text-muted-foreground">Bunny Video ID</p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
          >
            Skift
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full gap-2">
          <Film className="size-4" />
          Vælg video fra Bunny
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Vælg video</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="browse" className="gap-2">
              <Search className="size-4" />
              Gennemse
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="size-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          {/* ─── Browse Tab ─── */}
          <TabsContent value="browse" className="space-y-4">
            <Input
              placeholder="Søg efter videoer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="size-4 flex-shrink-0" />
                {error}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={fetchVideos}
                >
                  Prøv igen
                </Button>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {videos.map((video) => {
                    const isReady = video.status >= 4
                    const isSelected = video.videoId === value
                    return (
                      <button
                        key={video.videoId}
                        type="button"
                        disabled={!isReady}
                        onClick={() => handleSelect(video)}
                        className={`group relative overflow-hidden rounded-lg border text-left transition-colors ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/20'
                            : isReady
                              ? 'border-border hover:border-primary/50'
                              : 'cursor-not-allowed border-border opacity-60'
                        }`}
                      >
                        <div className="relative aspect-video w-full bg-muted">
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).style.display =
                                'none'
                            }}
                          />
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                              <Check className="size-6 text-primary" />
                            </div>
                          )}
                          {!isReady && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <Loader2 className="size-5 animate-spin text-white" />
                            </div>
                          )}
                          {isReady && video.duration > 0 && (
                            <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                              {formatDuration(video.duration)}
                            </span>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="truncate text-xs font-medium">
                            {video.title}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <Badge
                              variant={isReady ? 'secondary' : 'outline'}
                              className="text-[10px]"
                            >
                              {isReady ? 'Klar' : 'Behandler...'}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {formatSize(video.storageSize)}
                            </span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {videos.length === 0 && !loading && (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    {debouncedSearch
                      ? 'Ingen videoer matcher din søgning'
                      : 'Ingen videoer i biblioteket'}
                  </div>
                )}
              </ScrollArea>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-3">
                <p className="text-xs text-muted-foreground">
                  {totalItems} videoer · Side {page} af {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Forrige
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Næste
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ─── Upload Tab ─── */}
          <TabsContent value="upload" className="space-y-4">
            {!uploading && !uploadFile && (
              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-12 hover:border-primary/50"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const file = e.dataTransfer.files[0]
                  if (file?.type.startsWith('video/')) {
                    setUploadFile(file)
                    setUploadError(null)
                  }
                }}
              >
                <Upload className="mb-3 size-8 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Træk en videofil hertil
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  eller klik for at vælge
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setUploadFile(file)
                      setUploadError(null)
                    }
                  }}
                />
              </div>
            )}

            {uploadFile && !uploading && (
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{uploadFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(uploadFile.size)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadFile(null)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  type="button"
                  className="mt-3 w-full gap-2"
                  onClick={handleUpload}
                >
                  <Upload className="size-4" />
                  Upload video
                </Button>
              </div>
            )}

            {uploading && (
              <div className="rounded-lg border border-border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {uploadFile?.name ?? 'Uploader...'}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={cancelUpload}
                  >
                    Annuller
                  </Button>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {uploadProgress}%
                </p>
              </div>
            )}

            {uploadError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="size-4 flex-shrink-0" />
                {uploadError}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

**Step 4: Commit**

```bash
git add app/admin/content/_components/bunny-video-picker.tsx
git commit -m "feat: BunnyVideoPicker component — browse + TUS upload"
```

---

### Task 5: Integrate picker into content-form.tsx

**Files:**
- Modify: `app/admin/content/_components/content-form.tsx`

**Context:** The existing Medie card (lines 234-346) has a plain `<Input>` for `bunnyVideoId` (lines 297-315). Replace it with the `BunnyVideoPicker`. Also keep the `thumbnailUrl` input but make it read-only when auto-populated from Bunny.

**Step 1: Add import**

At the top of the file, after the existing imports (line 21), add:

```typescript
import { BunnyVideoPicker } from './bunny-video-picker'
```

**Step 2: Replace the bunnyVideoId input section**

Replace lines 281-315 (the grid with mediaUrl and bunnyVideoId inputs) with:

```tsx
          <div className="space-y-2">
            <Label htmlFor="mediaUrl">Medie-URL</Label>
            <Input
              id="mediaUrl"
              type="url"
              value={formData.mediaUrl}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  mediaUrl: e.target.value,
                }))
              }
              placeholder="https://..."
            />
          </div>

          {formData.mediaType === 'VIDEO' && (
            <div className="space-y-2">
              <Label>Bunny Video</Label>
              <BunnyVideoPicker
                value={formData.bunnyVideoId || undefined}
                cdnHostname={
                  process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME ??
                  'vz-b4f34ae0-620.b-cdn.net'
                }
                onSelect={({ videoId, thumbnailUrl, durationMinutes }) => {
                  setFormData((prev) => ({
                    ...prev,
                    bunnyVideoId: videoId,
                    thumbnailUrl,
                    durationMinutes: durationMinutes
                      ? String(durationMinutes)
                      : prev.durationMinutes,
                  }))
                }}
                onClear={() => {
                  setFormData((prev) => ({
                    ...prev,
                    bunnyVideoId: '',
                    thumbnailUrl: '',
                  }))
                }}
              />
            </div>
          )}
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

**Step 4: Manual test**

1. Run: `npm run dev`
2. Navigate to `/admin/content/new`
3. Select "Video" as mediaType
4. Verify "Vælg video fra Bunny" button appears
5. Click it → modal opens with video grid
6. Search works, pagination works
7. Click a video → form fields populate (bunnyVideoId, thumbnailUrl, durationMinutes)
8. "Skift" button works to reopen picker
9. X button clears the selection
10. Upload tab: drop a video file, see progress bar, video is selected on completion

**Step 5: Commit**

```bash
git add app/admin/content/_components/content-form.tsx
git commit -m "feat: integrate BunnyVideoPicker into content form"
```

---

### Task 6: Final cleanup and type-check

**Step 1: Full TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 2: Verify dev server runs cleanly**

Run: `npm run dev` and check `/admin/content/new` loads without errors.

**Step 3: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: bunny video picker cleanup"
```
