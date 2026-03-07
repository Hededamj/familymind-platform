import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fællesskab — FamilyMind',
  description: 'Deltag i fællesskabet hos FamilyMind. Stil spørgsmål, del erfaringer og find støtte fra andre forældre.',
}

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
