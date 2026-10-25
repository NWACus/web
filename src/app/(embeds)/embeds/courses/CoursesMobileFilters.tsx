'use client'

import { InlineFiltersPanel } from '@/components/filters/InlineFiltersPanel'
import { useFiltersTotalContext } from '@/contexts/FiltersTotalContext'
import { CoursesFilters, FilterProvider, FilterState } from './CoursesFilters'

type Props = {
  providers: FilterProvider[]
  states: FilterState[]
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
    <InlineFiltersPanel docLabel="courses" docCount={total} hasActiveFilters={hasActiveFilters}>
      <CoursesFilters
        startDate={startDate}
        endDate={endDate}
        states={states}
        providers={providers}
      />
    </InlineFiltersPanel>
  )
}
