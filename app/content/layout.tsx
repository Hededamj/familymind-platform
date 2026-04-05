import { AppLayout } from '@/components/layout/app-layout'

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>
}
