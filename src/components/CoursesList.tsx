'use client'

import { getCourses, type GetCoursesParams } from '@/actions/getCourses'
import type { Course } from '@/payload-types'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { CoursePreviewSmallRow } from './CoursePreviewSmallRow'

interface CoursesListProps {
  initialCourses: Course[]
  initialHasMore: boolean
  filters: GetCoursesParams
}

export const CoursesList = ({ initialCourses, initialHasMore, filters }: CoursesListProps) => {
  const [courses, setCourses] = useState<Course[]>(initialCourses)
  const [offset, setOffset] = useState(initialCourses.length)
  const [hasMoreData, setHasMoreData] = useState(initialHasMore)
  const [isLoading, setIsLoading] = useState(false)

  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  })

  useEffect(() => {
    if (inView && hasMoreData && !isLoading) {
      const loadMore = async () => {
        setIsLoading(true)
        try {
          const result = await getCourses({
            ...filters,
            offset,
            limit: 20,
          })

          setCourses((prevCourses) => [...prevCourses, ...result.courses])
          setOffset((prevOffset) => prevOffset + result.courses.length)
          setHasMoreData(result.hasMore)
        } catch (error) {
          console.error('Error loading more courses:', error)
        } finally {
          setIsLoading(false)
        }
      }

      loadMore()
    }
  }, [inView, hasMoreData, isLoading, offset, filters])

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No courses found matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <div key={course.id} className="border-b pb-4 last:border-b-0">
          <CoursePreviewSmallRow doc={course} />
        </div>
      ))}

      {hasMoreData && (
        <div ref={ref} className="flex justify-center py-8">
          {isLoading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
        </div>
      )}
    </div>
  )
}
