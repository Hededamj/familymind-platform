import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { NewBundleForm } from './new-bundle-form'

export default async function NewBundlePage() {
  await requireAdmin()
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/admin/bundles"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Tilbage til bundler
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Opret bundel</h1>
        <p className="text-muted-foreground">Tilføj en ny bundel til platformen</p>
      </div>
      <NewBundleForm />
    </div>
  )
}
