import { buildZoneArchiveDates } from '@/services/nac/archiveDates'
import { fetchProductArchive, getAvalancheCenterMetadata } from '@/services/nac/nac'
import { resolveZoneFromSlug } from '@/services/nac/resolveZone'
import { NextRequest, NextResponse } from 'next/server'

// Matches a YYYY-MM-DD date.
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

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
  const zoneSlug = searchParams.get('zone')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (
    !zoneSlug ||
    !from ||
    !to ||
    !DATE_PATTERN.test(from) ||
    !DATE_PATTERN.test(to) ||
    from > to
  ) {
    return NextResponse.json({ error: 'Invalid zone/from/to parameters' }, { status: 400 })
  }

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
