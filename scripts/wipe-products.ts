import { prisma } from '@/lib/prisma'

async function main() {
  // Null out foreign keys first to avoid FK errors
  await prisma.journey.updateMany({ data: { productId: null } })
  await prisma.discountCode.updateMany({ data: { applicableProductId: null } })

  // Delete in dependency order
  await prisma.entitlement.deleteMany()
  await prisma.priceVariant.deleteMany()
  await prisma.bundleItem.deleteMany()
  await prisma.courseLesson.deleteMany()
  await prisma.courseModule.deleteMany()
  await prisma.product.deleteMany()

  // Also delete PRODUCT-type recommendation rules
  await prisma.recommendationRule.deleteMany({ where: { targetType: 'PRODUCT' } })

  console.log('Wiped.')
}
main().finally(() => prisma.$disconnect())
