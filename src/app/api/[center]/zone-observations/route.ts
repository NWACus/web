// False positive: fallow reads `(payload)/api/[...slug]` and `api/[center]` as one dynamic path;
// see the note on the sibling danger-map route.
// fallow-ignore-file dynamic-segment-name-conflicts
import { getAvalancheCenterMetadata, logNacError } from '@/services/nac/nac'
import { resolveZoneFromSlug } from '@/services/nac/resolveZone'
import { getZoneObservations, showsZoneObservationTabs } from '@/services/nac/zoneObservations'
import { NO_STORE, productDisabledResponse } from '@/utilities/apiResponses'
import { nativeProductGate } from '@/utilities/nativeProductGate'
import { NextRequest, NextResponse } from 'next/server'

// Reads the zone from the query, so it can't be cached at the route level; the edge caches it.
export const dynamic = 'force-dynamic'

/**
 * The zone's last 7 days of observations and avalanches, for the native forecast page's tabs
 * (Forecast-9). Server-side because the obs API only answers allowlisted origins, which a Vercel
 * preview or a local port isn't.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ center: string }> },
) {
  const { center } = await params
  const gated = await nativeProductGate(center, 'forecast')
  if (gated) return gated
  if (!(await showsZoneObservationTabs(center))) return productDisabledResponse()

  const zoneSlug = request.nextUrl.searchParams.get('zone')
  const zone = zoneSlug ? await resolveZoneFromSlug(center, zoneSlug) : null
  if (!zone) return NextResponse.json({ error: 'Unknown zone' }, { status: 404, headers: NO_STORE })

  try {
    const metadata = await getAvalancheCenterMetadata(center)
    const body = await getZoneObservations(metadata.id, zone.zone.id, metadata.timezone ?? 'UTC')

    // A burst of readers shares one upstream request; a new observation shows within 5 minutes.
    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=60' },
    })
  } catch (error) {
    await logNacError(error, 'zone-observations error')
    return NextResponse.json(
      { error: 'Observations unavailable' },
      { status: 502, headers: NO_STORE },
    )
  }
}
