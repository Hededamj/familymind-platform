import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({ where: { email: 'jacob@hummelconsult.dk' } })
  if (!user) {
    console.log('User not found')
    return
  }
  console.log('User:', user.id, user.role)

  const products = await prisma.product.findMany({
    select: { id: true, title: true, type: true, slug: true },
  })
  console.log('Products:', JSON.stringify(products, null, 2))

  for (const product of products) {
    const existing = await prisma.entitlement.findFirst({
      where: { userId: user.id, productId: product.id },
    })
    if (existing) {
      console.log(`Already entitled: ${product.title}`)
      continue
    }
    await prisma.entitlement.create({
      data: {
        userId: user.id,
        productId: product.id,
        status: 'ACTIVE',
        source: 'GIFT',
      },
    })
    console.log(`Entitled: ${product.title}`)
  }

  console.log('Done!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
