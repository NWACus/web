'use client'

import { EventType } from '@/collections/Events/constants'
import { MobileFiltersDrawer } from '@/components/filters/MobileFiltersDrawer'
import { useFiltersTotalContext } from '@/contexts/FiltersTotalContext'
import { EventsDatePicker } from './events-date-filter'
import { EventsTypeFilter } from './events-type-filter'

type Props = {
  types: EventType[]
  hasActiveFilters: boolean
}

export const EventsMobileFilters = ({ types, hasActiveFilters }: Props) => {
  const { total } = useFiltersTotalContext()

  return (
    <MobileFiltersDrawer docLabel="events" docCount={total} hasActiveFilters={hasActiveFilters}>
      <EventsTypeFilter types={types} />
      <EventsDatePicker startDate="" endDate="" />
    </MobileFiltersDrawer>
  )
}
