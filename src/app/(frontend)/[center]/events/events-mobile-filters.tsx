'use client'

import { MobileFiltersDrawer } from '@/components/filters/MobileFiltersDrawer'
import { ModesOfTravelFilter } from '@/components/filters/ModesOfTravelFilter'
import { EventType } from '@/constants/eventTypes'
import { useFiltersTotalContext } from '@/contexts/FiltersTotalContext'
import { EventsDatePicker } from './events-date-filter'
import { EventsGroupsFilter } from './events-groups-filter'
import { EventsTagsFilter } from './events-tags-filter'
import { EventsTypeFilter } from './events-type-filter'

type Props = {
  types: EventType[]
  groups: { label: string; value: string }[]
  tags: { label: string; value: string }[]
  hasActiveFilters: boolean
}

export const EventsMobileFilters = ({ types, groups, tags, hasActiveFilters }: Props) => {
  const { total } = useFiltersTotalContext()

  return (
    <MobileFiltersDrawer docLabel="events" docCount={total} hasActiveFilters={hasActiveFilters}>
      <EventsTypeFilter types={types} />
      <EventsGroupsFilter groups={groups} />
      <EventsTagsFilter tags={tags} />
      <ModesOfTravelFilter />
      <EventsDatePicker startDate="" endDate="" />
    </MobileFiltersDrawer>
  )
}
