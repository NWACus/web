import { getCourses } from '@/actions/getCourses'
import { CoursesList } from '@/components/CoursesList'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

type Props = {
  searchParams: SearchParams
}

export default async function CoursesEmbedPage({ searchParams }: Props) {
  const params = await searchParams

  // Extract filter parameters
  const backgroundColor = params.backgroundColor as string
  const title = (params.title as string) || 'Courses'
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

  const { courses, hasMore, total } = await getCourses({
    ...filters,
    offset: 0,
    limit: 20,
  })

  return (
    <div className="min-h-screen p-6" style={backgroundColor ? { backgroundColor } : undefined}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {total} course{total !== 1 ? 's' : ''} found
          </p>
        </div>
        <CoursesList initialCourses={courses} initialHasMore={hasMore} filters={filters} />
      </div>
    </div>
  )
}
