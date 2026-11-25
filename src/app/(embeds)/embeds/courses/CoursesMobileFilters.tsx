'use client'

import { InlineFiltersPanel } from '@/components/filters/InlineFiltersPanel'
import { useFiltersTotalContext } from '@/contexts/FiltersTotalContext'
import type { StartDateBounds } from '@/utilities/queries/getStartDateBounds'
import { CoursesFilters, FilterProvider, FilterState } from './CoursesFilters'

type Props = {
  providers: FilterProvider[]
  states: FilterState[]
  hasActiveFilters: boolean
  startDate: string
  endDate: string
  dateBounds: StartDateBounds
}

export const CoursesMobileFilters = ({
  providers,
  states,
  hasActiveFilters,
  startDate,
  endDate,
  dateBounds,
}: Props) => {
  const { total } = useFiltersTotalContext()

  return (
    <InlineFiltersPanel docLabel="courses" docCount={total} hasActiveFilters={hasActiveFilters}>
      <CoursesFilters
        startDate={startDate}
        endDate={endDate}
        dateBounds={dateBounds}
        states={states}
        providers={providers}
      />
    </InlineFiltersPanel>
  )
}
