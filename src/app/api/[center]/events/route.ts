// False positive shared with the sibling `api/[center]` routes: route groups keep
// `(payload)/api/[...slug]` and `api/[center]` apart (see `danger-map/route.ts`).
// fallow-ignore-file dynamic-segment-name-conflicts
import { MAX_EVENTS_LIMIT } from '@/constants/defaults'
import { parseBoxParam } from '@/utilities/geo/boxParam'
import { parseNearParam } from '@/utilities/geo/nearParam'
import { getEvents } from '@/utilities/queries/getEvents'
import { NextRequest, NextResponse } from 'next/server'

// Public, and any new URL skips the CDN cache: cap how many full events one request loads.
const pageSize = (limit: string | null) =>
  limit ? Math.min(Number(limit), MAX_EVENTS_LIMIT) : null

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
    limit: pageSize(searchParams.get('limit')),
    types: parseArrayParam(searchParams.get('types')),
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate'),
    groups: parseArrayParam(searchParams.get('groups')),
    tags: parseArrayParam(searchParams.get('tags')),
    modesOfTravel: parseArrayParam(searchParams.get('modesOfTravel')),
    box: parseBoxParam(searchParams.get('bbox')),
    near: parseNearParam(searchParams.get('near')),
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
