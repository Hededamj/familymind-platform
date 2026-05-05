import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAsset } from '@/lib/services/asset.service'

const idSchema = z.string().uuid()

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const parsed = idSchema.safeParse(id)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const asset = await getAsset(parsed.data)
  if (!asset) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Strong validators let the browser revalidate cheaply when we eventually
  // bump max-age. The asset id is content-addressed via etag, so a 200 today
  // is bit-for-bit identical forever — safe to mark immutable.
  const etag = `"${asset.etag}"`
  const ifNoneMatch = req.headers.get('if-none-match')
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: { ETag: etag, 'Cache-Control': 'public, max-age=31536000, immutable' },
    })
  }

  return new NextResponse(new Uint8Array(asset.bytes), {
    status: 200,
    headers: {
      'Content-Type': asset.mime,
      'Content-Length': String(asset.byteSize),
      ETag: etag,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
