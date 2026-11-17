// False positive, as on the sibling routes: see the note in ../danger-map/route.ts.
// fallow-ignore-file dynamic-segment-name-conflicts
import { unknownCenterResponse } from '@/utilities/apiResponses'
import { getActiveAnnouncements } from '@/utilities/queries/getActiveAnnouncements'
import { isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { NextResponse } from 'next/server'

// Not cached by Next: a cached route handler is not purged by tag outside Vercel. The CDN holds
// each center's answer instead, for the window below.
export const dynamic = 'force-dynamic'

// How long a scheduled start or end, or a save in the admin, can take to reach the site. No
// stale-while-revalidate, which would stretch that by however long the center went unvisited.
const CACHE_CONTROL = 'public, max-age=0, s-maxage=60'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ center: string }> },
): Promise<NextResponse> {
  const { center } = await params
  if (!isValidTenantSlug(center)) return unknownCenterResponse()

  return NextResponse.json(await getActiveAnnouncements(center), {
    headers: { 'Cache-Control': CACHE_CONTROL },
  })
}
