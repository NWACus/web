// False positive: fallow reads `(payload)/api/[...slug]` and `api/[center]` as one dynamic path
// and predicts a runtime crash. Route groups keep the two trees separate — verified against a
// production build, where these routes answer and the Payload catch-all still resolves. The
// sibling freshness routes, in production since #1129, trip the same check.
// fallow-ignore-file dynamic-segment-name-conflicts
import { decorateZoneFeatures } from '@/services/nac/dangerMap/dangerMapZones'
import { getZoneMapLayer } from '@/services/nac/dangerMap/mapLayer'
import { NO_STORE, unknownCenterResponse } from '@/utilities/apiResponses'
import { isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { NextRequest, NextResponse } from 'next/server'

// Reads query params, so it must not be cached at the route level — the upstream fetch is where
// caching happens (30 minutes live, 24 hours for a past day).
export const dynamic = 'force-dynamic'

/** `YYYY-MM-DD`. Anything else is ignored rather than passed upstream. */
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

/** The requested archive day, or undefined for "today" — an unparseable value is not forwarded. */
function requestedDay(request: NextRequest): string | undefined {
  const day = request.nextUrl.searchParams.get('day')
  return day && ISO_DAY.test(day) ? day : undefined
}

/**
 * The danger map's data endpoint.
 *
 * Mapbox GL is browser-only, so the map is a client component and fetches its zones on mount
 * rather than receiving them as props from a statically generated page. That is deliberate: the
 * home page renders on a one-hour revalidate window, and a map painted from hour-old danger
 * ratings is exactly the staleness the legacy widget avoided by refetching on every page load.
 * Fetching here restores that, and keeps the browser off the NAC API — the source adapter, the
 * zod validation and the styling rules all stay server-side.
 *
 * Zones come back pre-styled (`decorateZoneFeatures`), so the client hands the FeatureCollection
 * straight to Mapbox and the paint expressions just read the computed properties.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ center: string }> },
) {
  const { center } = await params
  if (!isValidTenantSlug(center)) return unknownCenterResponse()

  const allCenters = request.nextUrl.searchParams.get('allCenters') === 'true'

  try {
    const mapLayer = await getZoneMapLayer(center, { day: requestedDay(request), allCenters })

    return NextResponse.json(
      { type: 'FeatureCollection', features: decorateZoneFeatures(mapLayer.features) },
      // Matches the upstream cache window so a burst of viewers shares one upstream request,
      // while still being far fresher than the host page's revalidate window.
      { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300' } },
    )
  } catch {
    // The map renders its own error state; there is nothing useful to say beyond "not available".
    return NextResponse.json({ error: 'Map layer unavailable' }, { status: 502, headers: NO_STORE })
  }
}
