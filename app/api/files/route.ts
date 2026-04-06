import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Ikke autoriseret' }, { status: 401 })
  }

  const storageApiKey = process.env.BUNNY_STORAGE_API_KEY
  const storageZone = process.env.BUNNY_STORAGE_ZONE
  const cdnHostname = process.env.BUNNY_STORAGE_CDN_HOSTNAME
  const region = process.env.BUNNY_STORAGE_REGION

  if (!storageApiKey || !storageZone || !cdnHostname) {
    return NextResponse.json({ error: 'Bunny Storage ikke konfigureret' }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const folder = searchParams.get('folder') ?? 'pdf'

  const regionPrefix = region ? `${region}.` : ''
  const baseUrl = `https://${regionPrefix}storage.bunnycdn.com/${storageZone}/${folder}/`

  const res = await fetch(baseUrl, {
    headers: { AccessKey: storageApiKey },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    // Folder doesn't exist yet — return empty
    if (res.status === 404) {
      return NextResponse.json({ files: [] })
    }
    return NextResponse.json({ error: 'Kunne ikke hente filer' }, { status: 500 })
  }

  const items = await res.json() as Array<{
    ObjectName: string
    Length: number
    LastChanged: string
    IsDirectory: boolean
  }>

  const files = items
    .filter((f) => !f.IsDirectory)
    .map((f) => ({
      name: f.ObjectName,
      size: f.Length,
      url: `https://${cdnHostname}/${folder}/${f.ObjectName}`,
      lastModified: f.LastChanged,
    }))
    .sort((a, b) => b.lastModified.localeCompare(a.lastModified))

  return NextResponse.json({ files })
}
