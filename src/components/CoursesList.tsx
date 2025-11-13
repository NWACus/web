'use client'

import { getCourses } from '@/actions/getCourses'
import { useFiltersTotalContext } from '@/contexts/FiltersTotalContext'
import type { Course } from '@/payload-types'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { CoursePreviewSmallRow } from './CoursePreviewSmallRow'
import { Card } from './ui/card'

interface CoursesListProps {
  initialCourses: Course[]
  initialHasMore: boolean
  initialError?: string
}

export const CoursesList = ({ initialCourses, initialHasMore, initialError }: CoursesListProps) => {
  const [courses, setCourses] = useState<Course[]>(initialCourses)
  const [offset, setOffset] = useState(initialCourses.length)
  const [hasMoreData, setHasMoreData] = useState(initialHasMore)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)
  const searchParams = useSearchParams()
  const previousParamsRef = useRef<string>(searchParams.toString())
  const { setTotal } = useFiltersTotalContext()

  // Rebuild filters from current URL params
  const stableFilters = useMemo(() => {
    const types = searchParams.get('types')
    const providers = searchParams.get('providers')
    const states = searchParams.get('states')
    const affinityGroups = searchParams.get('affinityGroups')
    const modesOfTravel = searchParams.get('modesOfTravel')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    return {
      types: types || null,
      providers: providers || null,
      states: states || null,
      affinityGroups: affinityGroups || null,
      modesOfTravel: modesOfTravel || null,
      startDate: startDate || null,
      endDate: endDate || null,
    }
  }, [searchParams])

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
        setError(null)
        try {
          const result = await getCourses({
            ...stableFilters,
            offset: 0,
          })

          if (result.error) {
            setError(result.error)
            setCourses([])
            setHasMoreData(false)
            setTotal(0)
          } else {
            setCourses(result.courses)
            setOffset(result.courses.length)
            setHasMoreData(result.hasMore)
            setTotal(result.total)
          }
        } catch (_error) {
          setError('An unexpected error occurred. Please try again.')
        } finally {
          setIsLoading(false)
        }
      }

      resetAndFetch()
    }
  }, [searchParams, setTotal, stableFilters])

  useEffect(() => {
    if (inView && hasMoreData && !isLoading) {
      const loadMore = async () => {
        setIsLoading(true)
        try {
          const result = await getCourses({
            ...stableFilters,
            offset,
          })

          if (result.error) {
            setError(result.error)
            setHasMoreData(false)
          } else {
            // Deduplicate courses by ID to prevent duplicate key errors
            setCourses((prevCourses) => {
              const existingIds = new Set(prevCourses.map((course) => course.id))
              const newCourses = result.courses.filter((course) => !existingIds.has(course.id))
              return [...prevCourses, ...newCourses]
            })
            setOffset((prevOffset) => prevOffset + result.courses.length)
            setHasMoreData(result.hasMore)
          }
        } catch (_error) {
          setError('An unexpected error occurred while loading more courses.')
          setHasMoreData(false)
        } finally {
          setIsLoading(false)
        }
      }

      loadMore()
    }
  }, [inView, hasMoreData, isLoading, offset, stableFilters])

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Error Loading Courses</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  if (courses.length === 0 && !isLoading) {
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
