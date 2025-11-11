'use client'

import { MobileFiltersDrawer } from '@/components/filters/MobileFiltersDrawer'
import { CoursesAffinityFilter } from './courses-affinity-filter'
import { CoursesDateFilter } from './courses-date-filter'
import { CoursesLocationFilter } from './courses-location-filter'
import { CoursesProviderFilter } from './courses-provider-filter'
import { CoursesTravelFilter } from './courses-travel-filter'
import { CoursesTypeFilter } from './courses-type-filter'

type Provider = {
  id: number
  name: string
}

type Props = {
  courseCount: number
  providers: Provider[]
  hasActiveFilters: boolean
  startDate: string
  endDate: string
}

export const CoursesMobileFilters = ({
  courseCount,
  providers,
  hasActiveFilters,
  startDate,
  endDate,
}: Props) => {
  return (
    <MobileFiltersDrawer
      docLabel="courses"
      docCount={courseCount}
      hasActiveFilters={hasActiveFilters}
    >
      <CoursesDateFilter startDate={startDate} endDate={endDate} />
      <CoursesTypeFilter />
      <CoursesProviderFilter providers={providers} />
      <CoursesLocationFilter />
      <CoursesAffinityFilter />
      <CoursesTravelFilter />
    </MobileFiltersDrawer>
  )
}
