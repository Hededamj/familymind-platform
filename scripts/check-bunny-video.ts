import { getVideoDetails, getSignedPlaybackUrl, getThumbnailUrl } from '../lib/bunny'

async function main() {
  const videoId = 'dc979285-1cdd-4360-8777-382b42ca79ca'

  console.log('--- Video Details ---')
  try {
    const details = await getVideoDetails(videoId)
    console.log(JSON.stringify(details, null, 2))
    console.log('Status 4 = finished processing')
  } catch (e: any) {
    console.error('Failed to get video details:', e.message)
  }

  console.log('\n--- Playback URL ---')
  try {
    const url = await getSignedPlaybackUrl(videoId)
    console.log(url)
  } catch (e: any) {
    console.error('Failed to get playback URL:', e.message)
  }

  console.log('\n--- Thumbnail URL ---')
  console.log(getThumbnailUrl(videoId))
}

main().catch(console.error)
