import { getCourses } from '@/utilities/queries/getCourses'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const params = {
    offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : null,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : null,
    types: searchParams.get('types'),
    providers: searchParams.get('providers'),
    states: searchParams.get('states'),
    affinityGroups: searchParams.get('affinityGroups'),
    modesOfTravel: searchParams.get('modesOfTravel'),
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate'),
  }

  const result = await getCourses(params)

  if (result.error) {
    return NextResponse.json(result, { status: 500 })
  }

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
