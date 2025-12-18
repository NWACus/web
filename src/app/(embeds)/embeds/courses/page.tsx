import { A3Banner } from '@/components/A3Banner'
import { CoursesList } from '@/components/CoursesList'
import { FiltersTotalProvider } from '@/contexts/FiltersTotalContext'
import { getCourses } from '@/utilities/queries/getCourses'
import { getCoursesStates } from '@/utilities/queries/getCoursesStates'
import { getProviders } from '@/utilities/queries/getProviders'
import Script from 'next/script'
import { createLoader, parseAsBoolean, parseAsString, SearchParams } from 'nuqs/server'
import { CoursesFilters } from './CoursesFilters'
import { CoursesMobileFilters } from './CoursesMobileFilters'

const coursesSearchParams = {
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
    <>
      <FiltersTotalProvider initialTotal={total}>
        <div>
          {title && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">{title}</h1>
            </div>
          )}
          <A3Banner />

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
      <Script
        type="module"
        src="https://cdn.jsdelivr.net/npm/@open-iframe-resizer/core@latest/dist/index.js"
      />
    </>
  )
}
