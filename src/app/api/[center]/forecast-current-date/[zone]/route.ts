// False positive: fallow reads `(payload)/api/[...slug]` and `api/[center]` as one dynamic path
// and predicts a runtime crash. Route groups keep the two trees separate — see the sibling
// `forecast-freshness` route, which carries the same waiver.
// fallow-ignore-file dynamic-segment-name-conflicts
import { validDateForProduct } from '@/services/nac/archiveDates'
import { getAvalancheCenterMetadata } from '@/services/nac/nac'
import { resolveZoneFromSlug } from '@/services/nac/resolveZone'
import { getForecastSource } from '@/services/nac/sources'
import { zoneSlugFromParam } from '@/services/nac/zoneSlug'
import { NO_STORE } from '@/utilities/apiResponses'
import { nativeProductGate } from '@/utilities/nativeProductGate'
import { NextResponse } from 'next/server'

/**
 * `force-dynamic` for the same reason as the freshness route: it keeps this route out of the
 * prerender manifest, so the CDN gets the Cache-Control set below rather than a baked response.
 */
export const dynamic = 'force-dynamic'

/** Matches the freshness check's edge TTL; with the 30s fresh read, a minute end to end. */
const EDGE_CACHE = 'public, max-age=0, s-maxage=30'

/** The valid date of the zone's live product, read fresh, or null when there is none. */
async function liveProductDate(center: string, zoneId: number): Promise<string | null> {
  const [product, metadata] = await Promise.all([
    getForecastSource(center).getForecastFresh(center, zoneId),
    getAvalancheCenterMetadata(center),
  ])
  if (!product) return null

  return validDateForProduct(product.published_time, metadata.timezone)
}

/**
 * The live product's valid date for an active zone, which a dated page compares with its own to
 * decide whether to send the reader to the live address (`currentForecastDate.ts`). A null date
 * — nothing published, or nothing we could read — means "stay", so it is safe to cache too. A
 * failure to read the zone list answers uncached, for the next viewer to retry.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ center: string; zone: string }> },
) {
  const { center, zone: zoneParam } = await params
  const blocked = await nativeProductGate(center, 'forecast')
  if (blocked) return blocked

  let date: string | null
  try {
    const zone = await resolveZoneFromSlug(center, zoneSlugFromParam(zoneParam))
    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404, headers: NO_STORE })
    }
    date = await liveProductDate(center, zone.zone.id)
  } catch {
    return NextResponse.json({ date: null }, { headers: NO_STORE })
  }

  return NextResponse.json({ date }, { headers: { 'Cache-Control': EDGE_CACHE } })
}
