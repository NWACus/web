'use client'

import { GetCoursesStatesResults } from '@/actions/getCoursesStates'
import { GetProvidersResult } from '@/actions/getProviders'
import { MobileFiltersDrawer } from '@/components/filters/MobileFiltersDrawer'
import { useFiltersTotalContext } from '@/contexts/FiltersTotalContext'
import { CoursesFilters } from './CoursesFilters'

type Props = {
  providers: GetProvidersResult['providers']
  states: GetCoursesStatesResults['states']
  hasActiveFilters: boolean
  startDate: string
  endDate: string
}

export const CoursesMobileFilters = ({
  providers,
  states,
  hasActiveFilters,
  startDate,
  endDate,
}: Props) => {
  const { total } = useFiltersTotalContext()

  return (
    <MobileFiltersDrawer docLabel="courses" docCount={total} hasActiveFilters={hasActiveFilters}>
      <CoursesFilters
        startDate={startDate}
        endDate={endDate}
        states={states}
        providers={providers}
      />
    </MobileFiltersDrawer>
  )
}
