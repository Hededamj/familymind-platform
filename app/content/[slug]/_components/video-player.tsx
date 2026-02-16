'use client'

import { useRef, useEffect } from 'react'

export function VideoPlayer({
  src,
  poster,
}: {
  src: string
  poster?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // For future HLS.js integration on Chrome/Firefox:
    // if (Hls.isSupported()) { ... }
    // For now, native <video> handles HLS on Safari and
    // progressive download on other browsers.
  }, [src])

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls
        playsInline
        className="h-full w-full"
      >
        Din browser underst&oslash;tter ikke videoafspilning.
      </video>
    </div>
  )
}
