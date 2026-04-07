import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { NewCourseForm } from './new-course-form'

export default async function NewCoursePage() {
  await requireAdmin()
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Tilbage til kurser
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Opret kursus</h1>
        <p className="text-muted-foreground">Tilføj et nyt kursus til platformen</p>
      </div>
      <NewCourseForm />
    </div>
  )
}
