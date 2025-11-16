'use client'

import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
import { createQuickDateFilters } from '@/utilities/createQuickDateFilters'

export const QUICK_DATE_FILTERS = createQuickDateFilters('Past Courses')

type Props = {
  startDate: string
  endDate: string
}

export const CoursesDateFilter = ({ startDate, endDate }: Props) => {
  return (
    <DateRangeFilter
      startDate={startDate}
      endDate={endDate}
      quickFilters={QUICK_DATE_FILTERS}
      title="Date Range"
      defaultOpen={true}
    />
  )
}
