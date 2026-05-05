import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { isAllowedImageMime, storeAsset } from '@/lib/services/asset.service'
import { updateUserAvatar } from '@/lib/services/user.service'

const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5 MB

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
  if (!isAllowedImageMime(file.type)) {
    return NextResponse.json(
      { error: `Ugyldig filtype "${file.type}"` },
      { status: 400 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const { url } = await storeAsset({ bytes: buffer, mime: file.type })

  await updateUserAvatar(user.id, url)

  return NextResponse.json({ url })
}

export async function DELETE() {
  const user = await requireAuth()
  await updateUserAvatar(user.id, null)
  return NextResponse.json({ ok: true })
}
