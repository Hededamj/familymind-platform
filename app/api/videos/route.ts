import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Ikke autoriseret' }, { status: 401 })
  }

  const apiKey = process.env.BUNNY_API_KEY
  const libraryId = process.env.BUNNY_LIBRARY_ID
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME

  if (!apiKey || !libraryId || !cdnHostname) {
    return NextResponse.json({ error: 'Bunny.net ikke konfigureret' }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const perPage = 20

  const params = new URLSearchParams({
    page: String(page),
    itemsPerPage: String(perPage),
    orderBy: 'date',
  })
  if (search) params.set('search', search)

  const res = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos?${params}`,
    { headers: { AccessKey: apiKey }, next: { revalidate: 0 } }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Kunne ikke hente videoer' }, { status: 500 })
  }

  const data = await res.json()

  const videos = (data.items ?? []).map((v: Record<string, unknown>) => ({
    id: v.guid as string,
    title: v.title as string,
    duration: v.length as number,
    status: v.status as number, // 4 = finished
    thumbnail: `https://${cdnHostname}/${v.guid}/thumbnail.jpg`,
    createdAt: v.dateUploaded as string,
  }))

  return NextResponse.json({
    videos,
    totalItems: data.totalItems ?? 0,
    currentPage: data.currentPage ?? page,
  })
}
