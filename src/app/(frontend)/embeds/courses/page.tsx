import { getCourses } from '@/actions/getCourses'
import { getProviders } from '@/actions/getProviders'
import { CoursesList } from '@/components/CoursesList'
import { CoursesAffinityFilter } from './courses-affinity-filter'
import { CoursesDateFilter } from './courses-date-filter'
import { CoursesLocationFilter } from './courses-location-filter'
import { CoursesMobileFilters } from './courses-mobile-filters'
import { CoursesProviderFilter } from './courses-provider-filter'
import { CoursesTravelFilter } from './courses-travel-filter'
import { CoursesTypeFilter } from './courses-type-filter'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

type Props = {
  searchParams: SearchParams
}

export default async function CoursesEmbedPage({ searchParams }: Props) {
  const params = await searchParams

  // Extract filter parameters
  const backgroundColor = params.backgroundColor
  const title = params.title
  const showFilters = params.showFilters === 'true'
  const types = params.types as string
  const providers = params.providers as string
  const states = params.states as string
  const affinityGroups = params.affinityGroups as string
  const modesOfTravel = params.modesOfTravel as string
  const startDate = params.startDate as string
  const endDate = params.endDate as string

  // Fetch initial courses from server
  const filters = {
    types,
    providers,
    states,
    affinityGroups,
    modesOfTravel,
    startDate,
    endDate,
  }

  const { courses, hasMore, total } = await getCourses({
    ...filters,
    offset: 0,
    limit: 20,
  })

  // Fetch providers if filters are enabled
  const { providers: providersList } = showFilters ? await getProviders() : { providers: [] }

  // Check if any filters are active
  const hasActiveFilters = Boolean(
    types || providers || states || affinityGroups || modesOfTravel || startDate || endDate,
  )

  return (
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
            courseCount={total}
            providers={providersList}
            hasActiveFilters={hasActiveFilters}
            startDate={startDate || ''}
            endDate={endDate || ''}
          />
        </div>
      )}

      <div className="flex gap-6">
        <div className="flex-1">
          <CoursesList initialCourses={courses} initialHasMore={hasMore} filters={filters} />
        </div>
        {showFilters && (
          <aside className="hidden md:block w-80 flex-shrink-0">
            <div className="sticky top-0">
              <CoursesDateFilter startDate={startDate || ''} endDate={endDate || ''} />
              <CoursesTypeFilter />
              <CoursesProviderFilter providers={providersList} />
              <CoursesLocationFilter />
              <CoursesAffinityFilter />
              <CoursesTravelFilter />
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
