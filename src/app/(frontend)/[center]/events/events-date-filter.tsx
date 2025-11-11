'use client'

import { QUICK_DATE_FILTERS } from '@/collections/Events/constants'
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'

type Props = {
  startDate: string
  endDate: string
}

export const EventsDatePicker = ({ startDate, endDate }: Props) => {
  return (
    <DateRangeFilter
      startDate={startDate}
      endDate={endDate}
      quickFilters={QUICK_DATE_FILTERS}
      title="Filter by date"
      defaultOpen={true}
    />
  )
}
