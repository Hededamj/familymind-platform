import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { uploadFile } from '@/lib/bunny-storage'
import { storeAsset } from '@/lib/services/asset.service'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB for images
const ALLOWED_TYPES: Record<string, string[]> = {
  PDF: ['application/pdf'],
  AUDIO: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/x-m4a'],
  IMAGE: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/x-icon',
    'image/vnd.microsoft.icon',
  ],
}

export async function POST(req: Request) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Ikke autoriseret' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const mediaType = formData.get('mediaType') as string | null

  if (!file || !mediaType) {
    return NextResponse.json({ error: 'Fil og medietype er påkrævet' }, { status: 400 })
  }

  const sizeLimit = mediaType === 'IMAGE' ? MAX_IMAGE_SIZE : MAX_FILE_SIZE
  if (file.size > sizeLimit) {
    const limitMb = Math.round(sizeLimit / (1024 * 1024))
    return NextResponse.json({ error: `Filen er for stor (max ${limitMb} MB)` }, { status: 400 })
  }

  const allowedMimes = ALLOWED_TYPES[mediaType]
  if (!allowedMimes || !allowedMimes.includes(file.type)) {
    return NextResponse.json(
      { error: `Ugyldig filtype "${file.type}" for ${mediaType}` },
      { status: 400 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // Images go to Postgres via the Asset table; PDF/AUDIO stay on Bunny
  // because they are large and the platform is the same egress origin
  // either way once content scales.
  if (mediaType === 'IMAGE') {
    const { url } = await storeAsset({ bytes: buffer, mime: file.type })
    return NextResponse.json({ url })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const timestamp = Date.now()
  const safeName = file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .slice(0, 60)
  const fileName = `${safeName}-${timestamp}.${ext}`
  const folder = mediaType === 'PDF' ? 'pdf' : 'audio'

  const url = await uploadFile(buffer, fileName, folder)

  return NextResponse.json({ url })
}
