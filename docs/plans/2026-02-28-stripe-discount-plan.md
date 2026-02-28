# Stripe Rabatkode-integration — Implementeringsplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect existing discount code system to Stripe so discounts are actually applied at checkout and usage is tracked.

**Design doc:** `docs/plans/2026-02-28-stripe-discount-design.md`

**Architecture:** Sync discount codes to Stripe Coupons on creation. Pass coupon ID at checkout. Increment usage on webhook.

---

## Task 1: Add new fields to Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Update DiscountCode model**

Replace the existing DiscountCode model (lines 348-361) with:

```prisma
model DiscountCode {
  id                    String       @id @default(uuid()) @db.Uuid
  code                  String       @unique
  type                  DiscountType
  value                 Int // percentage or cents
  maxUses               Int?
  currentUses           Int          @default(0)
  validFrom             DateTime     @default(now())
  validUntil            DateTime?
  applicableProductId   String?      @db.Uuid
  isActive              Boolean      @default(true)
  stripeCouponId        String?      // Stripe coupon ID
  stripePromotionCodeId String?      // Reserved for future use
  duration              String       @default("once") // "once" | "repeating" | "forever"
  durationInMonths      Int?         // Only when duration = "repeating"

  applicableProduct Product? @relation(fields: [applicableProductId], references: [id])
}
```

**Step 2: Create migration**

Run: `npx prisma migrate dev --name add_stripe_discount_fields`

**Step 3: Verify**

Run: `npx prisma validate && npx prisma generate`

---

## Task 2: Create Stripe discount sync in server action

**Files:**
- Modify: `app/admin/discounts/actions.ts`

**Step 1: Update createDiscountAction**

Add Stripe coupon creation before DB insert. The action should:

1. Accept new fields: `duration` (string, default "once") and `durationInMonths` (number | null)
2. Call `getStripe().coupons.create()` with:
   - `percent_off` (for PERCENTAGE) or `amount_off` + `currency: 'dkk'` (for FIXED_AMOUNT)
   - `duration`: the duration value
   - `duration_in_months`: only when duration is "repeating"
   - `name`: the discount code text (display name in Stripe)
3. On success: save to DB with `stripeCouponId: coupon.id`
4. On Stripe error: throw with user-friendly message, do NOT save to DB

```typescript
import { getStripe } from '@/lib/stripe'

export async function createDiscountAction(data: {
  code: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  value: number
  maxUses?: number | null
  validFrom?: string
  validUntil?: string | null
  applicableProductId?: string | null
  isActive?: boolean
  duration?: string        // NEW
  durationInMonths?: number | null  // NEW
}) {
  await requireAdmin()

  const stripe = getStripe()
  const duration = data.duration || 'once'

  // Create Stripe coupon first — if this fails, we don't save to DB
  const couponParams: Record<string, unknown> = {
    name: data.code.toUpperCase(),
    duration: duration as 'once' | 'repeating' | 'forever',
  }

  if (data.type === 'PERCENTAGE') {
    couponParams.percent_off = data.value
  } else {
    couponParams.amount_off = data.value // already in cents/øre
    couponParams.currency = 'dkk'
  }

  if (duration === 'repeating' && data.durationInMonths) {
    couponParams.duration_in_months = data.durationInMonths
  }

  let stripeCoupon
  try {
    stripeCoupon = await stripe.coupons.create(couponParams)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ukendt fejl'
    throw new Error(`Kunne ikke oprette rabat i Stripe: ${message}`)
  }

  const discount = await prisma.discountCode.create({
    data: {
      code: data.code.toUpperCase(),
      type: data.type,
      value: data.value,
      maxUses: data.maxUses || null,
      validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      applicableProductId: data.applicableProductId || null,
      isActive: data.isActive ?? true,
      stripeCouponId: stripeCoupon.id,
      duration,
      durationInMonths: duration === 'repeating' ? (data.durationInMonths || null) : null,
    },
  })

  revalidatePath('/admin/discounts')
  return discount
}
```

**Step 2: Update updateDiscountAction**

Remove `type` and `value` from the editable fields (immutable after creation). Keep `code`, `maxUses`, `validUntil`, `applicableProductId`, `isActive` as editable.

```typescript
export async function updateDiscountAction(
  id: string,
  data: Partial<{
    code: string
    maxUses: number | null
    validUntil: string | null
    applicableProductId: string | null
    isActive: boolean
  }>
) {
  await requireAdmin()
  // ... rest stays the same but without type/value spread
}
```

**Step 3: Update deleteDiscountAction**

Add Stripe coupon deletion before DB delete:

```typescript
export async function deleteDiscountAction(id: string) {
  await requireAdmin()

  const discount = await prisma.discountCode.findUniqueOrThrow({ where: { id } })

  // Delete from Stripe (best-effort — don't block DB deletion)
  if (discount.stripeCouponId) {
    try {
      await getStripe().coupons.del(discount.stripeCouponId)
    } catch (err) {
      console.error(`Failed to delete Stripe coupon ${discount.stripeCouponId}:`, err)
    }
  }

  await prisma.discountCode.delete({ where: { id } })
  revalidatePath('/admin/discounts')
}
```

---

## Task 3: Fix checkout service to use stripeCouponId

**Files:**
- Modify: `lib/services/checkout.service.ts`

**Step 1: Update validateDiscountCode return value**

Change line 90 from:
```typescript
stripeCouponId: undefined as string | undefined,
```
To:
```typescript
stripeCouponId: discount.stripeCouponId ?? undefined,
```

**Step 2: Add discountCodeId to checkout session metadata**

In `createCheckoutSession`, update the metadata object to include the discount code ID for webhook tracking.

Change lines 40-49 to also capture the discountCodeId:

```typescript
let discountCouponId: string | undefined
let discountCodeId: string | undefined

if (validated.discountCode) {
  const discount = await validateDiscountCode(
    validated.discountCode,
    validated.productId
  )
  discountCouponId = discount.stripeCouponId
  discountCodeId = discount.discountId
}
```

Then in the session create call, update:
- `discounts` to use `discountCouponId`
- `metadata` to include `discountCodeId`

```typescript
const session = await stripe.checkout.sessions.create(
  {
    mode: product.type === 'SUBSCRIPTION' ? 'subscription' : 'payment',
    customer_email: user.email,
    line_items: [{ price: product.stripePriceId, quantity: 1 }],
    ...(discountCouponId ? { discounts: [{ coupon: discountCouponId }] } : {}),
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.slug}`,
    metadata: {
      userId,
      productId: product.id,
      ...(discountCodeId ? { discountCodeId } : {}),
    },
  },
  stripeAccountId ? { stripeAccount: stripeAccountId } : undefined
)
```

---

## Task 4: Add usage tracking in Stripe webhook

**Files:**
- Modify: `app/api/webhooks/stripe/route.ts`

**Step 1: Replace the placeholder discount tracking**

Replace lines 110-114 (the TODO comment block):

```typescript
// Increment discount code usage if applicable
if (session.total_details?.breakdown?.discounts?.length) {
  // Discount was applied — we'd need to track which code was used
  // For now, this will be handled when we enhance the discount system
}
```

With:

```typescript
// Increment discount code usage
const discountCodeId = session.metadata?.discountCodeId
if (discountCodeId) {
  await prisma.discountCode.update({
    where: { id: discountCodeId },
    data: { currentUses: { increment: 1 } },
  })
}
```

This runs after the idempotency check (line 73: `if (existingEntitlement) break`), so duplicate webhooks won't double-count usage.

---

## Task 5: Update admin UI — form and list

**Files:**
- Modify: `app/admin/discounts/_components/discount-form.tsx`
- Modify: `app/admin/discounts/page.tsx`

### discount-form.tsx changes:

**Step 1: Add duration state**

Add new state variables after the existing ones:

```typescript
const [duration, setDuration] = useState(initialData?.duration ?? 'once')
const [durationInMonths, setDurationInMonths] = useState(
  initialData?.durationInMonths?.toString() ?? ''
)
```

Note: `initialData` type needs updating too — add `duration?: string` and `durationInMonths?: number | null` to `DiscountData`.

**Step 2: Make type/value read-only in edit mode**

For the type Select and value Input: add `disabled={mode === 'edit'}` prop.

**Step 3: Add duration section**

After the "Gyldighed" Card, add a new Card section "Varighed for abonnementer":

```tsx
<Card>
  <CardHeader>
    <CardTitle>Varighed for abonnementer</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="duration">Rabatvarighed</Label>
      <Select
        value={duration}
        onValueChange={setDuration}
        disabled={mode === 'edit'}
      >
        <SelectTrigger id="duration" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="once">Kun første betaling</SelectItem>
          <SelectItem value="repeating">Antal måneder</SelectItem>
          <SelectItem value="forever">For evigt</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        For engangskøb gælder rabatten altid hele beløbet uanset denne indstilling
      </p>
    </div>
    {duration === 'repeating' && (
      <div className="space-y-2">
        <Label htmlFor="durationInMonths">Antal måneder</Label>
        <Input
          id="durationInMonths"
          type="number"
          min="1"
          max="36"
          step="1"
          value={durationInMonths}
          onChange={(e) => setDurationInMonths(e.target.value)}
          placeholder="F.eks. 3"
          required
          disabled={mode === 'edit'}
        />
      </div>
    )}
  </CardContent>
</Card>
```

**Step 4: Update form submit**

Add `duration` and `durationInMonths` to the createDiscountAction call:

```typescript
await createDiscountAction({
  code,
  type,
  value: numericValue,
  maxUses: maxUses ? parseInt(maxUses, 10) : null,
  validFrom,
  validUntil: validUntil || null,
  applicableProductId:
    applicableProductId === NO_PRODUCT ? null : applicableProductId,
  isActive,
  duration,
  durationInMonths: durationInMonths ? parseInt(durationInMonths, 10) : null,
})
```

In edit mode, remove `type` and `value` from the updateDiscountAction call.

### page.tsx (discount list) changes:

**Step 5: Add Stripe sync badge**

After the Status column (line 127-132), add a new column header "Stripe" and cell:

```tsx
// Header
<TableHead>Stripe</TableHead>

// Cell
<TableCell>
  {discount.stripeCouponId ? (
    <Badge variant="default" className="bg-green-600">Synket</Badge>
  ) : (
    <Badge variant="destructive">Ikke synket</Badge>
  )}
</TableCell>
```

---

## Task 6: Verify build

**Step 1:** Run `npx next build` and verify no TypeScript errors.

**Step 2:** Manual smoke test checklist:
- [ ] Admin can create a new discount code → Stripe coupon appears in Stripe Dashboard
- [ ] Admin list shows "Synket" badge for new codes
- [ ] Type/value are read-only when editing existing code
- [ ] Duration field appears in create form
- [ ] Checkout with discount code → Stripe shows discounted price
- [ ] After successful checkout → `currentUses` incremented in DB
- [ ] Delete discount code → Stripe coupon deleted

---

## Files Changed Summary

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add 4 fields to DiscountCode |
| `app/admin/discounts/actions.ts` | Stripe sync on create/delete, immutable type/value |
| `lib/services/checkout.service.ts` | Return real stripeCouponId, pass discountCodeId in metadata |
| `app/api/webhooks/stripe/route.ts` | Increment currentUses on checkout complete |
| `app/admin/discounts/_components/discount-form.tsx` | Duration fields, read-only type/value in edit |
| `app/admin/discounts/page.tsx` | Stripe sync status badge |
