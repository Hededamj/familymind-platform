const BUNNY_API_KEY = process.env.BUNNY_API_KEY!
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID!
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME!
const BUNNY_TOKEN_AUTH_KEY = process.env.BUNNY_TOKEN_AUTH_KEY!

const BUNNY_API_BASE = 'https://video.bunnycdn.com/library'

/**
 * Create a new video in the Bunny.net Stream library.
 * Returns the video ID and a direct upload URL (TUS protocol).
 */
export async function createVideoUpload(title: string) {
  const response = await fetch(
    `${BUNNY_API_BASE}/${BUNNY_LIBRARY_ID}/videos`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        AccessKey: BUNNY_API_KEY,
      },
      body: JSON.stringify({ title }),
    }
  )

  if (!response.ok) {
    throw new Error(`Bunny.net create video failed: ${response.status}`)
  }

  const video = await response.json()

  return {
    videoId: video.guid as string,
    // TUS upload URL for direct upload from the browser
    uploadUrl: `https://video.bunnycdn.com/tusupload`,
    // Headers needed for TUS upload
    uploadHeaders: {
      AuthorizationSignature: '', // Generated per-upload, see Bunny docs
      AuthorizationExpire: '',
      VideoId: video.guid as string,
      LibraryId: BUNNY_LIBRARY_ID,
    },
  }
}

/**
 * Generate a signed/token-authenticated playback URL for a video.
 * Uses Bunny.net's token authentication to protect video content.
 *
 * @param videoId - The Bunny.net video GUID
 * @param expiresInSeconds - How long the URL should be valid (default 24 hours)
 */
export async function getSignedPlaybackUrl(
  videoId: string,
  expiresInSeconds = 86400
): Promise<string> {
  // Bunny.net Stream uses token authentication for signed URLs
  // The token is a SHA256 hash of: token_auth_key + videoId + expiry
  const expiry = Math.floor(Date.now() / 1000) + expiresInSeconds
  const hashableBase = `${BUNNY_TOKEN_AUTH_KEY}${videoId}${expiry}`

  // Use Web Crypto API (available in Node.js 18+)
  const encoder = new TextEncoder()
  const data = encoder.encode(hashableBase)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const token = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return `https://${BUNNY_CDN_HOSTNAME}/${videoId}/playlist.m3u8?token=${token}&expires=${expiry}`
}

/**
 * Get the thumbnail URL for a video.
 * Bunny.net auto-generates thumbnails.
 */
export function getThumbnailUrl(videoId: string): string {
  return `https://${BUNNY_CDN_HOSTNAME}/${videoId}/thumbnail.jpg`
}

/**
 * Delete a video from the Bunny.net Stream library.
 */
export async function deleteVideo(videoId: string): Promise<void> {
  const response = await fetch(
    `${BUNNY_API_BASE}/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
    {
      method: 'DELETE',
      headers: {
        AccessKey: BUNNY_API_KEY,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Bunny.net delete video failed: ${response.status}`)
  }
}

/**
 * Get video details from Bunny.net Stream.
 */
export async function getVideoDetails(videoId: string) {
  const response = await fetch(
    `${BUNNY_API_BASE}/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
    {
      method: 'GET',
      headers: {
        AccessKey: BUNNY_API_KEY,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Bunny.net get video failed: ${response.status}`)
  }

  const video = await response.json()

  return {
    videoId: video.guid as string,
    title: video.title as string,
    status: video.status as number, // 4 = finished processing
    length: video.length as number, // duration in seconds
    thumbnailUrl: getThumbnailUrl(video.guid),
  }
}
