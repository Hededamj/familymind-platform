import { requireAdmin } from '@/lib/auth'
import { ProductForm } from '../_components/product-form'

export default async function NewProductPage() {
  await requireAdmin()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Opret produkt</h1>
        <p className="text-muted-foreground">
          Tilfoej et nyt produkt til platformen
        </p>
      </div>
      <ProductForm mode="create" />
    </div>
  )
}
