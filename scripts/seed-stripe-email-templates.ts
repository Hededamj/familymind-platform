/**
 * Seed Stripe-lifecycle email templates.
 *
 * Two new templates wired up by the webhook handlers:
 *   - payment_failed: sent when invoice.payment_failed flips an entitlement
 *     to PAST_DUE. Stripe will keep retrying per its dunning schedule, so
 *     this nudges the user to update payment details before access lapses.
 *   - trial_ending: sent on customer.subscription.trial_will_end (Stripe
 *     fires this 3 days before trial end by default).
 *
 * Idempotent: upsert by templateKey.
 *
 * Usage: npx tsx scripts/seed-stripe-email-templates.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TEMPLATES = [
  {
    templateKey: 'payment_failed',
    subject: 'Vi kunne ikke trække betalingen, {{userName}}',
    description: 'Sent when invoice.payment_failed marks entitlement PAST_DUE',
    bodyHtml: `<h1>Hej {{userName}}</h1>
<p>Vi kunne ikke trække betalingen for dit FamilyMind-abonnement. Det kan skyldes et udløbet kort, manglende dækning, eller at banken har afvist transaktionen.</p>
<p>Vi prøver automatisk igen i de næste dage. Hvis du vil sikre dig at du ikke mister adgang, kan du opdatere dit kort her:</p>
<p><a href="{{appUrl}}/dashboard">Opdater betalingsoplysninger</a></p>
<p>Skriv endelig hvis du har spørgsmål.</p>
<p>Bedste hilsner,<br>{{brandName}}</p>`,
  },
  {
    templateKey: 'trial_ending',
    subject: 'Din prøveperiode slutter snart, {{userName}}',
    description: 'Sent on customer.subscription.trial_will_end — 3 days before',
    bodyHtml: `<h1>Hej {{userName}}</h1>
<p>Din prøveperiode hos {{brandName}} udløber om få dage. Når den slutter, fortsætter dit abonnement automatisk medmindre du vælger at stoppe.</p>
<p>Du kan altid se eller ændre dit abonnement her:</p>
<p><a href="{{appUrl}}/dashboard">Se mit abonnement</a></p>
<p>Vi håber du har fundet noget nyttigt — sig til hvis du har feedback.</p>
<p>Bedste hilsner,<br>{{brandName}}</p>`,
  },
]

async function main() {
  for (const t of TEMPLATES) {
    await prisma.emailTemplate.upsert({
      where: { templateKey: t.templateKey },
      update: {
        subject: t.subject,
        bodyHtml: t.bodyHtml,
        description: t.description,
        isActive: true,
      },
      create: {
        templateKey: t.templateKey,
        subject: t.subject,
        bodyHtml: t.bodyHtml,
        description: t.description,
        isActive: true,
      },
    })
    console.log(`  upserted ${t.templateKey}`)
  }
  console.log('\nDone.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
