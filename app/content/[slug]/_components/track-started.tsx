'use client'

import { useEffect, useRef } from 'react'
import { markStartedAction } from '../actions'

interface TrackStartedProps {
  contentUnitId: string
}

export function TrackStarted({ contentUnitId }: TrackStartedProps) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    markStartedAction(contentUnitId)
  }, [contentUnitId])

  return null
}
