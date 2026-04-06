'use server'

import { requireAdmin } from '@/lib/auth'
import * as productService from '@/lib/services/product.service'
import {
  createProductSchema,
  updateProductSchema,
} from '@/lib/validators/product'
import { revalidatePath } from 'next/cache'
import type { z } from 'zod'

type CreateInput = z.input<typeof createProductSchema>
type UpdateInput = z.input<typeof updateProductSchema>

export async function createProductAction(data: CreateInput) {
  await requireAdmin()
  const validated = createProductSchema.parse(data)
  const result = await productService.createProduct(validated)
  revalidatePath('/admin/products')
  return result
}

export async function updateProductAction(id: string, data: UpdateInput) {
  await requireAdmin()
  const validated = updateProductSchema.parse(data)
  const result = await productService.updateProduct(id, validated)
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${id}/edit`)
  return result
}

export async function deleteProductAction(id: string) {
  await requireAdmin()
  await productService.deleteProduct(id)
  revalidatePath('/admin/products')
}

export async function addLessonAction(
  productId: string,
  contentUnitId: string
) {
  await requireAdmin()
  const result = await productService.addLessonToCourse(
    productId,
    contentUnitId
  )
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}/edit`)
  return result
}

export async function removeLessonAction(
  productId: string,
  contentUnitId: string
) {
  await requireAdmin()
  await productService.removeLessonFromCourse(productId, contentUnitId)
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}/edit`)
}

export async function reorderLessonsAction(
  productId: string,
  lessonIds: string[]
) {
  await requireAdmin()
  await productService.reorderLessons(productId, lessonIds)
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}/edit`)
}

export async function addBundleItemAction(
  bundleProductId: string,
  includedProductId: string
) {
  await requireAdmin()
  await productService.addProductToBundle(bundleProductId, includedProductId)
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${bundleProductId}/edit`)
}

export async function removeBundleItemAction(
  bundleProductId: string,
  includedProductId: string
) {
  await requireAdmin()
  await productService.removeProductFromBundle(bundleProductId, includedProductId)
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${bundleProductId}/edit`)
}

export async function syncToStripeAction(productId: string) {
  await requireAdmin()
  try {
    const result = await productService.syncToStripe(productId)
    revalidatePath('/admin/products')
    revalidatePath(`/admin/products/${productId}/edit`)
    return { success: true, product: result }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Ukendt fejl ved Stripe-synkronisering'
    return { success: false, error: message }
  }
}

export async function createModuleAction(productId: string, data: { title: string; description?: string }) {
  await requireAdmin()
  const result = await productService.createModule(productId, data)
  revalidatePath(`/admin/products/${productId}/edit`)
  return result
}

export async function updateModuleAction(id: string, data: { title?: string; description?: string }) {
  await requireAdmin()
  const result = await productService.updateModule(id, data)
  revalidatePath('/admin/products')
  return result
}

export async function deleteModuleAction(id: string) {
  await requireAdmin()
  await productService.deleteModule(id)
  revalidatePath('/admin/products')
}

export async function reorderModulesAction(productId: string, moduleIds: string[]) {
  await requireAdmin()
  await productService.reorderModules(productId, moduleIds)
  revalidatePath(`/admin/products/${productId}/edit`)
}

export async function assignLessonToModuleAction(lessonId: string, moduleId: string | null) {
  await requireAdmin()
  await productService.assignLessonToModule(lessonId, moduleId)
  revalidatePath('/admin/products')
}

export async function updateProductImagesAction(id: string, data: { coverImageUrl?: string; thumbnailUrl?: string }) {
  await requireAdmin()
  await productService.updateProductImages(id, data)
  revalidatePath('/admin/products')
}

export async function updateLandingPageAction(id: string, landingPage: Record<string, unknown>) {
  await requireAdmin()
  // Cast is safe: the form sends a JSON-serializable object with string/string[] values
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await productService.updateProductLandingPage(id, landingPage as any)
  revalidatePath('/admin/products')
}
