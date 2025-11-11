'use client'

import { AffinityGroupsFilter } from '@/components/filters/AffinityGroupsFilter'
import { MobileFiltersDrawer } from '@/components/filters/MobileFiltersDrawer'
import { ModesOfTravelFilter } from '@/components/filters/ModesOfTravelFilter'
import { ProvidersFilter } from '@/components/filters/ProvidersFilter'
import { StatesFilter } from '@/components/filters/StatesFilter'
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
  courseCount: number
  providers: Provider[]
  states: State[]
  hasActiveFilters: boolean
  startDate: string
  endDate: string
}

export const CoursesMobileFilters = ({
  courseCount,
  providers,
  states,
  hasActiveFilters,
  startDate,
  endDate,
}: Props) => {
  return (
    <MobileFiltersDrawer
      docLabel="courses"
      docCount={courseCount}
      hasActiveFilters={hasActiveFilters}
    >
      <CoursesDateFilter startDate={startDate} endDate={endDate} />
      <CoursesTypeFilter />
      <ProvidersFilter providers={providers} />
      <StatesFilter states={states} />
      <AffinityGroupsFilter />
      <ModesOfTravelFilter />
    </MobileFiltersDrawer>
  )
}
