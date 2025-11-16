'use client'

import { AffinityGroupsFilter } from '@/components/filters/AffinityGroupsFilter'
import { CheckboxFilter } from '@/components/filters/CheckboxFilter'
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
import { ModesOfTravelFilter } from '@/components/filters/ModesOfTravelFilter'
import { ProvidersFilter } from '@/components/filters/ProvidersFilter'
import { StatesFilter } from '@/components/filters/StatesFilter'
import { courseTypesData } from '@/constants/courseTypes'
import { QUICK_DATE_FILTERS } from './page'

export type FilterProvider = { id: number; name: string }
export type FilterState = { label: string; value: string }

export const CoursesFilters = ({
  startDate,
  endDate,
  states,
  providers,
}: {
  providers: FilterProvider[]
  states: FilterState[]
  startDate: string
  endDate: string
}) => {
  return (
    <>
      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        quickFilters={QUICK_DATE_FILTERS}
        title="Date Range"
        defaultOpen={true}
        titleClassName="text-lg"
      />
      <CheckboxFilter
        title="Course Type"
        urlParam="types"
        options={courseTypesData}
        titleClassName="text-lg"
      />
      <ProvidersFilter providers={providers} titleClassName="text-lg" />
      <StatesFilter states={states} titleClassName="text-lg" />
      <AffinityGroupsFilter titleClassName="text-lg" />
      <ModesOfTravelFilter showBottomBorder={false} titleClassName="text-lg" />
    </>
  )
}
