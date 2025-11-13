'use client'

import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
import { QUICK_DATE_FILTERS_COURSES } from '@/constants/quickDateFilters'

type Props = {
  startDate: string
  endDate: string
}

export const CoursesDateFilter = ({ startDate, endDate }: Props) => {
  return (
    <DateRangeFilter
      startDate={startDate}
      endDate={endDate}
      quickFilters={QUICK_DATE_FILTERS_COURSES}
      title="Date Range"
      defaultOpen={true}
    />
  )
}
