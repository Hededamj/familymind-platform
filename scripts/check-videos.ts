import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const videos = await prisma.contentUnit.findMany({
    where: { mediaType: 'VIDEO' },
    select: { id: true, title: true, bunnyVideoId: true, mediaUrl: true, thumbnailUrl: true, slug: true },
  })
  console.log('VIDEO content units:', JSON.stringify(videos, null, 2))

  const withBunny = await prisma.contentUnit.findMany({
    where: { bunnyVideoId: { not: null } },
    select: { id: true, title: true, bunnyVideoId: true, mediaUrl: true, slug: true },
  })
  console.log('With bunnyVideoId:', JSON.stringify(withBunny, null, 2))
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
