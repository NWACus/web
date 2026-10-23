// The same false positive the sibling `api/[center]` routes waive; see `forecast-current-date`.
// fallow-ignore-file dynamic-segment-name-conflicts
import {
  buildZoneArchiveDates,
  initialArchiveWindow,
  isCalendarDate,
  widgetArchiveAddress,
} from '@/services/nac/archiveDates'
import { fetchProductArchive, getAvalancheCenterMetadata } from '@/services/nac/nac'
import { resolveZoneFromSlug } from '@/services/nac/resolveZone'
import { getForecastSource } from '@/services/nac/sources'
import { NO_STORE, unknownCenterResponse } from '@/utilities/apiResponses'
import { isValidTenantSlug } from '@/utilities/tenancy/avalancheCenters'
import { NextRequest, NextResponse } from 'next/server'

/** Decided per request: which product is live changes daily (Forecast-242). */
export const dynamic = 'force-dynamic'

/** The live product read is 30s fresh; with this, a new publish is heard within a minute. */
const EDGE_CACHE = 'public, max-age=0, s-maxage=30'

/**
 * Where a widget center's dated address goes (the dated page redirects here): the widget's
 * archived-forecast address for that day's product, or the plain zone page when that product is
 * the live one, which the widget would label archived. A failed live read keeps the archived
 * address, as before.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ center: string }> },
) {
  const { center } = await params
  if (!isValidTenantSlug(center)) return unknownCenterResponse()

  const zoneSlug = request.nextUrl.searchParams.get('zone') ?? ''
  const date = request.nextUrl.searchParams.get('date') ?? ''
  if (!isCalendarDate(date)) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400, headers: NO_STORE })
  }

  const [zone, metadata] = await Promise.all([
    resolveZoneFromSlug(center, zoneSlug),
    getAvalancheCenterMetadata(center),
  ])
  if (!zone) {
    return NextResponse.json({ error: 'Zone not found' }, { status: 404, headers: NO_STORE })
  }

  const [archive, live] = await Promise.all([
    fetchProductArchive(center, initialArchiveWindow(date)),
    getForecastSource(center)
      .getForecastFresh(center, zone.zone.id)
      .catch(() => null),
  ])
  const dates = buildZoneArchiveDates(archive, zone.zone.id, metadata.timezone)
  const address = widgetArchiveAddress(
    { slug: zone.slug, zoneId: zone.zone.zone_id },
    dates,
    date,
    metadata.timezone,
    live?.id ?? null,
  )

  // Relative, so the reader stays on the center's own domain; the fragment carries the widget route.
  return new NextResponse(null, {
    status: 307,
    headers: { Location: address, 'Cache-Control': EDGE_CACHE },
  })
}
