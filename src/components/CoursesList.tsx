'use client'

import { getCourses, type GetCoursesParams } from '@/actions/getCourses'
import type { Course } from '@/payload-types'
import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
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
  const searchParams = useSearchParams()
  const previousParamsRef = useRef<string>(searchParams.toString())

  // Memoize filters to prevent unnecessary re-renders
  const stableFilters = useMemo(() => filters, [filters])

  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  })

  // Reset courses when URL search params change
  useEffect(() => {
    const currentParams = searchParams.toString()

    // Only refetch if params actually changed
    if (currentParams !== previousParamsRef.current) {
      previousParamsRef.current = currentParams

      const resetAndFetch = async () => {
        setIsLoading(true)
        try {
          const result = await getCourses({
            ...stableFilters,
            offset: 0,
          })

          setCourses(result.courses)
          setOffset(result.courses.length)
          setHasMoreData(result.hasMore)
        } catch (error) {
          console.error('Error fetching courses:', error)
        } finally {
          setIsLoading(false)
        }
      }

      resetAndFetch()
    }
  }, [searchParams, stableFilters])

  useEffect(() => {
    if (inView && hasMoreData && !isLoading) {
      const loadMore = async () => {
        setIsLoading(true)
        try {
          const result = await getCourses({
            ...stableFilters,
            offset,
          })

          // Deduplicate courses by ID to prevent duplicate key errors
          setCourses((prevCourses) => {
            const existingIds = new Set(prevCourses.map((course) => course.id))
            const newCourses = result.courses.filter((course) => !existingIds.has(course.id))
            return [...prevCourses, ...newCourses]
          })
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
  }, [inView, hasMoreData, isLoading, offset, stableFilters])

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
