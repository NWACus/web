'use client'

import { CheckboxFilter } from '@/components/filters/CheckboxFilter'
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
import { ModesOfTravelFilter } from '@/components/filters/ModesOfTravelFilter'
import { EventType } from '@/constants/eventTypes'
import { QUICK_DATE_FILTERS_EVENTS } from '@/constants/quickDateFilters'

export type FiltersEventGroup = { label: string; value: string }
export type FiltersEventTag = { label: string; value: string }

export const EventsFilters = ({
  startDate,
  endDate,
  types,
  groups,
  tags,
}: {
  types: EventType[]
  groups: FiltersEventGroup[]
  tags: FiltersEventTag[]
  startDate: string
  endDate: string
}) => {
  return (
    <>
      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        quickFilters={QUICK_DATE_FILTERS_EVENTS}
        title="Filter by date"
        defaultOpen={true}
      />
      <CheckboxFilter title="Filter by type" urlParam="types" options={types} defaultOpen={true} />
      <CheckboxFilter title="Groups" urlParam="groups" options={groups} defaultOpen={true} />
      <CheckboxFilter title="Tags" urlParam="tags" options={tags} defaultOpen={true} />
      <ModesOfTravelFilter showBottomBorder={false} />
    </>
  )
}
