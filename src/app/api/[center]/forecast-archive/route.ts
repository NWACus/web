// False positive: fallow reads `(payload)/api/[...slug]` and `api/[center]` as one dynamic path
// and predicts a runtime crash. Route groups keep the two trees separate — verified against a
// production build, where this route answers and the Payload catch-all still resolves. The sibling
// `warning-freshness`, `danger-map` and `og` routes carry the same waiver.
// fallow-ignore-file dynamic-segment-name-conflicts
import { buildZoneArchiveDates, parseArchiveWindowQuery } from '@/services/nac/archiveDates'
import { fetchProductArchive, getAvalancheCenterMetadata } from '@/services/nac/nac'
import { resolveZoneFromSlug } from '@/services/nac/resolveZone'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Lazy-load source for the forecast date picker's calendar. Returns the zone's published
 * forecast dates (with product id + danger rating) within a `from`..`to` window, so the
 * client calendar can color additional months on demand without the page ever shipping the
 * full archive. The underlying fetch narrows server-side via `date_start`/`date_end`.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ center: string }> },
) {
  const { center } = await params
  const searchParams = request.nextUrl.searchParams
  const query = parseArchiveWindowQuery(
    searchParams.get('zone'),
    searchParams.get('from'),
    searchParams.get('to'),
  )

  if (!query) {
    return NextResponse.json({ error: 'Invalid zone/from/to parameters' }, { status: 400 })
  }

  const { zoneSlug, from, to } = query
  const [zone, metadata] = await Promise.all([
    resolveZoneFromSlug(center, zoneSlug),
    getAvalancheCenterMetadata(center),
  ])

  if (!zone) {
    return NextResponse.json({ error: 'Zone not found' }, { status: 404 })
  }

  const archive = await fetchProductArchive(center, { from, to })
  const dates = buildZoneArchiveDates(archive, zone.zone.id, metadata.timezone)

  return NextResponse.json(
    { dates },
    {
      // Archive windows are effectively immutable; cache hard at the edge.
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400' },
    },
  )
}
