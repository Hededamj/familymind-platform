const BUNNY_API_BASE = 'https://video.bunnycdn.com/library'

function getBunnyConfig() {
  const apiKey = process.env.BUNNY_API_KEY
  const libraryId = process.env.BUNNY_LIBRARY_ID
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME
  const tokenAuthKey = process.env.BUNNY_TOKEN_AUTH_KEY

  if (!apiKey || !libraryId || !cdnHostname) {
    throw new Error(
      'Missing Bunny.net environment variables. Required: BUNNY_API_KEY, BUNNY_LIBRARY_ID, BUNNY_CDN_HOSTNAME'
    )
  }

  return { apiKey, libraryId, cdnHostname, tokenAuthKey }
}

/**
 * Create a new video in the Bunny.net Stream library.
 * Returns the video ID and a direct upload URL (TUS protocol).
 */
export async function createVideoUpload(title: string) {
  const { apiKey, libraryId } = getBunnyConfig()

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

  return {
    videoId: video.guid as string,
    // TUS upload URL for direct upload from the browser
    uploadUrl: `https://video.bunnycdn.com/tusupload`,
    // Headers needed for TUS upload
    uploadHeaders: {
      AuthorizationSignature: '', // Generated per-upload, see Bunny docs
      AuthorizationExpire: '',
      VideoId: video.guid as string,
      LibraryId: libraryId,
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
  const { tokenAuthKey, cdnHostname } = getBunnyConfig()

  const path = `/${videoId}/playlist.m3u8`

  // If token auth key is not configured, use direct (unsigned) URL
  if (!tokenAuthKey) {
    return `https://${cdnHostname}${path}`
  }

  // Bunny.net CDN Token Auth: Base64(MD5(key + path + expiry))
  // with URL-safe character replacement (+→- /→_ =→removed)
  const { createHash } = await import('crypto')
  const expiry = Math.floor(Date.now() / 1000) + expiresInSeconds
  const hashableBase = `${tokenAuthKey}${path}${expiry}`
  const md5Hash = createHash('md5').update(hashableBase).digest('base64')
  const token = md5Hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  return `https://${cdnHostname}${path}?token=${token}&expires=${expiry}`
}

/**
 * Get the thumbnail URL for a video.
 * Bunny.net auto-generates thumbnails.
 */
export function getThumbnailUrl(videoId: string): string {
  const { cdnHostname } = getBunnyConfig()
  return `https://${cdnHostname}/${videoId}/thumbnail.jpg`
}

/**
 * Delete a video from the Bunny.net Stream library.
 */
export async function deleteVideo(videoId: string): Promise<void> {
  const { apiKey, libraryId } = getBunnyConfig()

  const response = await fetch(
    `${BUNNY_API_BASE}/${libraryId}/videos/${videoId}`,
    {
      method: 'DELETE',
      headers: {
        AccessKey: apiKey,
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
  const { apiKey, libraryId } = getBunnyConfig()

  const response = await fetch(
    `${BUNNY_API_BASE}/${libraryId}/videos/${videoId}`,
    {
      method: 'GET',
      headers: {
        AccessKey: apiKey,
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
