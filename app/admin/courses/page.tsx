import Link from 'next/link'
import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import { listCourses } from '@/lib/services/course.service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BookOpen, Plus } from 'lucide-react'
import { AdminSearch } from '@/components/admin/admin-search'
import { CourseActions } from './_components/course-actions'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export default async function CoursesListPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  await requireAdmin()
  const { search } = await searchParams
  const courses = await listCourses({ search: search || undefined })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kurser</h1>
          <p className="text-muted-foreground">
            Administrer kurser, moduler, lektioner og priser
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/courses/new">
            <Plus className="mr-2 size-4" />
            Opret kursus
          </Link>
        </Button>
      </div>

      <Suspense fallback={null}>
        <AdminSearch placeholder="Søg efter kurser..." />
      </Suspense>

      {courses.length === 0 ? (
        <div className="rounded-md border p-12 text-center">
          <p className="text-muted-foreground">
            {search
              ? `Ingen resultater for '${search}'`
              : 'Ingen kurser endnu. Opret dit første kursus for at komme i gang.'}
          </p>
          {!search && (
            <Button asChild className="mt-4">
              <Link href="/admin/courses/new">
                <Plus className="mr-2 size-4" />
                Opret kursus
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Cover</TableHead>
                <TableHead>Titel</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Lektioner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Oprettet</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    {course.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={course.coverImageUrl}
                        alt=""
                        className="size-12 rounded object-cover"
                      />
                    ) : (
                      <div className="flex size-12 items-center justify-center rounded bg-muted text-muted-foreground">
                        <BookOpen className="size-5" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell className="text-muted-foreground">{course.slug}</TableCell>
                  <TableCell>{course.lessons.length}</TableCell>
                  <TableCell>
                    {course.isActive ? (
                      <Badge variant="default">Aktiv</Badge>
                    ) : (
                      <Badge variant="secondary">Inaktiv</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(course.createdAt)}
                  </TableCell>
                  <TableCell>
                    <CourseActions courseId={course.id} title={course.title} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
