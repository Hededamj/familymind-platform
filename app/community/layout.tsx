import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  // TODO: Replace with getTenantConfig().brandName when tenant service is implemented
  const brandName = process.env.NEXT_PUBLIC_APP_NAME || 'FamilyMind'
  return {
    title: `Fællesskab — ${brandName}`,
    description: `Deltag i fællesskabet hos ${brandName}. Stil spørgsmål, del erfaringer og find støtte fra andre forældre.`,
  }
}

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
