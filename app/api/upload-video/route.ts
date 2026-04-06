'use server'

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createHash } from 'crypto'

export async function POST(req: Request) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Ikke autoriseret' }, { status: 401 })
  }

  const { title } = await req.json()
  if (!title || typeof title !== 'string') {
    return NextResponse.json({ error: 'Titel er påkrævet' }, { status: 400 })
  }

  const apiKey = process.env.BUNNY_API_KEY
  const libraryId = process.env.BUNNY_LIBRARY_ID

  if (!apiKey || !libraryId) {
    return NextResponse.json({ error: 'Bunny.net ikke konfigureret' }, { status: 500 })
  }

  // 1. Create video in Bunny Stream
  const createRes = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        AccessKey: apiKey,
      },
      body: JSON.stringify({ title }),
    }
  )

  if (!createRes.ok) {
    const text = await createRes.text()
    return NextResponse.json({ error: `Kunne ikke oprette video: ${text}` }, { status: 500 })
  }

  const video = await createRes.json()
  const videoId = video.guid as string

  // 2. Generate TUS upload auth signature
  const expirationTime = Math.floor(Date.now() / 1000) + 3600 // 1 hour
  const signatureHash = createHash('sha256')
    .update(`${libraryId}${apiKey}${expirationTime}${videoId}`)
    .digest('hex')

  return NextResponse.json({
    videoId,
    libraryId,
    expirationTime,
    signature: signatureHash,
  })
}
