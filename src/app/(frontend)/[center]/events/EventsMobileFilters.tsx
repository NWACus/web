'use client'

import {
  setFiltersDrawerOpen,
  useFiltersDrawerOpen,
} from '@/components/EventsMap/filtersDrawerOpen'
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
  // Shared so the phone map view's floating Filters button opens this same drawer.
  const open = useFiltersDrawerOpen()

  return (
    <MobileFiltersDrawer
      docLabel="events"
      docCount={total}
      hasActiveFilters={hasActiveFilters}
      open={open}
      onOpenChange={setFiltersDrawerOpen}
    >
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
