import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { uploadFile } from '@/lib/bunny-storage'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB
const ALLOWED_TYPES: Record<string, string[]> = {
  PDF: ['application/pdf'],
  AUDIO: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/x-m4a'],
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

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Filen er for stor (max 100 MB)' }, { status: 400 })
  }

  const allowedMimes = ALLOWED_TYPES[mediaType]
  if (!allowedMimes || !allowedMimes.includes(file.type)) {
    return NextResponse.json(
      { error: `Ugyldig filtype "${file.type}" for ${mediaType}` },
      { status: 400 }
    )
  }

  // Generate unique filename
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const timestamp = Date.now()
  const safeName = file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .slice(0, 60)
  const fileName = `${safeName}-${timestamp}.${ext}`
  const folder = mediaType === 'PDF' ? 'pdf' : 'audio'

  const buffer = Buffer.from(await file.arrayBuffer())
  const url = await uploadFile(buffer, fileName, folder)

  return NextResponse.json({ url })
}
