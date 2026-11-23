// False positive, as on the sibling routes: see the note in ../danger-map/route.ts.
// fallow-ignore-file dynamic-segment-name-conflicts
import { unknownCenterResponse } from '@/utilities/apiResponses'
import { getActiveAnnouncements } from '@/utilities/queries/getActiveAnnouncements'
import { isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { NextResponse } from 'next/server'

// Cached per center like a page, so a save purges it by path (revalidateAnnouncement).
export const dynamic = 'force-static'

// How long a scheduled start or end can take to reach the site.
export const revalidate = 60

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ center: string }> },
): Promise<NextResponse> {
  const { center } = await params
  if (!isValidTenantSlug(center)) return unknownCenterResponse()

  return NextResponse.json(await getActiveAnnouncements(center))
}
