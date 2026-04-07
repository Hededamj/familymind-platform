import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import {
  createProductSchema,
  updateProductSchema,
  landingPageSchema,
} from '@/lib/validators/product'
import { getStripe } from '@/lib/stripe'
import type { z } from 'zod'

type CreateProductInput = z.infer<typeof createProductSchema>
type UpdateProductInput = z.infer<typeof updateProductSchema>

export async function createProduct(data: CreateProductInput) {
  const validated = createProductSchema.parse(data)
  return prisma.product.create({ data: validated })
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  const validated = updateProductSchema.parse(data)
  return prisma.product.update({ where: { id }, data: validated })
}

export async function deleteProduct(id: string) {
  return prisma.$transaction(async (tx) => {
    // Slet relationer der ikke har onDelete: Cascade
    await tx.courseLesson.deleteMany({ where: { productId: id } })
    await tx.courseModule.deleteMany({ where: { productId: id } })
    await tx.entitlement.deleteMany({ where: { productId: id } })
    await tx.discountCode.updateMany({ where: { applicableProductId: id }, data: { applicableProductId: null } })
    await tx.journey.updateMany({ where: { productId: id }, data: { productId: null } })
    return tx.product.delete({ where: { id } })
  })
}

export async function listProducts(filters?: {
  type?: string
  isActive?: boolean
  search?: string
}) {
  return prisma.product.findMany({
    where: {
      ...(filters?.type && { type: filters.type as any }),
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters?.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' as const } },
          { description: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }),
    },
    include: {
      modules: { orderBy: { position: 'asc' } },
      courseLessons: {
        include: { contentUnit: true, module: true },
        orderBy: { position: 'asc' },
      },
      bundleItems: {
        include: { includedProduct: true },
        orderBy: { position: 'asc' },
      },
      journeys: { where: { isActive: true }, select: { id: true, slug: true, title: true } },
      priceVariants: { orderBy: { position: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      modules: { orderBy: { position: 'asc' } },
      courseLessons: {
        include: { contentUnit: true, module: true },
        orderBy: { position: 'asc' },
      },
      bundleItems: {
        include: { includedProduct: true },
        orderBy: { position: 'asc' },
      },
      journeys: { where: { isActive: true }, select: { id: true, slug: true, title: true } },
      priceVariants: { orderBy: { position: 'asc' } },
    },
  })
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      modules: { orderBy: { position: 'asc' } },
      courseLessons: {
        include: { contentUnit: true, module: true },
        orderBy: { position: 'asc' },
      },
      bundleItems: {
        include: { includedProduct: true },
        orderBy: { position: 'asc' },
      },
      journeys: { where: { isActive: true }, select: { id: true, slug: true, title: true } },
      priceVariants: { orderBy: { position: 'asc' } },
    },
  })
}

// Course lesson management
export async function addLessonToCourse(
  productId: string,
  contentUnitId: string
) {
  const maxPosition = await prisma.courseLesson.aggregate({
    where: { productId },
    _max: { position: true },
  })
  return prisma.courseLesson.create({
    data: {
      productId,
      contentUnitId,
      position: (maxPosition._max.position ?? 0) + 1,
    },
  })
}

export async function removeLessonFromCourse(
  productId: string,
  contentUnitId: string
) {
  return prisma.courseLesson.deleteMany({
    where: { productId, contentUnitId },
  })
}

export async function reorderLessons(productId: string, lessonIds: string[]) {
  const updates = lessonIds.map((id, index) =>
    prisma.courseLesson.update({ where: { id }, data: { position: index + 1 } })
  )
  return prisma.$transaction(updates)
}

// Bundle management
export async function addProductToBundle(
  bundleProductId: string,
  includedProductId: string
) {
  return prisma.bundleItem.create({
    data: { bundleProductId, includedProductId },
  })
}

export async function removeProductFromBundle(
  bundleProductId: string,
  includedProductId: string
) {
  return prisma.bundleItem.deleteMany({
    where: { bundleProductId, includedProductId },
  })
}

// Course module management
export async function createModule(productId: string, data: { title: string; description?: string }) {
  const maxPos = await prisma.courseModule.aggregate({
    where: { productId },
    _max: { position: true },
  })
  return prisma.courseModule.create({
    data: {
      productId,
      title: data.title,
      description: data.description,
      position: (maxPos._max.position ?? 0) + 1,
    },
  })
}

export async function updateModule(id: string, data: { title?: string; description?: string }) {
  return prisma.courseModule.update({ where: { id }, data })
}

export async function deleteModule(id: string) {
  return prisma.$transaction(async (tx) => {
    // Unassign lessons from this module before deleting
    await tx.courseLesson.updateMany({
      where: { moduleId: id },
      data: { moduleId: null },
    })
    return tx.courseModule.delete({ where: { id } })
  })
}

export async function reorderModules(productId: string, moduleIds: string[]) {
  const updates = moduleIds.map((id, index) =>
    prisma.courseModule.update({ where: { id }, data: { position: index + 1 } })
  )
  return prisma.$transaction(updates)
}

export async function assignLessonToModule(lessonId: string, moduleId: string | null) {
  return prisma.courseLesson.update({
    where: { id: lessonId },
    data: { moduleId },
  })
}

// Landing page and images
export async function updateProductLandingPage(id: string, landingPage: Prisma.InputJsonValue) {
  landingPageSchema.parse(landingPage)
  return prisma.product.update({
    where: { id },
    data: { landingPage },
  })
}

export async function updateProductImages(id: string, data: { coverImageUrl?: string; thumbnailUrl?: string }) {
  return prisma.product.update({
    where: { id },
    data,
  })
}

// Stripe sync
export async function syncToStripe(productId: string) {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
    include: { priceVariants: true },
  })
  const stripe = getStripe()

  let stripeProduct
  if (product.stripeProductId) {
    stripeProduct = await stripe.products.update(product.stripeProductId, {
      name: product.title,
      description: product.description || undefined,
    })
  } else {
    stripeProduct = await stripe.products.create({
      name: product.title,
      description: product.description || undefined,
    })
  }

  // Legacy single-price sync — keep for backwards compatibility
  if (product.stripePriceId) {
    await stripe.prices.update(product.stripePriceId, { active: false })
  }

  const stripePrice = await stripe.prices.create({
    product: stripeProduct.id,
    unit_amount: product.priceAmountCents,
    currency: product.priceCurrency.toLowerCase(),
    ...(product.type === 'SUBSCRIPTION'
      ? { recurring: { interval: 'month' } }
      : {}),
  })

  await prisma.product.update({
    where: { id: productId },
    data: {
      stripeProductId: stripeProduct.id,
      stripePriceId: stripePrice.id,
    },
  })

  // Sync each variant that doesn't yet have a stripePriceId
  for (const variant of product.priceVariants) {
    if (variant.stripePriceId) continue
    await syncVariantToStripe(variant.id)
  }

  return prisma.product.findUniqueOrThrow({
    where: { id: productId },
    include: { priceVariants: true },
  })
}

export async function syncVariantToStripe(variantId: string) {
  const variant = await prisma.priceVariant.findUniqueOrThrow({
    where: { id: variantId },
    include: { product: true },
  })

  if (variant.stripePriceId) {
    return variant
  }

  const stripe = getStripe()

  // Ensure parent product is synced
  let stripeProductId = variant.product.stripeProductId
  if (!stripeProductId) {
    const created = await stripe.products.create({
      name: variant.product.title,
      description: variant.product.description || undefined,
    })
    stripeProductId = created.id
    await prisma.product.update({
      where: { id: variant.productId },
      data: { stripeProductId },
    })
  }

  const stripePrice = await stripe.prices.create({
    product: stripeProductId,
    unit_amount: variant.amountCents,
    currency: variant.currency.toLowerCase(),
    ...(variant.billingType === 'recurring' && variant.interval
      ? {
          recurring: {
            interval: variant.interval,
            interval_count: variant.intervalCount,
          },
        }
      : {}),
  })

  return prisma.priceVariant.update({
    where: { id: variantId },
    data: { stripePriceId: stripePrice.id },
  })
}

// PriceVariant CRUD
export async function createPriceVariant(productId: string, data: {
  label: string
  description?: string
  amountCents: number
  currency?: string
  billingType: 'one_time' | 'recurring'
  interval?: 'month' | 'year' | null
  intervalCount?: number
  trialDays?: number | null
  position?: number
  isHighlighted?: boolean
}) {
  return prisma.priceVariant.create({
    data: {
      productId,
      label: data.label,
      description: data.description,
      amountCents: data.amountCents,
      currency: data.currency ?? 'DKK',
      billingType: data.billingType,
      interval: data.billingType === 'recurring' ? (data.interval ?? 'month') : null,
      intervalCount: data.intervalCount ?? 1,
      trialDays: data.trialDays ?? null,
      position: data.position ?? 0,
      isHighlighted: data.isHighlighted ?? false,
    },
  })
}

export async function updatePriceVariant(id: string, data: {
  label?: string
  description?: string | null
  amountCents?: number
  currency?: string
  billingType?: 'one_time' | 'recurring'
  interval?: 'month' | 'year' | null
  intervalCount?: number
  trialDays?: number | null
  position?: number
  isActive?: boolean
  isHighlighted?: boolean
}) {
  // If amount changed, archive old stripePriceId so a new one is created on next sync
  const existing = await prisma.priceVariant.findUniqueOrThrow({ where: { id } })
  const amountChanged = data.amountCents !== undefined && data.amountCents !== existing.amountCents
  const billingChanged =
    (data.billingType !== undefined && data.billingType !== existing.billingType) ||
    (data.interval !== undefined && data.interval !== existing.interval) ||
    (data.intervalCount !== undefined && data.intervalCount !== existing.intervalCount)

  if ((amountChanged || billingChanged) && existing.stripePriceId) {
    try {
      const stripe = getStripe()
      await stripe.prices.update(existing.stripePriceId, { active: false })
    } catch (err) {
      console.warn('Failed to archive stripe price', err)
    }
  }

  return prisma.priceVariant.update({
    where: { id },
    data: {
      ...data,
      ...(amountChanged || billingChanged ? { stripePriceId: null } : {}),
    },
  })
}

export async function deletePriceVariant(id: string) {
  const refs = await prisma.entitlement.count({ where: { priceVariantId: id } })
  if (refs > 0) {
    throw new Error(
      'Variant kan ikke slettes — der findes ' +
        refs +
        ' aktive entitlements. Sæt isActive = false i stedet.'
    )
  }
  return prisma.priceVariant.delete({ where: { id } })
}
