'use client'

import { MobileFiltersDrawer } from '@/components/filters/MobileFiltersDrawer'
import { EventType } from '@/constants/eventTypes'
import { useFiltersTotalContext } from '@/contexts/FiltersTotalContext'
import { EventsFilters, FiltersEventGroup, FiltersEventTag } from './EventsFilters'

type Props = {
  types: EventType[]
  groups: FiltersEventGroup[]
  tags: FiltersEventTag[]
  hasActiveFilters: boolean
  startDate: string
  endDate: string
}

export const EventsMobileFilters = ({
  types,
  groups,
  tags,
  hasActiveFilters,
  startDate,
  endDate,
}: Props) => {
  const { total } = useFiltersTotalContext()

  return (
    <MobileFiltersDrawer docLabel="events" docCount={total} hasActiveFilters={hasActiveFilters}>
      <EventsFilters
        startDate={startDate}
        endDate={endDate}
        types={types}
        groups={groups}
        tags={tags}
      />
    </MobileFiltersDrawer>
  )
}
