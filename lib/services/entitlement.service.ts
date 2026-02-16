import { prisma } from '@/lib/prisma'

const activeEntitlementFilter = {
  status: 'ACTIVE' as const,
  OR: [
    { expiresAt: null },
    { expiresAt: { gt: new Date() } },
  ],
}

export async function createEntitlement(data: {
  userId: string
  productId: string
  source: 'PURCHASE' | 'SUBSCRIPTION' | 'GIFT' | 'B2B_LICENSE'
  stripeSubscriptionId?: string
  organizationId?: string
  expiresAt?: Date
}) {
  return prisma.entitlement.create({ data })
}

export async function getUserEntitlements(userId: string) {
  return prisma.entitlement.findMany({
    where: { userId, ...activeEntitlementFilter },
    include: { product: true },
  })
}

export async function canAccessContent(
  userId: string,
  contentUnitId: string
): Promise<boolean> {
  const content = await prisma.contentUnit.findUnique({
    where: { id: contentUnitId },
    include: { courseLessons: true },
  })

  if (!content) return false
  if (content.isFree || content.accessLevel === 'FREE') return true

  // Check if user has active subscription for SUBSCRIPTION content
  if (content.accessLevel === 'SUBSCRIPTION') {
    const subEntitlement = await prisma.entitlement.findFirst({
      where: {
        userId,
        ...activeEntitlementFilter,
        product: { type: 'SUBSCRIPTION' },
      },
    })
    if (subEntitlement) return true
  }

  // Check if user owns a product containing this content
  const productIds = content.courseLessons.map((cl) => cl.productId)
  if (productIds.length > 0) {
    const entitlement = await prisma.entitlement.findFirst({
      where: {
        userId,
        ...activeEntitlementFilter,
        productId: { in: productIds },
      },
    })
    if (entitlement) return true
  }

  // Check standalone single product
  if (content.isStandalone) {
    const singleProduct = await prisma.product.findFirst({
      where: {
        type: 'SINGLE',
        courseLessons: { some: { contentUnitId } },
      },
    })
    if (singleProduct) {
      const ent = await prisma.entitlement.findFirst({
        where: { userId, productId: singleProduct.id, ...activeEntitlementFilter },
      })
      if (ent) return true
    }
  }

  // Check bundle entitlements (user owns a bundle that includes a product with this content)
  const bundleEntitlements = await prisma.entitlement.findMany({
    where: {
      userId,
      ...activeEntitlementFilter,
      product: { type: 'BUNDLE' },
    },
    include: { product: { include: { bundleItems: true } } },
  })
  for (const be of bundleEntitlements) {
    const bundledProductIds = be.product.bundleItems.map(
      (bi) => bi.includedProductId
    )
    const hasContent = await prisma.courseLesson.findFirst({
      where: { productId: { in: bundledProductIds }, contentUnitId },
    })
    if (hasContent) return true
  }

  // Check org-level entitlements
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.organizationId) {
    const orgEntitlements = await prisma.entitlement.findMany({
      where: { organizationId: user.organizationId, ...activeEntitlementFilter },
    })
    // If org has any relevant entitlement, grant access
    for (const oe of orgEntitlements) {
      // Simplified: if org has subscription, grant subscription-level
      if (content.accessLevel === 'SUBSCRIPTION') {
        const subProduct = await prisma.product.findFirst({
          where: { id: oe.productId, type: 'SUBSCRIPTION' },
        })
        if (subProduct) return true
      }
    }
  }

  return false
}

export async function revokeEntitlement(id: string) {
  return prisma.entitlement.update({
    where: { id },
    data: { status: 'CANCELLED' },
  })
}

export async function updateEntitlementStatus(
  stripeSubscriptionId: string,
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
) {
  return prisma.entitlement.updateMany({
    where: { stripeSubscriptionId },
    data: { status },
  })
}
