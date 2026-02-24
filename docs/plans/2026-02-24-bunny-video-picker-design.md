# Bunny.net Video Picker — Design

## Goal

Replace the manual "Bunny Video ID" text input in the admin content form with a modal video picker that lets admins browse existing Bunny.net Stream videos and upload new ones directly.

## Architecture

```
content-form.tsx
  └── <BunnyVideoPicker>  (Dialog component)
        ├── Browse tab: search + thumbnail grid + pagination
        └── Upload tab: drag/drop zone + TUS progress bar

API routes (server-side, keeps BUNNY_API_KEY safe):
  /api/admin/bunny/videos        → GET: list/search videos
  /api/admin/bunny/upload-token  → POST: create video + return TUS credentials
```

## Data Flow

### Browse

1. User clicks "Vælg video" → Dialog opens
2. Client fetches `/api/admin/bunny/videos?search=&page=1`
3. API route calls `GET https://video.bunnycdn.com/library/{id}/videos` with `AccessKey` header
4. Returns `{ items, totalItems, currentPage, itemsPerPage }` to client
5. User clicks a video thumbnail → Dialog closes, form fields populated:
   - `bunnyVideoId` = video.guid
   - `thumbnailUrl` = auto-generated from CDN hostname
   - `durationMinutes` = Math.ceil(video.length / 60)

### Upload

1. User switches to "Upload" tab, drops/selects a file
2. Client calls `/api/admin/bunny/upload-token` with `{ title: filename }`
3. Server creates video via Bunny API, generates SHA256 signature: `SHA256(libraryId + apiKey + expirationTime + videoId)`
4. Returns `{ videoId, libraryId, signature, expirationTime }` to client
5. Client uses `tus-js-client` for resumable upload directly to `https://video.bunnycdn.com/tusupload`
6. Progress bar shown during upload
7. On completion, video auto-selected (same as browse selection)

## Component Design

**BunnyVideoPicker** — Dialog with two tabs:

| Tab | Content |
|-----|---------|
| **Gennemse** | Search input, video grid (thumbnail + title + duration + status badge), pagination |
| **Upload** | Drag/drop zone, file name, progress bar, cancel button |

Video grid item shows:
- Thumbnail (160×90)
- Title (truncated)
- Duration (formatted)
- Status badge: "Klar" (status=4) / "Behandler..." (status<4)
- Only status=4 videos are selectable

**Selected video preview** — after selection, show a mini preview card in the form (thumbnail + title + "Skift" button) instead of raw video ID.

## Files

| Action | File |
|--------|------|
| Create | `app/api/admin/bunny/videos/route.ts` — list/search API |
| Create | `app/api/admin/bunny/upload-token/route.ts` — create video + TUS creds |
| Create | `app/admin/content/_components/bunny-video-picker.tsx` — Dialog component |
| Modify | `app/admin/content/_components/content-form.tsx` — replace text input with picker |
| Modify | `lib/bunny.ts` — add `listVideos()` and `createUploadToken()` functions |
| Add dep | `tus-js-client` — npm package for resumable browser uploads |

## Security

- API routes use `requireAdmin()` guard — no public access
- `BUNNY_API_KEY` never leaves server side
- TUS signature generated server-side, expires in 24h
- No client-side API key exposure

## Error Handling

- Bunny API down → inline error in dialog: "Kunne ikke hente videoer — prøv igen"
- Upload fails → tus-js-client auto-retries; manual retry button after 3 failures
- Video still processing (status < 4) → shown but not selectable, grey overlay
