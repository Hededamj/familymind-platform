# Media Library Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a media library for admins to upload, browse, and select images and videos — replacing manual URL inputs across all admin forms.

**Architecture:** A new `Media` Prisma model tracks all uploaded assets. Images upload to Supabase Storage (public bucket with CDN), videos upload to Bunny.net Stream (existing integration). A service layer (`media.service.ts`) handles CRUD. API routes handle file uploads (multipart). A reusable `<MediaPicker />` client component provides browse/upload in a Dialog modal, used across all admin forms. A dedicated `/admin/media` page gives full library management.

**Tech Stack:** Next.js 16, Prisma 6, Supabase Storage, Bunny.net Stream API, tus-js-client (video upload), shadcn/ui, Zod 4, TypeScript 5

**Worktree:** `.worktrees/media-library` on branch `feat/media-library`

---

### Task 1: Prisma Schema — Media Model + Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: migration via `prisma migrate dev`

**Step 1: Add MediaAssetType enum and Media model to schema**

Add after the existing enums (after line ~104 in `prisma/schema.prisma`):

```prisma
enum MediaAssetType {
  IMAGE
  VIDEO
}

model Media {
  id          String         @id @default(uuid()) @db.Uuid
  filename    String
  mimeType    String
  type        MediaAssetType
  size        Int            // bytes
  url         String         // public CDN URL
  storageKey  String?        // Supabase Storage path (images only)
  bunnyVideoId String?       // Bunny.net Stream ID (videos only)
  width       Int?           // pixel width (images only)
  height      Int?           // pixel height (images only)
  alt         String?        // accessibility alt text
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}
```

**Step 2: Run migration**

```bash
cd .worktrees/media-library
npx prisma migrate dev --name add-media-library
```

Expected: Migration creates `Media` table and `MediaAssetType` enum.

**Step 3: Verify build**

```bash
npx next build 2>&1 | tail -5
```

Expected: Build succeeds.

**Step 4: Commit**

```bash
git add prisma/
git commit -m "feat(media): add Media model and MediaAssetType enum"
```

---

### Task 2: Media Service Layer

**Files:**
- Create: `lib/services/media.service.ts`
- Create: `lib/validators/media.ts`

**Step 1: Create Zod validators**

Create `lib/validators/media.ts`:

```typescript
import { z } from 'zod'

export const createMediaSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  type: z.enum(['IMAGE', 'VIDEO']),
  size: z.number().int().positive(),
  url: z.string().url(),
  storageKey: z.string().optional(),
  bunnyVideoId: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  alt: z.string().optional(),
})

export const updateMediaSchema = z.object({
  alt: z.string().optional(),
  filename: z.string().min(1).optional(),
})

export const listMediaSchema = z.object({
  search: z.string().optional(),
  type: z.enum(['IMAGE', 'VIDEO']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
})
```

**Step 2: Create media service**

Create `lib/services/media.service.ts`:

```typescript
import { prisma } from '@/lib/prisma'
import { createMediaSchema, updateMediaSchema, listMediaSchema } from '@/lib/validators/media'
import type { z } from 'zod'

type CreateMediaInput = z.input<typeof createMediaSchema>
type UpdateMediaInput = z.input<typeof updateMediaSchema>
type ListMediaInput = z.input<typeof listMediaSchema>

export async function createMedia(data: CreateMediaInput) {
  const validated = createMediaSchema.parse(data)
  return prisma.media.create({ data: validated })
}

export async function updateMedia(id: string, data: UpdateMediaInput) {
  const validated = updateMediaSchema.parse(data)
  return prisma.media.update({ where: { id }, data: validated })
}

export async function deleteMedia(id: string) {
  return prisma.media.delete({ where: { id } })
}

export async function getMedia(id: string) {
  return prisma.media.findUnique({ where: { id } })
}

export async function listMedia(filters?: ListMediaInput) {
  const { search, type, page, limit } = listMediaSchema.parse(filters ?? {})
  const skip = (page - 1) * limit

  const where = {
    ...(type && { type }),
    ...(search && {
      OR: [
        { filename: { contains: search, mode: 'insensitive' as const } },
        { alt: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [items, total] = await prisma.$transaction([
    prisma.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.media.count({ where }),
  ])

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}
```

**Step 3: Verify build**

```bash
npx next build 2>&1 | tail -5
```

**Step 4: Commit**

```bash
git add lib/validators/media.ts lib/services/media.service.ts
git commit -m "feat(media): add media service layer with Zod validation"
```

---

### Task 3: Supabase Storage Helper

**Files:**
- Create: `lib/supabase/storage.ts`

**Context:** Supabase client exists at `lib/supabase/server.ts` (creates SSR client with cookies). We need a service-role client for server-side storage operations that bypass RLS.

**Step 1: Create storage helper**

Create `lib/supabase/storage.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

function getStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, serviceKey)
}

const BUCKET = 'media'

/**
 * Upload a file to Supabase Storage.
 * Returns the storage key (path) and public URL.
 */
export async function uploadFile(
  file: Buffer,
  filename: string,
  mimeType: string
): Promise<{ storageKey: string; url: string }> {
  const supabase = getStorageClient()

  // Generate unique path: media/YYYY/MM/uuid-filename
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const uniqueId = crypto.randomUUID().slice(0, 8)
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storageKey = `${year}/${month}/${uniqueId}-${safeName}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storageKey, file, {
      contentType: mimeType,
      upsert: false,
    })

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`)
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storageKey)

  return { storageKey, url: urlData.publicUrl }
}

/**
 * Delete a file from Supabase Storage by its storage key.
 */
export async function deleteFile(storageKey: string): Promise<void> {
  const supabase = getStorageClient()
  const { error } = await supabase.storage.from(BUCKET).remove([storageKey])
  if (error) {
    console.error(`[storage] Failed to delete ${storageKey}:`, error.message)
  }
}
```

**Step 2: Verify build**

```bash
npx next build 2>&1 | tail -5
```

**Step 3: Commit**

```bash
git add lib/supabase/storage.ts
git commit -m "feat(media): add Supabase Storage helper for image upload/delete"
```

---

### Task 4: Image Upload API Route

**Files:**
- Create: `app/api/admin/media/upload/route.ts`

**Context:** Admin auth uses `requireAdmin()` from `lib/auth.ts`. API routes use `NextRequest`/`NextResponse` from `next/server`. Max file size: 25 MB. Accepted image types: jpeg, png, webp, gif, svg.

**Step 1: Create upload route**

Create `app/api/admin/media/upload/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { uploadFile } from '@/lib/supabase/storage'
import * as mediaService from '@/lib/services/media.service'

const MAX_SIZE = 25 * 1024 * 1024 // 25 MB
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
])

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Ingen fil valgt' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Filtypen ${file.type} er ikke understøttet. Brug JPEG, PNG, WebP, GIF eller SVG.` },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Filen er for stor (maks ${MAX_SIZE / 1024 / 1024} MB)` },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { storageKey, url } = await uploadFile(buffer, file.name, file.type)

    const media = await mediaService.createMedia({
      filename: file.name,
      mimeType: file.type,
      type: 'IMAGE',
      size: file.size,
      url,
      storageKey,
    })

    return NextResponse.json(media)
  } catch (error) {
    console.error('[media] Upload failed:', error)
    return NextResponse.json(
      { error: 'Upload fejlede' },
      { status: 500 }
    )
  }
}
```

**Step 2: Verify build**

```bash
npx next build 2>&1 | tail -5
```

**Step 3: Commit**

```bash
git add app/api/admin/media/upload/
git commit -m "feat(media): add image upload API route with validation"
```

---

### Task 5: Video Upload API Route

**Files:**
- Create: `app/api/admin/media/upload-video/route.ts`

**Context:** Bunny.net video upload uses TUS protocol. Server creates a video placeholder and returns upload credentials. Browser uploads directly to Bunny via `tus-js-client`. After upload completes, browser calls back to create the Media record.

This route has two endpoints:
- `POST` — create video placeholder + return TUS upload info
- `PUT` — called after browser upload completes to create Media record

**Step 1: Create video upload route**

Create `app/api/admin/media/upload-video/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createVideoUpload, getThumbnailUrl } from '@/lib/bunny'
import * as mediaService from '@/lib/services/media.service'

// POST: Create Bunny video placeholder, return TUS upload info
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const title = body.title || 'Untitled'
    const filename = body.filename || 'video.mp4'
    const size = body.size || 0

    const { videoId, uploadUrl, uploadHeaders } = await createVideoUpload(title)

    return NextResponse.json({
      videoId,
      uploadUrl,
      uploadHeaders,
      filename,
      size,
    })
  } catch (error) {
    console.error('[media] Video upload init failed:', error)
    return NextResponse.json(
      { error: 'Kunne ikke oprette video-upload' },
      { status: 500 }
    )
  }
}

// PUT: Called after TUS upload completes to create Media record
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { videoId, filename, size } = body

    if (!videoId || !filename) {
      return NextResponse.json(
        { error: 'Mangler videoId eller filename' },
        { status: 400 }
      )
    }

    const thumbnailUrl = getThumbnailUrl(videoId)

    const media = await mediaService.createMedia({
      filename,
      mimeType: 'video/mp4',
      type: 'VIDEO',
      size: size || 0,
      url: thumbnailUrl, // Use thumbnail as display URL; playback URL generated on-demand
      bunnyVideoId: videoId,
    })

    return NextResponse.json(media)
  } catch (error) {
    console.error('[media] Video record creation failed:', error)
    return NextResponse.json(
      { error: 'Kunne ikke registrere video' },
      { status: 500 }
    )
  }
}
```

**Step 2: Verify build**

```bash
npx next build 2>&1 | tail -5
```

**Step 3: Commit**

```bash
git add app/api/admin/media/upload-video/
git commit -m "feat(media): add video upload API route with Bunny.net TUS flow"
```

---

### Task 6: Media List + Delete API Routes

**Files:**
- Create: `app/api/admin/media/route.ts`
- Create: `app/api/admin/media/[id]/route.ts`

**Step 1: Create list route**

Create `app/api/admin/media/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import * as mediaService from '@/lib/services/media.service'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const result = await mediaService.listMedia({
    search: searchParams.get('search') || undefined,
    type: (searchParams.get('type') as 'IMAGE' | 'VIDEO') || undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 24,
  })

  return NextResponse.json(result)
}
```

**Step 2: Create delete route**

Create `app/api/admin/media/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import * as mediaService from '@/lib/services/media.service'
import { deleteFile } from '@/lib/supabase/storage'
import { deleteVideo } from '@/lib/bunny'
import { z } from 'zod'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    z.string().uuid().parse(id)

    const media = await mediaService.getMedia(id)
    if (!media) {
      return NextResponse.json({ error: 'Medie ikke fundet' }, { status: 404 })
    }

    // Delete from storage provider
    if (media.type === 'IMAGE' && media.storageKey) {
      await deleteFile(media.storageKey)
    } else if (media.type === 'VIDEO' && media.bunnyVideoId) {
      await deleteVideo(media.bunnyVideoId)
    }

    // Delete from database
    await mediaService.deleteMedia(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ugyldigt ID' }, { status: 400 })
    }
    console.error('[media] Delete failed:', error)
    return NextResponse.json({ error: 'Kunne ikke slette medie' }, { status: 500 })
  }
}
```

**Step 3: Also add PATCH for updating alt text**

In the same `app/api/admin/media/[id]/route.ts`, add:

```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    z.string().uuid().parse(id)

    const body = await request.json()
    const media = await mediaService.updateMedia(id, body)

    return NextResponse.json(media)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ugyldige data' }, { status: 400 })
    }
    console.error('[media] Update failed:', error)
    return NextResponse.json({ error: 'Kunne ikke opdatere medie' }, { status: 500 })
  }
}
```

**Step 4: Verify build**

```bash
npx next build 2>&1 | tail -5
```

**Step 5: Commit**

```bash
git add app/api/admin/media/
git commit -m "feat(media): add list, delete, and update API routes"
```

---

### Task 7: MediaPicker Component

**Files:**
- Create: `components/admin/media-picker.tsx`

**Context:** This is the core reusable component. It renders a preview of the current media + a "Vælg medie" button that opens a Dialog with browse/upload functionality. Props: `value` (current URL), `onChange` (callback), `type` (IMAGE or VIDEO filter).

**Step 1: Install tus-js-client for video uploads**

```bash
npm install tus-js-client
```

**Step 2: Create MediaPicker component**

Create `components/admin/media-picker.tsx`:

```tsx
'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ImageIcon, Video, Upload, X, Search, Loader2, Trash2 } from 'lucide-react'
import * as tus from 'tus-js-client'

interface MediaItem {
  id: string
  filename: string
  mimeType: string
  type: 'IMAGE' | 'VIDEO'
  size: number
  url: string
  bunnyVideoId?: string | null
  alt?: string | null
  createdAt: string
}

interface MediaPickerProps {
  value?: string | null
  onChange: (url: string | null) => void
  type?: 'IMAGE' | 'VIDEO'
  label?: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MediaPicker({ value, onChange, type, label }: MediaPickerProps) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<MediaItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const limit = 24

  const fetchMedia = useCallback(async (p: number, s: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (s) params.set('search', s)
      if (type) params.set('type', type)
      params.set('page', String(p))
      params.set('limit', String(limit))

      const res = await fetch(`/api/admin/media?${params}`)
      if (!res.ok) throw new Error('Fetch failed')
      const data = await res.json()
      setItems(data.items)
      setTotal(data.total)
    } catch (err) {
      console.error('[media-picker] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [type])

  function handleOpen() {
    setOpen(true)
    setPage(1)
    setSearch('')
    fetchMedia(1, '')
  }

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
    fetchMedia(1, value)
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    fetchMedia(newPage, search)
  }

  function handleSelect(item: MediaItem) {
    onChange(item.url)
    setOpen(false)
  }

  async function handleImageUpload(file: File) {
    setUploading(true)
    setUploadProgress(0)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Upload fejlede')
      }

      const media: MediaItem = await res.json()
      onChange(media.url)
      setOpen(false)
    } catch (err) {
      console.error('[media-picker] Upload error:', err)
      alert(err instanceof Error ? err.message : 'Upload fejlede')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  async function handleVideoUpload(file: File) {
    setUploading(true)
    setUploadProgress(0)
    try {
      // 1. Create video placeholder on server
      const initRes = await fetch('/api/admin/media/upload-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: file.name.replace(/\.[^/.]+$/, ''),
          filename: file.name,
          size: file.size,
        }),
      })

      if (!initRes.ok) {
        const err = await initRes.json()
        throw new Error(err.error || 'Kunne ikke starte upload')
      }

      const { videoId, uploadUrl, uploadHeaders, filename, size } = await initRes.json()

      // 2. Upload via TUS directly to Bunny
      await new Promise<void>((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: uploadUrl,
          headers: uploadHeaders,
          metadata: {
            filetype: file.type,
            title: file.name,
          },
          onProgress(bytesUploaded, bytesTotal) {
            setUploadProgress(Math.round((bytesUploaded / bytesTotal) * 100))
          },
          onSuccess() {
            resolve()
          },
          onError(error) {
            reject(error)
          },
        })
        upload.start()
      })

      // 3. Create Media record on server
      const recordRes = await fetch('/api/admin/media/upload-video', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, filename, size }),
      })

      if (!recordRes.ok) {
        const err = await recordRes.json()
        throw new Error(err.error || 'Kunne ikke registrere video')
      }

      const media: MediaItem = await recordRes.json()
      onChange(media.url)
      setOpen(false)
    } catch (err) {
      console.error('[media-picker] Video upload error:', err)
      alert(err instanceof Error ? err.message : 'Video upload fejlede')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type.startsWith('video/')) {
      handleVideoUpload(file)
    } else {
      handleImageUpload(file)
    }

    // Reset input so the same file can be selected again
    e.target.value = ''
  }

  const totalPages = Math.ceil(total / limit)
  const acceptTypes = type === 'VIDEO'
    ? 'video/mp4,video/webm,video/quicktime'
    : type === 'IMAGE'
      ? 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml'
      : 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/webm'

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}

      {/* Preview */}
      {value ? (
        <div className="group relative inline-block">
          <img
            src={value}
            alt="Valgt medie"
            className="h-24 w-auto rounded border object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
          >
            <X className="size-3" />
          </button>
        </div>
      ) : null}

      {/* Buttons */}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleOpen}>
          {value ? 'Skift medie' : 'Vælg medie'}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
          >
            Fjern
          </Button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Vælg medie</DialogTitle>
          </DialogHeader>

          {/* Toolbar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Søg efter filnavn..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {uploadProgress > 0 ? `${uploadProgress}%` : 'Uploader...'}
                </>
              ) : (
                <>
                  <Upload className="mr-2 size-4" />
                  Upload
                </>
              )}
            </Button>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                {search ? 'Ingen resultater for søgningen.' : 'Ingen medier endnu. Upload det første.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="group relative aspect-square overflow-hidden rounded-md border transition-all hover:ring-2 hover:ring-primary"
                  onClick={() => handleSelect(item)}
                >
                  {item.type === 'IMAGE' ? (
                    <img
                      src={item.url}
                      alt={item.alt || item.filename}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center bg-muted">
                      <Video className="size-6 text-muted-foreground" />
                      <span className="mt-1 px-1 text-center text-[10px] text-muted-foreground line-clamp-2">
                        {item.filename}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="truncate text-[10px] text-white">{item.filename}</p>
                    <p className="text-[9px] text-white/70">{formatBytes(item.size)}</p>
                  </div>
                  {item.type === 'VIDEO' && (
                    <Badge className="absolute right-1 top-1" variant="secondary">
                      Video
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {total} medier · Side {page} af {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                >
                  Forrige
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  Næste
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

**Step 3: Verify build**

```bash
npx next build 2>&1 | tail -5
```

**Step 4: Commit**

```bash
git add components/admin/media-picker.tsx package.json package-lock.json
git commit -m "feat(media): add MediaPicker component with upload and browse"
```

---

### Task 8: Admin Media Page

**Files:**
- Create: `app/admin/media/page.tsx`
- Create: `app/admin/media/_components/media-grid.tsx`
- Create: `app/admin/media/_components/media-detail-dialog.tsx`
- Modify: `app/admin/_components/admin-nav.tsx` — add "Medier" nav item

**Step 1: Create media grid client component**

Create `app/admin/media/_components/media-grid.tsx`:

```tsx
'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Video, Upload, Search, Loader2 } from 'lucide-react'
import { MediaDetailDialog } from './media-detail-dialog'
import * as tus from 'tus-js-client'
import { toast } from 'sonner'

interface MediaItem {
  id: string
  filename: string
  mimeType: string
  type: 'IMAGE' | 'VIDEO'
  size: number
  url: string
  storageKey?: string | null
  bunnyVideoId?: string | null
  alt?: string | null
  createdAt: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MediaGrid() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [initialized, setInitialized] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const limit = 24

  const fetchMedia = useCallback(async (p: number, s: string, t: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (s) params.set('search', s)
      if (t !== 'ALL') params.set('type', t)
      params.set('page', String(p))
      params.set('limit', String(limit))

      const res = await fetch(`/api/admin/media?${params}`)
      if (!res.ok) throw new Error('Fetch failed')
      const data = await res.json()
      setItems(data.items)
      setTotal(data.total)
    } catch {
      toast.error('Kunne ikke hente medier')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  if (!initialized) {
    setInitialized(true)
    fetchMedia(1, '', 'ALL')
  }

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
    fetchMedia(1, value, typeFilter)
  }

  function handleTypeFilter(value: string) {
    setTypeFilter(value)
    setPage(1)
    fetchMedia(1, search, value)
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    fetchMedia(newPage, search, typeFilter)
  }

  async function handleImageUpload(file: File) {
    setUploading(true)
    setUploadProgress(0)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/media/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Upload fejlede')
      }
      toast.success('Billede uploadet')
      fetchMedia(1, search, typeFilter)
      setPage(1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload fejlede')
    } finally {
      setUploading(false)
    }
  }

  async function handleVideoUpload(file: File) {
    setUploading(true)
    setUploadProgress(0)
    try {
      const initRes = await fetch('/api/admin/media/upload-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: file.name.replace(/\.[^/.]+$/, ''),
          filename: file.name,
          size: file.size,
        }),
      })
      if (!initRes.ok) throw new Error('Kunne ikke starte upload')
      const { videoId, uploadUrl, uploadHeaders, filename, size } = await initRes.json()

      await new Promise<void>((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: uploadUrl,
          headers: uploadHeaders,
          metadata: { filetype: file.type, title: file.name },
          onProgress(bytesUploaded, bytesTotal) {
            setUploadProgress(Math.round((bytesUploaded / bytesTotal) * 100))
          },
          onSuccess() { resolve() },
          onError(error) { reject(error) },
        })
        upload.start()
      })

      await fetch('/api/admin/media/upload-video', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, filename, size }),
      })

      toast.success('Video uploadet')
      fetchMedia(1, search, typeFilter)
      setPage(1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Video upload fejlede')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type.startsWith('video/')) {
      handleVideoUpload(file)
    } else {
      handleImageUpload(file)
    }
    e.target.value = ''
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Sletning fejlede')
      toast.success('Medie slettet')
      setSelectedItem(null)
      fetchMedia(page, search, typeFilter)
    } catch {
      toast.error('Kunne ikke slette medie')
    }
  }

  async function handleUpdate(id: string, data: { alt?: string; filename?: string }) {
    try {
      const res = await fetch(`/api/admin/media/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Opdatering fejlede')
      toast.success('Medie opdateret')
      fetchMedia(page, search, typeFilter)
    } catch {
      toast.error('Kunne ikke opdatere medie')
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Søg efter filnavn..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={handleTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Alle typer</SelectItem>
            <SelectItem value="IMAGE">Billeder</SelectItem>
            <SelectItem value="VIDEO">Videoer</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {uploadProgress > 0 ? `${uploadProgress}%` : 'Uploader...'}
            </>
          ) : (
            <>
              <Upload className="mr-2 size-4" />
              Upload
            </>
          )}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/webm,video/quicktime"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-md border p-12 text-center">
          <p className="text-muted-foreground">
            {search ? 'Ingen resultater.' : 'Ingen medier endnu. Upload det første.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="group relative aspect-square overflow-hidden rounded-lg border transition-all hover:ring-2 hover:ring-primary"
              onClick={() => setSelectedItem(item)}
            >
              {item.type === 'IMAGE' ? (
                <img
                  src={item.url}
                  alt={item.alt || item.filename}
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full flex-col items-center justify-center bg-muted">
                  <Video className="size-8 text-muted-foreground" />
                  <span className="mt-1 px-2 text-center text-xs text-muted-foreground line-clamp-2">
                    {item.filename}
                  </span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="truncate text-xs text-white">{item.filename}</p>
                <p className="text-[10px] text-white/70">{formatBytes(item.size)}</p>
              </div>
              {item.type === 'VIDEO' && (
                <Badge className="absolute right-1 top-1" variant="secondary">Video</Badge>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} medier · Side {page} af {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handlePageChange(page - 1)} disabled={page <= 1}>
              Forrige
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages}>
              Næste
            </Button>
          </div>
        </div>
      )}

      {/* Detail dialog */}
      {selectedItem && (
        <MediaDetailDialog
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      )}
    </>
  )
}
```

**Step 3: Create detail dialog component**

Create `app/admin/media/_components/media-detail-dialog.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Trash2, Copy, Video } from 'lucide-react'
import { toast } from 'sonner'

interface MediaItem {
  id: string
  filename: string
  mimeType: string
  type: 'IMAGE' | 'VIDEO'
  size: number
  url: string
  storageKey?: string | null
  bunnyVideoId?: string | null
  alt?: string | null
  createdAt: string
}

interface MediaDetailDialogProps {
  item: MediaItem
  onClose: () => void
  onDelete: (id: string) => void
  onUpdate: (id: string, data: { alt?: string; filename?: string }) => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function MediaDetailDialog({ item, onClose, onDelete, onUpdate }: MediaDetailDialogProps) {
  const [alt, setAlt] = useState(item.alt ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleCopyUrl() {
    navigator.clipboard.writeText(item.url)
    toast.success('URL kopieret')
  }

  function handleSaveAlt() {
    onUpdate(item.id, { alt })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="truncate">{item.filename}</DialogTitle>
        </DialogHeader>

        {/* Preview */}
        <div className="flex justify-center rounded-md border bg-muted/50 p-4">
          {item.type === 'IMAGE' ? (
            <img
              src={item.url}
              alt={item.alt || item.filename}
              className="max-h-64 rounded object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 py-8">
              <Video className="size-12 text-muted-foreground" />
              <Badge variant="secondary">Video</Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Type:</span>{' '}
            <Badge variant="outline">{item.type === 'IMAGE' ? 'Billede' : 'Video'}</Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Størrelse:</span> {formatBytes(item.size)}
          </div>
          <div>
            <span className="text-muted-foreground">MIME:</span> {item.mimeType}
          </div>
          <div>
            <span className="text-muted-foreground">Oprettet:</span> {formatDate(item.createdAt)}
          </div>
        </div>

        {/* URL */}
        <div className="space-y-1">
          <Label>URL</Label>
          <div className="flex gap-2">
            <Input value={item.url} readOnly className="text-xs" />
            <Button type="button" variant="outline" size="sm" onClick={handleCopyUrl}>
              <Copy className="size-4" />
            </Button>
          </div>
        </div>

        {/* Alt text */}
        {item.type === 'IMAGE' && (
          <div className="space-y-1">
            <Label>Alt-tekst</Label>
            <div className="flex gap-2">
              <Input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Beskriv billedet..."
              />
              <Button type="button" variant="outline" size="sm" onClick={handleSaveAlt}>
                Gem
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-destructive">Er du sikker?</span>
              <Button variant="destructive" size="sm" onClick={() => onDelete(item.id)}>
                Ja, slet
              </Button>
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                Annuller
              </Button>
            </div>
          ) : (
            <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="mr-2 size-4" />
              Slet medie
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 4: Create admin media page**

Create `app/admin/media/page.tsx`:

```tsx
import { requireAdmin } from '@/lib/auth'
import { MediaGrid } from './_components/media-grid'

export default async function MediaLibraryPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mediebibliotek</h1>
        <p className="text-muted-foreground">
          Upload og administrer billeder og videoer
        </p>
      </div>
      <MediaGrid />
    </div>
  )
}
```

**Step 5: Add "Medier" to admin nav**

In `app/admin/_components/admin-nav.tsx`, add to the "Indhold" section after the existing items:

```typescript
import { Image } from 'lucide-react' // add to imports

// In navSections, add to 'Indhold' items array:
{ href: '/admin/media', label: 'Medier', icon: Image },
```

**Step 6: Verify build**

```bash
npx next build 2>&1 | tail -5
```

**Step 7: Commit**

```bash
git add app/admin/media/ app/admin/_components/admin-nav.tsx
git commit -m "feat(media): add admin media library page with grid, detail dialog, and nav item"
```

---

### Task 9: Integrate MediaPicker into Product Form

**Files:**
- Modify: `app/admin/products/_components/product-form.tsx`

**Context:** Currently uses `<Input>` fields for `coverImageUrl` and `thumbnailUrl` (around lines 561-584). Replace with `<MediaPicker />`.

**Step 1: Replace URL inputs with MediaPicker**

Add import at top:
```typescript
import { MediaPicker } from '@/components/admin/media-picker'
```

Replace the coverImageUrl/thumbnailUrl `<Input>` fields (the grid with `grid-cols-2 gap-4` inside the `{mode === 'edit' && ...}` block) with:

```tsx
{mode === 'edit' && (
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label>Coverbillede</Label>
      <MediaPicker
        value={formData.coverImageUrl || null}
        onChange={(url) => setFormData(prev => ({ ...prev, coverImageUrl: url ?? '' }))}
        type="IMAGE"
      />
      <p className="text-xs text-muted-foreground">Bruges på landing page og browse-side</p>
    </div>
    <div className="space-y-2">
      <Label>Thumbnail</Label>
      <MediaPicker
        value={formData.thumbnailUrl || null}
        onChange={(url) => setFormData(prev => ({ ...prev, thumbnailUrl: url ?? '' }))}
        type="IMAGE"
      />
      <p className="text-xs text-muted-foreground">Lille billede til kort og lister</p>
    </div>
  </div>
)}
```

Remove the separate "Gem billeder" button — images are now saved via the main form or the existing `handleSaveImages` flow (keep the button but it now uses the URLs set by MediaPicker).

**Step 2: Verify build**

```bash
npx next build 2>&1 | tail -5
```

**Step 3: Commit**

```bash
git add app/admin/products/_components/product-form.tsx
git commit -m "feat(media): replace URL inputs with MediaPicker in product form"
```

---

### Task 10: Integrate MediaPicker into Content Form

**Files:**
- Modify: `app/admin/content/_components/content-form.tsx`

**Context:** Content form has `mediaUrl`, `bunnyVideoId`, and `thumbnailUrl` fields. Replace `thumbnailUrl` Input with `<MediaPicker type="IMAGE" />`. Replace `bunnyVideoId` Input with `<MediaPicker type="VIDEO" />` that sets both `bunnyVideoId` and auto-generates thumbnail. Keep `mediaUrl` as a text field for non-video media (audio URLs, PDF links).

**Step 1: Add MediaPicker import and replace fields**

Add import:
```typescript
import { MediaPicker } from '@/components/admin/media-picker'
```

Replace the `bunnyVideoId` Input section with:
```tsx
<div className="space-y-2">
  <Label>Video</Label>
  <MediaPicker
    value={formData.bunnyVideoId
      ? `https://${process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME ?? 'vz-b4f34ae0-620.b-cdn.net'}/${formData.bunnyVideoId}/thumbnail.jpg`
      : null}
    onChange={(url) => {
      // MediaPicker returns thumbnail URL for video; extract videoId
      // For videos selected from library, the URL is the thumbnail
      // We need to store the bunnyVideoId separately
      // This is handled by checking if the selected media has bunnyVideoId
      setFormData(prev => ({ ...prev, bunnyVideoId: '', thumbnailUrl: url ?? '' }))
    }}
    type="VIDEO"
  />
  <p className="text-xs text-muted-foreground">Vælg en video fra mediebiblioteket</p>
</div>
```

**Note:** The video picker integration is more complex because we need the `bunnyVideoId`, not just the URL. A better approach is to extend MediaPicker to also return the full media object. Add an optional `onSelectMedia` callback:

In `components/admin/media-picker.tsx`, add to props:
```typescript
onSelectMedia?: (media: MediaItem) => void
```

And in `handleSelect`:
```typescript
function handleSelect(item: MediaItem) {
  onChange(item.url)
  onSelectMedia?.(item)
  setOpen(false)
}
```

Then in content-form:
```tsx
<MediaPicker
  value={formData.thumbnailUrl || null}
  onChange={(url) => setFormData(prev => ({ ...prev, thumbnailUrl: url ?? '' }))}
  onSelectMedia={(media) => {
    if (media.bunnyVideoId) {
      setFormData(prev => ({
        ...prev,
        bunnyVideoId: media.bunnyVideoId ?? '',
        thumbnailUrl: media.url,
      }))
    }
  }}
  type="VIDEO"
/>
```

Replace the `thumbnailUrl` Input section with:
```tsx
<div className="space-y-2">
  <Label>Thumbnail</Label>
  <MediaPicker
    value={formData.thumbnailUrl || null}
    onChange={(url) => setFormData(prev => ({ ...prev, thumbnailUrl: url ?? '' }))}
    type="IMAGE"
  />
</div>
```

**Step 2: Verify build**

```bash
npx next build 2>&1 | tail -5
```

**Step 3: Commit**

```bash
git add app/admin/content/_components/content-form.tsx components/admin/media-picker.tsx
git commit -m "feat(media): integrate MediaPicker into content form with video support"
```

---

### Task 11: Integrate MediaPicker into Journey Form

**Files:**
- Modify: `app/admin/journeys/_components/journey-form.tsx` (or equivalent)

**Context:** Journey form has a `coverImageUrl` field. Replace with MediaPicker.

**Step 1: Find and update the journey form**

Look for the `coverImageUrl` Input in the journey form and replace with:

```tsx
import { MediaPicker } from '@/components/admin/media-picker'

// Replace the coverImageUrl Input with:
<div className="space-y-2">
  <Label>Coverbillede</Label>
  <MediaPicker
    value={formData.coverImageUrl || null}
    onChange={(url) => setFormData(prev => ({ ...prev, coverImageUrl: url ?? '' }))}
    type="IMAGE"
  />
</div>
```

**Step 2: Verify build**

```bash
npx next build 2>&1 | tail -5
```

**Step 3: Commit**

```bash
git add app/admin/journeys/
git commit -m "feat(media): integrate MediaPicker into journey form"
```

---

### Task 12: Supabase Storage Bucket Setup + Final Build Verification

**Files:**
- No code changes — infrastructure setup

**Step 1: Create Supabase Storage bucket**

Go to Supabase Dashboard → Storage → New Bucket:
- Name: `media`
- Public: Yes (public bucket for CDN access)
- File size limit: 25 MB
- Allowed MIME types: `image/jpeg, image/png, image/webp, image/gif, image/svg+xml`

Or via SQL in Supabase SQL editor:
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  26214400,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
);
```

**Step 2: Verify SUPABASE_SERVICE_ROLE_KEY is set**

Check `.env.local` has `SUPABASE_SERVICE_ROLE_KEY` set to the actual service role key (not the anon key — they should be different). The service role key is found in Supabase Dashboard → Settings → API → service_role key.

**Step 3: Final build**

```bash
cd .worktrees/media-library
npx next build
```

Expected: Full build succeeds with no errors.

**Step 4: Manual smoke test**

1. Start dev server: `npm run dev`
2. Go to `/admin/media` — should show empty state
3. Upload an image — should appear in grid
4. Click image — should show detail dialog with URL, alt text, delete
5. Go to `/admin/products/[id]/edit` — cover/thumbnail should show MediaPicker
6. Click "Vælg medie" — should open dialog with uploaded image
7. Select image — should set URL in form

**Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "feat(media): final polish and fixes"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Prisma schema + migration | `prisma/schema.prisma` |
| 2 | Media service + validators | `lib/services/media.service.ts`, `lib/validators/media.ts` |
| 3 | Supabase Storage helper | `lib/supabase/storage.ts` |
| 4 | Image upload API route | `app/api/admin/media/upload/route.ts` |
| 5 | Video upload API route | `app/api/admin/media/upload-video/route.ts` |
| 6 | List + delete API routes | `app/api/admin/media/route.ts`, `app/api/admin/media/[id]/route.ts` |
| 7 | MediaPicker component | `components/admin/media-picker.tsx` |
| 8 | Admin media page | `app/admin/media/page.tsx`, grid + detail components |
| 9 | Product form integration | `app/admin/products/_components/product-form.tsx` |
| 10 | Content form integration | `app/admin/content/_components/content-form.tsx` |
| 11 | Journey form integration | `app/admin/journeys/_components/journey-form.tsx` |
| 12 | Supabase bucket + smoke test | Infrastructure + manual verification |
