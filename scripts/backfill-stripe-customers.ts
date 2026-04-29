/**
 * One-time backfill: associate existing users with their Stripe Customer.
 *
 * Pre-refactor each checkout was created with `customer_email`, which made
 * Stripe spawn a fresh Customer on every purchase. After PR A, every new
 * checkout reuses a stored `User.stripeCustomerId`. This script bridges
 * the gap for users created before that refactor.
 *
 * Strategy:
 *   1. For each user without a stripeCustomerId, look up the most recent
 *      Stripe Customer with matching email.
 *   2. If exactly one match: store its id on the user.
 *   3. If zero matches: leave null — they'll get a fresh Customer the
 *      next time they touch checkout or the billing portal.
 *   4. If multiple matches: log a warning and pick the most recently
 *      created one (almost always the correct choice for our setup —
 *      multiple matches means we leaked Customers via customer_email).
 *
 * Idempotent: re-running skips users who already have a stripeCustomerId.
 *
 * Usage: npx tsx scripts/backfill-stripe-customers.ts [--dry-run]
 */

import { PrismaClient } from '@prisma/client'
import { getStripe } from '../lib/stripe'

const prisma = new PrismaClient()

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const stripe = getStripe()

  const users = await prisma.user.findMany({
    where: { stripeCustomerId: null },
    select: { id: true, email: true, name: true },
    orderBy: { createdAt: 'asc' },
  })

  console.log(
    `${users.length} user(s) without a stripeCustomerId${dryRun ? ' (DRY RUN — no writes)' : ''}`
  )
  if (users.length === 0) return

  let matched = 0
  let unmatched = 0
  let ambiguous = 0

  for (const user of users) {
    const list = await stripe.customers.list({ email: user.email, limit: 10 })
    const candidates = list.data.filter((c) => !c.deleted)

    if (candidates.length === 0) {
      console.log(`  - ${user.email}: no Stripe Customer found — skipping`)
      unmatched++
      continue
    }

    let chosen = candidates[0]
    if (candidates.length > 1) {
      // Pick the most recently created one. Stripe returns list ordered by
      // created desc, so candidates[0] is already the right one — but be
      // explicit so a future API change doesn't silently flip the order.
      chosen = candidates.reduce((latest, c) =>
        c.created > latest.created ? c : latest
      )
      console.warn(
        `  ! ${user.email}: ${candidates.length} matching Customers — picking ${chosen.id} (created ${new Date(chosen.created * 1000).toISOString()})`
      )
      ambiguous++
    }

    if (dryRun) {
      console.log(`  ~ ${user.email}: would link → ${chosen.id}`)
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: chosen.id },
      })
      console.log(`  ✓ ${user.email}: linked → ${chosen.id}`)
    }
    matched++
  }

  console.log(
    `\nDone. matched=${matched}, ambiguous=${ambiguous}, unmatched=${unmatched}`
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
