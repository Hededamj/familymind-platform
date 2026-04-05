/**
 * Bunny.net Edge Storage — til PDF, lyd og andre filer.
 * Separat fra bunny.ts (som er Bunny Stream til video).
 *
 * Kræver env vars:
 *   BUNNY_STORAGE_API_KEY — Storage zone API key
 *   BUNNY_STORAGE_ZONE — Storage zone navn (f.eks. "familymind-files")
 *   BUNNY_STORAGE_CDN_HOSTNAME — CDN hostname (f.eks. "familymind-files.b-cdn.net")
 *   BUNNY_STORAGE_REGION — Valgfrit, f.eks. "de" for Frankfurt (default: Falkenstein)
 */

function getStorageConfig() {
  const apiKey = process.env.BUNNY_STORAGE_API_KEY
  const storageZone = process.env.BUNNY_STORAGE_ZONE
  const cdnHostname = process.env.BUNNY_STORAGE_CDN_HOSTNAME
  const region = process.env.BUNNY_STORAGE_REGION

  if (!apiKey || !storageZone || !cdnHostname) {
    throw new Error(
      'Missing Bunny Storage env vars. Required: BUNNY_STORAGE_API_KEY, BUNNY_STORAGE_ZONE, BUNNY_STORAGE_CDN_HOSTNAME'
    )
  }

  // Regional endpoints: https://docs.bunny.net/reference/storage-api
  const regionPrefix = region ? `${region}.` : ''
  const baseUrl = `https://${regionPrefix}storage.bunnycdn.com/${storageZone}`

  return { apiKey, storageZone, cdnHostname, baseUrl }
}

/**
 * Upload en fil til Bunny Storage.
 * Returnerer den offentlige CDN-URL.
 */
export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  folder: string = 'content'
): Promise<string> {
  const { apiKey, cdnHostname, baseUrl } = getStorageConfig()

  const path = `/${folder}/${fileName}`

  const response = await fetch(`${baseUrl}${path}`, {
    method: 'PUT',
    headers: {
      AccessKey: apiKey,
      'Content-Type': 'application/octet-stream',
    },
    body: new Uint8Array(buffer),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Bunny Storage upload failed (${response.status}): ${text}`)
  }

  return `https://${cdnHostname}${path}`
}

/**
 * Slet en fil fra Bunny Storage.
 */
export async function deleteFile(
  fileName: string,
  folder: string = 'content'
): Promise<void> {
  const { apiKey, baseUrl } = getStorageConfig()

  const path = `/${folder}/${fileName}`

  const response = await fetch(`${baseUrl}${path}`, {
    method: 'DELETE',
    headers: {
      AccessKey: apiKey,
    },
  })

  if (!response.ok && response.status !== 404) {
    throw new Error(`Bunny Storage delete failed: ${response.status}`)
  }
}
