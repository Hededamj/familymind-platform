import { prisma } from '@/lib/prisma'

const activeEntitlementFilter = {
  status: 'ACTIVE' as const,
  OR: [
    { expiresAt: null },
    { expiresAt: { gt: new Date() } },
  ],
}

export async function createEntitlement(
  data: {
    userId: string
    productId: string
    source: 'PURCHASE' | 'SUBSCRIPTION' | 'GIFT' | 'B2B_LICENSE'
    stripeSubscriptionId?: string
    stripeCheckoutSessionId?: string
    organizationId?: string
    expiresAt?: Date
    paidAmountCents?: number
    paidCurrency?: string
    priceVariantId?: string
  },
  tx?: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
) {
  const db = tx ?? prisma
  return db.entitlement.create({ data })
}

export async function getUserEntitlements(userId: string) {
  return prisma.entitlement.findMany({
    where: { userId, ...activeEntitlementFilter },
    include: { product: true, priceVariant: true },
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

  // Check if user has active subscription for SUBSCRIPTION content.
  // SUBSCRIPTION-products may have bundleItems — if so, the subscription only
  // grants access to content inside those scoped products. If no bundleItems,
  // it's a "everything" subscription (legacy behavior).
  if (content.accessLevel === 'SUBSCRIPTION') {
    const subEntitlements = await prisma.entitlement.findMany({
      where: {
        userId,
        ...activeEntitlementFilter,
        product: { type: 'SUBSCRIPTION' },
      },
      include: { product: { include: { bundleItems: true } } },
    })
    for (const ent of subEntitlements) {
      if (ent.product.bundleItems.length === 0) {
        // Unscoped subscription — grants access to all SUBSCRIPTION content
        return true
      }
      // Direct contentUnit reference inside bundle items
      const directHit = ent.product.bundleItems.some(
        (bi) => bi.includedContentUnitId === contentUnitId
      )
      if (directHit) return true
      // Scoped subscription — only content inside the bundled products
      const bundledIds = ent.product.bundleItems
        .map((bi) => bi.includedProductId)
        .filter((id): id is string => id !== null)
      if (bundledIds.length > 0) {
        const hasContent = await prisma.courseLesson.findFirst({
          where: { productId: { in: bundledIds }, contentUnitId },
        })
        if (hasContent) return true
      }
    }
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
  if (bundleEntitlements.length > 0) {
    // Direct contentUnit reference inside bundle items
    const directHit = bundleEntitlements.some((be) =>
      be.product.bundleItems.some(
        (bi) => bi.includedContentUnitId === contentUnitId
      )
    )
    if (directHit) return true
    const allBundledProductIds = bundleEntitlements
      .flatMap((be) => be.product.bundleItems.map((bi) => bi.includedProductId))
      .filter((id): id is string => id !== null)
    if (allBundledProductIds.length > 0) {
      const hasContent = await prisma.courseLesson.findFirst({
        where: { productId: { in: allBundledProductIds }, contentUnitId },
      })
      if (hasContent) return true
    }
  }

  // Check org-level entitlements.
  // Only SUBSCRIPTION content can be unlocked via org — COURSE/SINGLE products
  // require individual entitlements (purchased or bundled) checked above.
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.organizationId && content.accessLevel === 'SUBSCRIPTION') {
    const orgSubEntitlement = await prisma.entitlement.findFirst({
      where: {
        organizationId: user.organizationId,
        ...activeEntitlementFilter,
        product: { type: 'SUBSCRIPTION' },
      },
    })
    if (orgSubEntitlement) return true
  }

  return false
}

export async function revokeEntitlement(id: string) {
  return prisma.entitlement.update({
    where: { id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  })
}

export async function updateEntitlementStatus(
  stripeSubscriptionId: string,
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
) {
  return prisma.entitlement.updateMany({
    where: { stripeSubscriptionId },
    data: {
      status,
      cancelledAt: status === 'CANCELLED' ? new Date() : undefined,
    },
  })
}
