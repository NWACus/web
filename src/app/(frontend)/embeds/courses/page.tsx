import { getCourses } from '@/actions/getCourses'
import { CoursesList } from '@/components/CoursesList'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

type Props = {
  searchParams: SearchParams
}

export default async function CoursesEmbedPage({ searchParams }: Props) {
  const params = await searchParams

  // Extract filter parameters
  const backgroundColor = params.backgroundColor
  const title = params.title
  const types = params.types as string
  const showPast = params.showPast as string
  const providers = params.providers as string
  const states = params.states as string
  const affinityGroups = params.affinityGroups as string
  const modesOfTravel = params.modesOfTravel as string
  const startDate = params.startDate as string
  const endDate = params.endDate as string

  // Fetch initial courses from server
  const filters = {
    types,
    showPast,
    providers,
    states,
    affinityGroups,
    modesOfTravel,
    startDate,
    endDate,
  }

  const { courses, hasMore } = await getCourses({
    ...filters,
    offset: 0,
    limit: 20,
  })

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
      <CoursesList initialCourses={courses} initialHasMore={hasMore} filters={filters} />
    </div>
  )
}
