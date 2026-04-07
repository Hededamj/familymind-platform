import { getUserInProgressCourses } from '@/lib/services/progress.service'
import { CourseProgressCard } from './course-progress-card'
import { SectionHeading } from './section-heading'

export async function CoursesSection({ userId }: { userId: string }) {
  const inProgressCourses = await getUserInProgressCourses(userId)

  if (inProgressCourses.length === 0) return null

  return (
    <section>
      <SectionHeading title="Dine kurser" subtitle="Fortsæt hvor du slap" />
      <div className="grid gap-4 sm:grid-cols-2">
        {inProgressCourses.map((course) => (
          <CourseProgressCard key={course.product.id} {...course} />
        ))}
      </div>
    </section>
  )
}
