import { GetCoursesStatesResults } from '@/actions/getCoursesStates'
import { GetProvidersResult } from '@/actions/getProviders'
import { AffinityGroupsFilter } from '@/components/filters/AffinityGroupsFilter'
import { CheckboxFilter } from '@/components/filters/CheckboxFilter'
import { DateRangeFilter } from '@/components/filters/DateRangeFilter'
import { ModesOfTravelFilter } from '@/components/filters/ModesOfTravelFilter'
import { ProvidersFilter } from '@/components/filters/ProvidersFilter'
import { StatesFilter } from '@/components/filters/StatesFilter'
import { courseTypesData } from '@/constants/courseTypes'
import { createQuickDateFilters } from '@/utilities/createQuickDateFilters'

const QUICK_DATE_FILTERS = createQuickDateFilters('Past Courses')

export const CoursesFilters = ({
  startDate,
  endDate,
  states,
  providers,
}: {
  providers: GetProvidersResult['providers']
  states: GetCoursesStatesResults['states']
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
      />
      <CheckboxFilter title="Course Type" urlParam="types" options={courseTypesData} />
      <ProvidersFilter providers={providers} />
      <StatesFilter states={states} />
      <AffinityGroupsFilter />
      <ModesOfTravelFilter showBottomBorder={false} />
    </>
  )
}
