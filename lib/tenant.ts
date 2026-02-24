export type TenantConfig = {
  id: string
  slug: string

  // Brand
  brandName: string
  tagline: string | null
  description: string | null
  logoUrl: string | null
  faviconUrl: string | null
  websiteUrl: string | null

  // Farver
  colorPrimary: string
  colorPrimaryForeground: string
  colorAccent: string
  colorSuccess: string
  colorBackground: string
  colorSand: string
  colorForeground: string
  colorBorder: string

  // Kontakt
  contactEmail: string | null
  contactPhone: string | null
  contactUrl: string | null

  // Email
  emailFromName: string | null
  emailFromEmail: string | null

  // Landing page
  heroHeading: string | null
  heroSubheading: string | null
  heroCtaText: string | null
  heroCtaUrl: string | null

  // Om
  aboutHeading: string | null
  aboutName: string | null
  aboutBio: string | null
  aboutUrl: string | null
  aboutImageUrl: string | null

  // Landing page JSON
  landingBenefits: string[] | null
  landingSteps: { title: string; description: string; icon: string }[] | null
  landingFeatures: { title: string; description: string; icon: string }[] | null
  landingTestimonials: { name: string; quote: string; stars: number }[] | null
  landingFaq: { question: string; answer: string }[] | null

  // Priser
  subscriptionPriceDisplay: string | null
  subscriptionPeriodDisplay: string | null

  // Footer
  footerCopyright: string | null
  footerLinks: { label: string; url: string }[] | null
}
