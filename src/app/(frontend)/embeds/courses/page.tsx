import { getCourses } from '@/actions/getCourses'
import { getCoursesStates } from '@/actions/getCoursesStates'
import { getProviders } from '@/actions/getProviders'
import { CoursesList } from '@/components/CoursesList'
import { FiltersTotalProvider } from '@/contexts/FiltersTotalContext'
import { createLoader, parseAsBoolean, parseAsString, SearchParams } from 'nuqs/server'
import { CoursesFilters } from './CoursesFilters'
import { CoursesMobileFilters } from './CoursesMobileFilters'

const coursesSearchParams = {
  backgroundColor: parseAsString,
  title: parseAsString,
  showFilters: parseAsBoolean.withDefault(false),
  types: parseAsString,
  providers: parseAsString,
  states: parseAsString,
  affinityGroups: parseAsString,
  modesOfTravel: parseAsString,
  startDate: parseAsString,
  endDate: parseAsString,
}
const loadSearchParams = createLoader(coursesSearchParams)

export default async function CoursesEmbedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const {
    backgroundColor,
    title,
    showFilters,
    types,
    providers,
    states,
    affinityGroups,
    modesOfTravel,
    startDate,
    endDate,
  } = await loadSearchParams(searchParams)

  const filters = {
    types,
    providers,
    states,
    affinityGroups,
    modesOfTravel,
    startDate,
    endDate,
  }

  const { courses, hasMore, total, error } = await getCourses(filters)

  const { providers: providersList } = showFilters ? await getProviders() : { providers: [] }
  const { states: statesList } = showFilters ? await getCoursesStates() : { states: [] }

  const hasActiveFilters = Boolean(
    types || providers || states || affinityGroups || modesOfTravel || startDate || endDate,
  )

  return (
    <FiltersTotalProvider initialTotal={total}>
      <div
        style={
          backgroundColor && typeof backgroundColor === 'string' ? { backgroundColor } : undefined
        }
      >
        {title && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">{title}</h1>
          </div>
        )}

        {showFilters && (
          <div className="md:hidden mb-4">
            <CoursesMobileFilters
              providers={providersList}
              states={statesList}
              hasActiveFilters={hasActiveFilters}
              startDate={startDate || ''}
              endDate={endDate || ''}
            />
          </div>
        )}

        <div className="flex gap-6">
          <div className="flex-1">
            <CoursesList initialCourses={courses} initialHasMore={hasMore} initialError={error} />
          </div>
          {showFilters && (
            <aside className="hidden md:block w-80 flex-shrink-0">
              <div className="sticky top-0">
                <CoursesFilters
                  startDate={startDate || ''}
                  endDate={endDate || ''}
                  states={statesList}
                  providers={providersList}
                />
              </div>
            </aside>
          )}
        </div>
      </div>
    </FiltersTotalProvider>
  )
}
