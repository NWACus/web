'use client'

import type { Course } from '@/payload-types'
import type { GetCoursesResult } from '@/utilities/queries/getCourses'
import { CoursePreviewSmallRow } from './CoursePreviewSmallRow'
import { InfiniteList } from './InfiniteList'

const FILTER_KEYS = [
  'types',
  'providers',
  'states',
  'affinityGroups',
  'modesOfTravel',
  'startDate',
  'endDate',
] as const

const coursesOf = (result: GetCoursesResult) => result.courses

interface CoursesListProps {
  initialCourses: Course[]
  initialHasMore: boolean
  initialError?: string
}

export const CoursesList = ({ initialCourses, initialHasMore, initialError }: CoursesListProps) => (
  <InfiniteList
    initialItems={initialCourses}
    initialHasMore={initialHasMore}
    initialError={initialError}
    endpoint="/api/courses/list"
    filterKeys={FILTER_KEYS}
    itemsOf={coursesOf}
    noun="courses"
    className="flex flex-col divide-y"
    renderItem={(course) => (
      <div key={course.id} className="py-4">
        <CoursePreviewSmallRow doc={course} titleClassName="text-xl" />
      </div>
    )}
  />
)
