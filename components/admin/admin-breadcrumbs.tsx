"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const labels: Record<string, string> = {
  admin: "Admin",
  products: "Produkter",
  journeys: "Forløb",
  content: "Indhold",
  users: "Brugere",
  analytics: "Indsigt",
  community: "Fællesskab",
  rooms: "Rum",
  prompts: "Prompts",
  moderation: "Moderering",
  cohorts: "Kohorter",
  settings: "Indstillinger",
  general: "Generelt",
  branding: "Branding",
  integrations: "Integrationer",
  onboarding: "Onboarding-quiz",
  recommendations: "Anbefalinger",
  checkins: "Check-ins",
  dashboard: "Dashboard-beskeder",
  emails: "E-mail-skabeloner",
  notifications: "Notifikationer",
  reengagement: "Re-engagement",
  milestones: "Milepæle",
  tags: "Tags",
  discounts: "Rabatkoder",
  new: "Opret ny",
  edit: "Rediger",
  courses: "Kurser",
  bundles: "Bundler",
  modules: "Moduler",
  lessons: "Lektioner",
  media: "Medier",
}

/** UUID v4 pattern */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function AdminBreadcrumbs() {
  const pathname = usePathname()

  // Only show on sub-pages, not on /admin root
  if (!pathname || pathname === "/admin" || pathname === "/admin/") {
    return null
  }

  const segments = pathname.split("/").filter(Boolean) // ["admin", "products", "xxx", ...]

  // Build breadcrumb items, skipping UUID segments
  const items: { label: string; href: string }[] = []

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const href = "/" + segments.slice(0, i + 1).join("/")

    // Skip UUID segments — they don't get their own breadcrumb
    if (UUID_RE.test(segment)) {
      continue
    }

    const label = labels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1)
    items.push({ label, href })
  }

  // Need at least 2 items (Admin + something) to show breadcrumbs
  if (items.length < 2) {
    return null
  }

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <BreadcrumbItem key={item.href}>
              {index > 0 && <BreadcrumbSeparator />}
              {isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
