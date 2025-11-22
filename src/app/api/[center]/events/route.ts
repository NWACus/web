import { getEvents } from '@/utilities/queries/getEvents'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ center: string }> },
) {
  const { center } = await params
  const searchParams = request.nextUrl.searchParams

  // Parse array parameters
  const parseArrayParam = (param: string | null): string[] | null => {
    if (!param) return null
    return param.split(',').filter(Boolean)
  }

  const queryParams = {
    offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : null,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : null,
    types: parseArrayParam(searchParams.get('types')),
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate'),
    groups: parseArrayParam(searchParams.get('groups')),
    tags: parseArrayParam(searchParams.get('tags')),
    modesOfTravel: parseArrayParam(searchParams.get('modesOfTravel')),
    center,
  }

  const result = await getEvents(queryParams)

  if (result.error) {
    return NextResponse.json(result, { status: 500 })
  }

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
