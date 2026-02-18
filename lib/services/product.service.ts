import { prisma } from '@/lib/prisma'
import {
  createProductSchema,
  updateProductSchema,
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
  return prisma.product.delete({ where: { id } })
}

export async function listProducts(filters?: {
  type?: string
  isActive?: boolean
}) {
  return prisma.product.findMany({
    where: {
      ...(filters?.type && { type: filters.type as any }),
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
    },
    include: {
      courseLessons: {
        include: { contentUnit: true },
        orderBy: { position: 'asc' },
      },
      bundleItems: { include: { includedProduct: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      courseLessons: {
        include: { contentUnit: true },
        orderBy: { position: 'asc' },
      },
      bundleItems: { include: { includedProduct: true } },
    },
  })
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      courseLessons: {
        include: { contentUnit: true },
        orderBy: { position: 'asc' },
      },
      bundleItems: { include: { includedProduct: true } },
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

// Stripe sync
export async function syncToStripe(productId: string) {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
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

  if (product.stripePriceId) {
    // Can't update price amount — archive old and create new
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

  return prisma.product.update({
    where: { id: productId },
    data: {
      stripeProductId: stripeProduct.id,
      stripePriceId: stripePrice.id,
    },
  })
}
