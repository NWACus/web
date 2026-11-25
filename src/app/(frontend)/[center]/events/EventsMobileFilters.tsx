'use client'

import { MobileFiltersDrawer } from '@/components/filters/MobileFiltersDrawer'
import { EventType } from '@/constants/eventTypes'
import { useFiltersTotalContext } from '@/contexts/FiltersTotalContext'
import type { StartDateBounds } from '@/utilities/queries/getStartDateBounds'
import { EventsFilters, FiltersEventGroup, FiltersEventTag } from './EventsFilters'

type Props = {
  types: EventType[]
  groups: FiltersEventGroup[]
  tags: FiltersEventTag[]
  hasActiveFilters: boolean
  startDate: string
  endDate: string
  dateBounds: StartDateBounds
}

export const EventsMobileFilters = ({
  types,
  groups,
  tags,
  hasActiveFilters,
  startDate,
  endDate,
  dateBounds,
}: Props) => {
  const { total } = useFiltersTotalContext()

  return (
    <MobileFiltersDrawer docLabel="events" docCount={total} hasActiveFilters={hasActiveFilters}>
      <EventsFilters
        startDate={startDate}
        endDate={endDate}
        dateBounds={dateBounds}
        types={types}
        groups={groups}
        tags={tags}
      />
    </MobileFiltersDrawer>
  )
}
