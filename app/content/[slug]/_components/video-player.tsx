'use client'

import { useEffect, useRef } from 'react'
import Hls from 'hls.js'

export function VideoPlayer({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari — native HLS support
      video.src = src
    } else if (Hls.isSupported()) {
      // Chrome, Firefox, etc. — use HLS.js
      const hls = new Hls()
      hls.loadSource(src)
      hls.attachMedia(video)
      return () => hls.destroy()
    }
  }, [src])

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <video
        ref={videoRef}
        poster={poster}
        controls
        playsInline
        className="h-full w-full"
      >
        Din browser understøtter ikke videoafspilning.
      </video>
    </div>
  )
}
