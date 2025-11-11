'use client'

import { EventType } from '@/collections/Events/constants'
import { MobileFiltersDrawer } from '@/components/filters/MobileFiltersDrawer'
import { EventsDatePicker } from './events-date-filter'
import { EventsTypeFilter } from './events-type-filter'

type Props = {
  eventCount: number
  types: EventType[]
  hasActiveFilters: boolean
}

export const EventsMobileFilters = ({ eventCount, types, hasActiveFilters }: Props) => {
  return (
    <MobileFiltersDrawer
      docLabel="events"
      docCount={eventCount}
      hasActiveFilters={hasActiveFilters}
    >
      <EventsTypeFilter types={types} />
      <EventsDatePicker startDate="" endDate="" />
    </MobileFiltersDrawer>
  )
}
