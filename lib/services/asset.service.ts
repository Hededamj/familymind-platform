import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
])

/**
 * Persist a binary blob in the Asset table and return the public URL the
 * browser should reference. Dedupes on sha256 of the bytes so re-uploading
 * the same file (e.g. the same logo twice) reuses the existing row instead
 * of writing a second copy.
 */
export async function storeAsset(input: {
  bytes: Buffer
  mime: string
}): Promise<{ id: string; url: string }> {
  const etag = createHash('sha256').update(input.bytes).digest('hex')
  const existing = await prisma.asset.findUnique({
    where: { etag },
    select: { id: true },
  })
  if (existing) {
    return { id: existing.id, url: `/api/assets/${existing.id}` }
  }

  // Prisma's Bytes column wants Uint8Array<ArrayBuffer>; Buffer is a Uint8Array
  // but TS treats its backing buffer as ArrayBufferLike (which includes
  // SharedArrayBuffer), so we copy into a fresh Uint8Array to satisfy the type.
  const data = new Uint8Array(input.bytes.byteLength)
  data.set(input.bytes)

  const created = await prisma.asset.create({
    data: {
      bytes: data,
      mime: input.mime,
      etag,
      byteSize: input.bytes.byteLength,
    },
    select: { id: true },
  })
  return { id: created.id, url: `/api/assets/${created.id}` }
}

export async function getAsset(id: string) {
  return prisma.asset.findUnique({
    where: { id },
    select: { bytes: true, mime: true, etag: true, byteSize: true },
  })
}

export function isAllowedImageMime(mime: string): boolean {
  return ALLOWED_IMAGE_MIMES.has(mime)
}
