'use client'

import { AffinityGroupsFilter } from '@/components/filters/AffinityGroupsFilter'
import { MobileFiltersDrawer } from '@/components/filters/MobileFiltersDrawer'
import { ModesOfTravelFilter } from '@/components/filters/ModesOfTravelFilter'
import { ProvidersFilter } from '@/components/filters/ProvidersFilter'
import { StatesFilter } from '@/components/filters/StatesFilter'
import { useFiltersTotalContext } from '@/contexts/FiltersTotalContext'
import { CoursesDateFilter } from './courses-date-filter'
import { CoursesTypeFilter } from './courses-type-filter'

type Provider = {
  id: number
  name: string
}

type State = {
  label: string
  value: string
}

type Props = {
  providers: Provider[]
  states: State[]
  hasActiveFilters: boolean
  startDate: string
  endDate: string
}

export const CoursesMobileFilters = ({
  providers,
  states,
  hasActiveFilters,
  startDate,
  endDate,
}: Props) => {
  const { total } = useFiltersTotalContext()

  return (
    <MobileFiltersDrawer docLabel="courses" docCount={total} hasActiveFilters={hasActiveFilters}>
      <CoursesDateFilter startDate={startDate} endDate={endDate} />
      <CoursesTypeFilter />
      <ProvidersFilter providers={providers} />
      <StatesFilter states={states} />
      <AffinityGroupsFilter />
      <ModesOfTravelFilter />
    </MobileFiltersDrawer>
  )
}
