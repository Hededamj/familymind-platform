'use server'
// STUB — PR 2/3 re-implementerer discount actions for course/bundle
async function stub(..._args: unknown[]): Promise<never> {
  throw new Error('Under ombygning')
}
export async function createDiscount(..._args: unknown[]) { return stub() }
export async function updateDiscount(..._args: unknown[]) { return stub() }
export async function deleteDiscount(..._args: unknown[]) { return stub() }
export async function toggleDiscountActive(..._args: unknown[]) { return stub() }
export async function syncDiscountToStripe(..._args: unknown[]) { return stub() }
export async function deleteDiscountAction(..._args: unknown[]) { return stub() }
export async function toggleDiscountAction(..._args: unknown[]) { return stub() }
export async function createDiscountAction(..._args: unknown[]) { return stub() }
export async function updateDiscountAction(..._args: unknown[]) { return stub() }
