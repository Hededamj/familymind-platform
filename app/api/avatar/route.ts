import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { uploadFile } from '@/lib/bunny-storage'
import { updateUserAvatar } from '@/lib/services/user.service'

const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

export async function POST(req: Request) {
  const user = await requireAuth()

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Fil mangler' }, { status: 400 })
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return NextResponse.json(
      { error: 'Billedet er for stort (max 5 MB)' },
      { status: 400 }
    )
  }
  if (!ALLOWED_MIMES.has(file.type)) {
    return NextResponse.json(
      { error: `Ugyldig filtype "${file.type}"` },
      { status: 400 }
    )
  }

  // Filename includes userId so each upload overwrites the user's namespace
  // and never collides with other users. Timestamp suffix busts the CDN cache
  // when the user changes their avatar.
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
  const fileName = `${user.id}-${Date.now()}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const url = await uploadFile(buffer, fileName, 'avatars')

  await updateUserAvatar(user.id, url)

  return NextResponse.json({ url })
}

export async function DELETE() {
  const user = await requireAuth()
  await updateUserAvatar(user.id, null)
  return NextResponse.json({ ok: true })
}
